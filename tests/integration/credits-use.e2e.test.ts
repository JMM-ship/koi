/**
 * 集成测试：POST /api/credits/use
 * - 每日限额仅限制套餐积分
 * - 混合扣减一条流水，四个 before/after 精确
 * - 幂等 requestId 支持
 * - 用前自动恢复
 */

import { prisma } from '@/app/models/db';
import { POST as useCreditsRoute } from '@/app/api/credits/use/route';
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

describe('E2E - POST /api/credits/use', () => {
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
    // 新用户与活跃套餐
    const user = await createTestUser({ email: `integ-use-${Date.now()}@test.com` });
    userId = user.id;
    email = user.email;

    const pkg = await createTestPackage({
      name: 'Use Member',
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

    // session
    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: userId, id: userId, email } });
  });

  test('未达每日限额：仅套餐扣减，dailyUsageCount 仅累计套餐部分', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 5000,
      independentTokens: 1000,
      dailyUsageCount: 0,
      dailyUsageResetAt: now,
      lastRecoveryAt: now,
    });

    const requestId = `req-${Date.now()}-1`;
    const req: any = {
      json: async () => ({ amount: 1000, service: 'UnitTest', metadata: { case: 'package-only' }, requestId }),
    };
    const res = await useCreditsRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(4000);
    expect(Number(wallet?.independentTokens || 0n)).toBe(1000);
    expect(Number(wallet?.dailyUsageCount || 0n)).toBe(1000);

    const tx = await prisma.creditTransaction.findFirst({
      where: { userId, type: 'expense' },
      orderBy: { createdAt: 'desc' },
    });
    expect(tx).toBeTruthy();
    expect(tx?.bucket).toBe('package');
    expect(Number(tx?.points || 0)).toBe(1000);
    expect(Number(tx?.beforePackageTokens || 0n)).toBe(5000);
    expect(Number(tx?.afterPackageTokens || 0n)).toBe(4000);
    expect(Number(tx?.beforeIndependentTokens || 0n)).toBe(1000);
    expect(Number(tx?.afterIndependentTokens || 0n)).toBe(1000);
  });

  test('达到每日限额但独立积分足够：仅独立扣减，限额不阻塞', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 6000,
      independentTokens: 3000,
      dailyUsageCount: 18000,
      dailyUsageResetAt: now,
      lastRecoveryAt: now,
    });

    const req: any = {
      json: async () => ({ amount: 1000, service: 'UnitTest', metadata: { case: 'independent-only-after-limit' }, requestId: `req-${Date.now()}-2` }),
    };
    const res = await useCreditsRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(6000);
    expect(Number(wallet?.independentTokens || 0n)).toBe(2000);
    expect(Number(wallet?.dailyUsageCount || 0n)).toBe(18000);

    const tx = await prisma.creditTransaction.findFirst({ where: { userId, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx?.bucket).toBe('independent');
  });

  test('混合扣减：限额裁剪导致独立不足时优先返回 DAILY_LIMIT_REACHED', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 6000,
      independentTokens: 300,
      dailyUsageCount: 17500, // 余量 500
      dailyUsageResetAt: now,
      lastRecoveryAt: now,
    });

    const req: any = {
      json: async () => ({ amount: 900, service: 'UnitTest', metadata: { case: 'limit-priority' }, requestId: `req-${Date.now()}-3` }),
    };
    const res = await useCreditsRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(false);
    expect(data?.error?.code).toBe('DAILY_LIMIT_REACHED');
    expect(data?.remainingToday).toBe(500);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(6000);
    expect(Number(wallet?.independentTokens || 0n)).toBe(300);
  });

  test('混合扣减成功：套餐受限 + 独立补足，记录一条流水并精确四字段', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 6000,
      independentTokens: 1000,
      dailyUsageCount: 17500, // 余量 500
      dailyUsageResetAt: now,
      lastRecoveryAt: now,
    });

    const req: any = {
      json: async () => ({ amount: 900, service: 'UnitTest', metadata: { case: 'mixed-success' }, requestId: `req-${Date.now()}-4` }),
    };
    const res = await useCreditsRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(5500); // 6000 - 500
    expect(Number(wallet?.independentTokens || 0n)).toBe(600);      // 1000 - 400
    expect(Number(wallet?.dailyUsageCount || 0n)).toBe(18000);      // +500

    const tx = await prisma.creditTransaction.findFirst({ where: { userId, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx).toBeTruthy();
    expect(tx?.bucket).toBe('package');
    expect(Number(tx?.points || 0)).toBe(900);
    expect(Number(tx?.beforePackageTokens || 0n)).toBe(6000);
    expect(Number(tx?.afterPackageTokens || 0n)).toBe(5500);
    expect(Number(tx?.beforeIndependentTokens || 0n)).toBe(1000);
    expect(Number(tx?.afterIndependentTokens || 0n)).toBe(600);
  });

  test('无活跃套餐：不做限额，仅消耗独立积分', async () => {
    // 新建无套餐用户
    const u = await createTestUser({ email: `integ-use-nopkg-${Date.now()}@test.com` });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: u.id, id: u.id, email: u.email } });

    await setWalletBalance(u.id, {
      packageTokensRemaining: 0,
      independentTokens: 800,
      dailyUsageCount: 0,
      lastRecoveryAt: new Date(),
    });

    const req: any = {
      json: async () => ({ amount: 500, service: 'UnitTest', metadata: { case: 'no-active-only-independent' }, requestId: `req-${Date.now()}-5` }),
    };
    const res = await useCreditsRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: u.id } });
    expect(Number(wallet?.independentTokens || 0n)).toBe(300);
    expect(Number(wallet?.dailyUsageCount || 0n)).toBe(0);

    const tx = await prisma.creditTransaction.findFirst({ where: { userId: u.id, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx?.bucket).toBe('independent');
  });

  test('幂等（requestId）：相同请求只扣减一次且仅一条流水', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 2000,
      independentTokens: 0,
      dailyUsageCount: 0,
      lastRecoveryAt: now,
    });

    const requestId = `req-${Date.now()}-6`;
    const req: any = {
      json: async () => ({ amount: 700, service: 'UnitTest', metadata: { idem: true }, requestId }),
    };
    const r1 = await useCreditsRoute(req as any);
    const r2 = await useCreditsRoute(req as any);
    const d1 = await (r1 as any).json();
    const d2 = await (r2 as any).json();
    expect(d1?.success).toBe(true);
    expect(d2?.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(1300);
    const txs = await prisma.creditTransaction.findMany({ where: { userId, type: 'expense', requestId } });
    expect(txs.length).toBe(1);
  });

  test('用前自动恢复：先恢复再消费（不阻塞）', async () => {
    const last = new Date(Date.now() - 60 * 60 * 1000);
    await setWalletBalance(userId, {
      packageTokensRemaining: 1000,
      independentTokens: 0,
      dailyUsageCount: 0,
      lastRecoveryAt: last,
    });

    const req: any = {
      json: async () => ({ amount: 600, service: 'UnitTest', metadata: { case: 'auto-recover-before-use' }, requestId: `req-${Date.now()}-7` }),
    };
    const res = await useCreditsRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const remaining = Number(wallet?.packageTokensRemaining || 0n);
    expect(remaining).toBeGreaterThanOrEqual(900);
    expect(remaining).toBeLessThanOrEqual(910); // 允许微小误差
  });
});

