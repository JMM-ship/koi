/**
 * 集成测试（确定性）：hourlyRecoveryJob 注入 now
 * - 通过传入固定 now，消除时间漂移，断言精确恢复量
 * - 使用 concurrency=1、pageSize=2，降低并发不确定性
 */

import { prisma } from '@/app/models/db';
import { hourlyRecoveryJob } from '@/app/service/cronJobs';
import {
  createTestUser,
  createTestPackage,
  createTestUserPackage,
  setWalletBalance,
  cleanupTestData,
  waitForDbReady,
} from '../helpers/testDb';

jest.setTimeout(240000);

describe('E2E - hourlyRecoveryJob (deterministic with injected now)', () => {
  const FIXED_NOW = new Date(Date.UTC(2025, 0, 2, 3, 0, 0)); // 2025-01-02 03:00:00Z

  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  test('注入 now：精确按速率恢复且不超过上限', async () => {
    // U1 - member: cap 6000, rate 500/h，从 5000 开始
    const u1 = await createTestUser({ email: `integ-job-det-u1-${Date.now()}@test.com` });
    const p1 = await createTestPackage({
      name: 'JobDet Member', planType: 'basic', dailyPoints: 6000,
      features: { creditCap: 6000, recoveryRate: 500, dailyUsageLimit: 18000, manualResetPerDay: 1 },
    });
    await createTestUserPackage(u1.id, p1.id, { dailyPoints: 6000 });
    const oneHourBefore = new Date(FIXED_NOW.getTime() - 60 * 60 * 1000);
    await setWalletBalance(u1.id, { packageTokensRemaining: 5000, lastRecoveryAt: oneHourBefore });

    // U2 - premium: cap 10000, rate 1000/h，从 5000 开始
    const u2 = await createTestUser({ email: `integ-job-det-u2-${Date.now()}@test.com` });
    const p2 = await createTestPackage({
      name: 'JobDet Premium', planType: 'pro', dailyPoints: 10000,
      features: { creditCap: 10000, recoveryRate: 1000, dailyUsageLimit: 34000, manualResetPerDay: 1 },
    });
    await createTestUserPackage(u2.id, p2.id, { dailyPoints: 10000 });
    await setWalletBalance(u2.id, { packageTokensRemaining: 5000, lastRecoveryAt: oneHourBefore });

    // U3 - vip: cap 15000, rate 2500/h，从 14000 开始（只恢复到上限 +1000）
    const u3 = await createTestUser({ email: `integ-job-det-u3-${Date.now()}@test.com` });
    const p3 = await createTestPackage({
      name: 'JobDet VIP', planType: 'enterprise', dailyPoints: 15000,
      features: { creditCap: 15000, recoveryRate: 2500, dailyUsageLimit: 75000, manualResetPerDay: 1 },
    });
    await createTestUserPackage(u3.id, p3.id, { dailyPoints: 15000 });
    await setWalletBalance(u3.id, { packageTokensRemaining: 14000, lastRecoveryAt: oneHourBefore });

    // 等待短暂时间，确保写入可见
    await new Promise((r) => setTimeout(r, 300));

    // 执行作业（注入 now，确保确定性），保守并发，强制分页
    const result = await hourlyRecoveryJob({ now: FIXED_NOW, pageSize: 2, concurrency: 1 });
    expect(result.success).toBe(true);

    // 简单的轮询读取，直到达到预期或超时
    async function waitForExactPackageBalance(userId: string, expected: number, tries = 20, gapMs = 150) {
      for (let i = 0; i < tries; i++) {
        const w = await prisma.wallet.findUnique({ where: { userId } });
        const remain = Number(w?.packageTokensRemaining || 0n);
        if (remain === expected) return remain;
        await new Promise((r) => setTimeout(r, gapMs));
      }
      const w = await prisma.wallet.findUnique({ where: { userId } });
      return Number(w?.packageTokensRemaining || 0n);
    }

    const u1Remain = await waitForExactPackageBalance(u1.id, 5500);
    const u2Remain = await waitForExactPackageBalance(u2.id, 6000);
    const u3Remain = await waitForExactPackageBalance(u3.id, 15000);

    expect(u1Remain).toBe(5500); // 恢复 500
    expect(u2Remain).toBe(6000); // 恢复 1000
    expect(u3Remain).toBe(15000); // 恢复到上限（+1000）

    // 校验流水：最近一条应匹配精确增量
    const tx1 = await prisma.creditTransaction.findFirst({ where: { userId: u1.id, type: 'income', bucket: 'package' }, orderBy: { createdAt: 'desc' } });
    const tx2 = await prisma.creditTransaction.findFirst({ where: { userId: u2.id, type: 'income', bucket: 'package' }, orderBy: { createdAt: 'desc' } });
    const tx3 = await prisma.creditTransaction.findFirst({ where: { userId: u3.id, type: 'income', bucket: 'package' }, orderBy: { createdAt: 'desc' } });
    expect(tx1).toBeTruthy();
    expect(tx2).toBeTruthy();
    expect(tx3).toBeTruthy();
    expect(tx1?.tokens).toBe(500);
    expect(tx2?.tokens).toBe(1000);
    expect(tx3?.tokens).toBe(1000); // 到 cap 的实际增量
    expect((tx1?.reason || '')).toContain('自动恢复');
    expect((tx2?.reason || '')).toContain('自动恢复');
    expect((tx3?.reason || '')).toContain('自动恢复');
  });
});

