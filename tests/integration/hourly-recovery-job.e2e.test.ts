/**
 * 集成测试：hourlyRecoveryJob（每小时恢复任务）
 * - 分页与并发触发 autoRecoverCredits
 * - 校验不同套餐恢复速率与上限
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

describe('E2E - hourlyRecoveryJob', () => {
  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
    // 设置较小的分页与并发，验证分页与分片
    process.env.HOURLY_RECOVERY_PAGE_SIZE = '2';
    process.env.HOURLY_RECOVERY_CONCURRENCY = '2';
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  test('应按不同套餐速率恢复且不超过上限', async () => {
    // U1 - member: cap 6000, rate 500/h，从 5000 开始
    const u1 = await createTestUser({ email: `integ-job-u1-${Date.now()}@test.com` });
    const p1 = await createTestPackage({
      name: 'Job Member', planType: 'basic', dailyPoints: 6000,
      features: { creditCap: 6000, recoveryRate: 500, dailyUsageLimit: 18000, manualResetPerDay: 1 },
    });
    await createTestUserPackage(u1.id, p1.id, { dailyPoints: 6000 });
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await setWalletBalance(u1.id, { packageTokensRemaining: 5000, lastRecoveryAt: oneHourAgo });

    // U2 - premium: cap 10000, rate 1000/h，从 5000 开始
    const u2 = await createTestUser({ email: `integ-job-u2-${Date.now()}@test.com` });
    const p2 = await createTestPackage({
      name: 'Job Premium', planType: 'pro', dailyPoints: 10000,
      features: { creditCap: 10000, recoveryRate: 1000, dailyUsageLimit: 34000, manualResetPerDay: 1 },
    });
    await createTestUserPackage(u2.id, p2.id, { dailyPoints: 10000 });
    await setWalletBalance(u2.id, { packageTokensRemaining: 5000, lastRecoveryAt: oneHourAgo });

    // U3 - vip: cap 15000, rate 2500/h，从 14000 开始（只恢复到上限 +1000）
    const u3 = await createTestUser({ email: `integ-job-u3-${Date.now()}@test.com` });
    const p3 = await createTestPackage({
      name: 'Job VIP', planType: 'enterprise', dailyPoints: 15000,
      features: { creditCap: 15000, recoveryRate: 2500, dailyUsageLimit: 75000, manualResetPerDay: 1 },
    });
    await createTestUserPackage(u3.id, p3.id, { dailyPoints: 15000 });
    await setWalletBalance(u3.id, { packageTokensRemaining: 14000, lastRecoveryAt: oneHourAgo });

    // 等待片刻，确保上面的写入与套餐创建可见
    await new Promise((r) => setTimeout(r, 600));

    const result = await hourlyRecoveryJob();
    expect(result.success).toBe(true);

    // 等待片刻，避免读写延迟
    await new Promise((r) => setTimeout(r, 500));
    const w1 = await prisma.wallet.findUnique({ where: { userId: u1.id } });
    const w2 = await prisma.wallet.findUnique({ where: { userId: u2.id } });
    const w3 = await prisma.wallet.findUnique({ where: { userId: u3.id } });

    // 允许少量时间漂移导致的额外恢复（±10）
    const w1Remain = Number(w1?.packageTokensRemaining || 0n);
    expect(w1Remain).toBeGreaterThanOrEqual(5500);
    expect(w1Remain).toBeLessThanOrEqual(5510);
    const w2Remain = Number(w2?.packageTokensRemaining || 0n);
    expect(w2Remain).toBeGreaterThanOrEqual(6000);
    expect(w2Remain).toBeLessThanOrEqual(6010);
    // 允许 vip 恢复到上限，不超过 15000
    expect(Number(w3?.packageTokensRemaining || 0n)).toBe(15000);

    // 每个用户应有一条 income/package 流水（自动恢复）
    for (const uid of [u1.id, u2.id, u3.id]) {
      const tx = await prisma.creditTransaction.findFirst({ where: { userId: uid, type: 'income', bucket: 'package' }, orderBy: { createdAt: 'desc' } });
      expect(tx).toBeTruthy();
      expect((tx?.reason || '')).toContain('自动恢复');
    }
  });
});
