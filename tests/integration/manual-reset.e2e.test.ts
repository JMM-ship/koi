/**
 * 集成测试：POST /api/credits/manual-reset
 * - 首次重置到上限并写 reset 流水
 * - 当日第二次限制（LIMIT_REACHED）
 * - 已在上限返回 ALREADY_AT_CAP
 * - 无活跃套餐返回 NO_ACTIVE_PACKAGE
 */

import { prisma } from '@/app/models/db';
import { POST as manualResetRoute } from '@/app/api/credits/manual-reset/route';
import {
  createTestUser,
  createTestPackage,
  createTestUserPackage,
  setWalletBalance,
  cleanupTestData,
  waitForDbReady,
} from '../helpers/testDb';

// mock next-auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth';

jest.setTimeout(240000);

describe('E2E - POST /api/credits/manual-reset', () => {
  let userId: string;
  let email: string;
  let packageId: string;

  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await createTestUser({ email: `integ-reset-${Date.now()}@test.com` });
    userId = user.id;
    email = user.email;

    const pkg = await createTestPackage({
      name: 'Reset Member',
      planType: 'basic',
      dailyPoints: 6000,
      features: {
        creditCap: 6000,
        recoveryRate: 500,
        dailyUsageLimit: 18000,
        manualResetPerDay: 1,
      },
    });
    packageId = pkg.id;
    await createTestUserPackage(userId, packageId, { dailyPoints: 6000 });

    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: userId, id: userId, email } });

    // 等待活跃套餐可见（远端一致性）
    for (let i = 0; i < 10; i++) {
      const up = await prisma.userPackage.findFirst({ where: { userId, isActive: true } });
      if (up) break;
      await new Promise((r) => setTimeout(r, 300));
    }
  });

  test('首次重置应到达上限并写 reset 流水', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await setWalletBalance(userId, {
      packageTokensRemaining: 3000,
      manualResetCount: 0,
      lastRecoveryAt: yesterday,
    });

    const res = await manualResetRoute({} as any);
    const data = await (res as any).json();
    if (!data?.success) {
      // 输出调试信息以定位失败原因
      // eslint-disable-next-line no-console
      console.error('manual-reset API response (debug):', data);
    }
    expect(data?.success).toBe(true);
    expect(data?.data?.resetAmount).toBe(3000);
    expect(data?.data?.newBalance).toBe(6000);
    expect(typeof data?.data?.resetsRemainingToday).toBe('number');
    expect(typeof data?.data?.nextAvailableAtUtc).toBe('string');

    // 等待片刻以避免远端读写延迟
    await new Promise((r) => setTimeout(r, 500));
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(6000);
    expect((wallet?.manualResetCount || 0)).toBeGreaterThanOrEqual(1);

    const tx = await prisma.creditTransaction.findFirst({ where: { userId, type: 'reset', bucket: 'package' }, orderBy: { createdAt: 'desc' } });
    expect(tx).toBeTruthy();
    expect(Number(tx?.points || 0)).toBe(3000);
  });

  test('同一 UTC 日第二次应返回 LIMIT_REACHED', async () => {
    await setWalletBalance(userId, {
      packageTokensRemaining: 2000,
      manualResetCount: 0,
      lastRecoveryAt: new Date(),
    });

    // 第一次
    await new Promise((r) => setTimeout(r, 500));
    const r1 = await manualResetRoute({} as any);
    const d1 = await (r1 as any).json();
    expect(d1?.success).toBe(true);

    // 第二次
    await new Promise((r) => setTimeout(r, 500));
    const r2 = await manualResetRoute({} as any);
    const d2 = await (r2 as any).json();
    if (d2?.success) {
      // eslint-disable-next-line no-console
      console.error('manual-reset API expected failure but got success (debug):', d2);
    }
    expect(d2?.success).toBe(false);
    expect(d2?.error?.code).toBe('LIMIT_REACHED');
    expect(typeof d2?.resetsRemainingToday).toBe('number');
    expect(typeof d2?.nextAvailableAtUtc).toBe('string');
  });

  test('已在上限返回 ALREADY_AT_CAP 且不写流水', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 6000,
      manualResetCount: 0,
      lastRecoveryAt: now,
    });

    const beforeTx = await prisma.creditTransaction.count({ where: { userId, type: 'reset', bucket: 'package' } });
    // 等待片刻，避免读写延迟导致活跃套餐不可见
    await new Promise((r) => setTimeout(r, 500));
    const res = await manualResetRoute({} as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(false);
    expect(data?.error?.code).toBe('ALREADY_AT_CAP');

    const afterTx = await prisma.creditTransaction.count({ where: { userId, type: 'reset', bucket: 'package' } });
    expect(afterTx).toBe(beforeTx); // 未新增
  });

  test('无活跃套餐应返回 NO_ACTIVE_PACKAGE', async () => {
    const u = await createTestUser({ email: `integ-reset-nopkg-${Date.now()}@test.com` });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: u.id, id: u.id, email: u.email } });

    const res = await manualResetRoute({} as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(false);
    expect(data?.error?.code).toBe('NO_ACTIVE_PACKAGE');
  });
});
