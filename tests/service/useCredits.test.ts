/**
 * 积分消耗（useCredits）测试
 * 目标：仅对套餐积分做每日限额；无活跃套餐不做限额；
 *       用前自动恢复；混合扣减写一条流水且精确记录前后值；
 *       幂等（requestId）支持；并发安全（乐观锁+短重试）。
 */

import { prisma } from '@/app/models/db';
import { useCredits as useCreditsService } from '@/app/service/creditManager';
import {
  createTestUser,
  createTestPackage,
  createTestUserPackage,
  setWalletBalance,
  cleanupTestData,
  waitForDbReady,
} from '../helpers/testDb';

describe('useCredits (套餐限额 + 自动恢复 + 并发 + 幂等)', () => {
  let userId: string;
  let packageId: string;

  beforeAll(async () => {
    // 等待数据库连接就绪，避免远端偶发不可达导致的用例整体失败
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await createTestUser({ email: `use-credits-${Date.now()}@test.com` });
    userId = user.id;

    const pkg = await createTestPackage({
      name: 'Member',
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

    const amount = 1000;
    const res = await useCreditsService(userId, amount, 'UnitTest-Service', { case: 'package-only' }, { requestId: `req-${Date.now()}-1` });
    expect(res.success).toBe(true);
    expect(res.balance).toBeTruthy();
    expect(res.balance!.packageCredits).toBe(4000);
    expect(res.balance!.independentCredits).toBe(1000);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.packageTokensRemaining).toBe(BigInt(4000));
    // dailyUsageCount 只累计套餐使用量
    expect(wallet?.dailyUsageCount).toBe(BigInt(1000));

    const tx = await prisma.creditTransaction.findFirst({
      where: { userId, type: 'expense' },
      orderBy: { createdAt: 'desc' },
    });
    expect(tx).toBeTruthy();
    expect(tx?.bucket).toBe('package');
    expect(tx?.points).toBe(amount);
    expect(Number(tx?.beforePackageTokens)).toBe(5000);
    expect(Number(tx?.afterPackageTokens)).toBe(4000);
    expect(Number(tx?.beforeIndependentTokens)).toBe(1000);
    expect(Number(tx?.afterIndependentTokens)).toBe(1000);
  });

  test('达到每日限额但独立积分足够：仅独立扣减，限额不阻塞', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 6000,
      independentTokens: 3000,
      dailyUsageCount: 18000, // 已达上限
      dailyUsageResetAt: now,
      lastRecoveryAt: now,
    });

    const amount = 1000;
    const res = await useCreditsService(userId, amount, 'UnitTest-Service', { case: 'independent-only-after-limit' }, { requestId: `req-${Date.now()}-2` });
    expect(res.success).toBe(true);
    expect(res.balance).toBeTruthy();
    expect(res.balance!.packageCredits).toBe(6000);
    expect(res.balance!.independentCredits).toBe(2000);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    // dailyUsageCount 不增加（独立积分不计入每日限额）
    expect(wallet?.dailyUsageCount).toBe(BigInt(18000));

    const tx = await prisma.creditTransaction.findFirst({ where: { userId, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx).toBeTruthy();
    expect(tx?.bucket).toBe('independent');
    expect(Number(tx?.beforePackageTokens)).toBe(6000);
    expect(Number(tx?.afterPackageTokens)).toBe(6000);
    expect(Number(tx?.beforeIndependentTokens)).toBe(3000);
    expect(Number(tx?.afterIndependentTokens)).toBe(2000);
  });

  test('混合扣减：限额裁剪导致独立不足时优先返回 DAILY_LIMIT_REACHED', async () => {
    const now = new Date();
    await setWalletBalance(userId, {
      packageTokensRemaining: 6000, // 套餐余额充足
      independentTokens: 300,       // 独立余额不足
      dailyUsageCount: 17500,       // 余量 500
      dailyUsageResetAt: now,
      lastRecoveryAt: now,
    });

    const amount = 900; // 需要 500 套餐 + 400 独立，但独立只有 300
    const res = await useCreditsService(userId, amount, 'UnitTest-Service', { case: 'limit-priority' }, { requestId: `req-${Date.now()}-3` });
    expect(res.success).toBe(false);
    expect(res.error).toBe('DAILY_LIMIT_REACHED');
    expect((res as any).remainingToday).toBe(500);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    // 不应有变更
    expect(wallet?.packageTokensRemaining).toBe(BigInt(6000));
    expect(wallet?.independentTokens).toBe(BigInt(300));

    const tx = await prisma.creditTransaction.findFirst({ where: { userId, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    // 不应新增流水
    if (tx) {
      // 确保是之前用例留下的，不是本次新增
      expect(tx.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    }
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

    const amount = 900; // 500 套餐 + 400 独立
    const res = await useCreditsService(userId, amount, 'UnitTest-Service', { case: 'mixed-success' }, { requestId: `req-${Date.now()}-4` });
    expect(res.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.packageTokensRemaining).toBe(BigInt(5500)); // 6000 - 500
    expect(wallet?.independentTokens).toBe(BigInt(600));      // 1000 - 400
    expect(wallet?.dailyUsageCount).toBe(BigInt(18000));      // +500

    const tx = await prisma.creditTransaction.findFirst({ where: { userId, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx).toBeTruthy();
    expect(tx?.bucket).toBe('package'); // 混合场景按 package 记
    expect(tx?.points).toBe(amount);
    expect(Number(tx?.beforePackageTokens)).toBe(6000);
    expect(Number(tx?.afterPackageTokens)).toBe(5500);
    expect(Number(tx?.beforeIndependentTokens)).toBe(1000);
    expect(Number(tx?.afterIndependentTokens)).toBe(600);
  });

  test('无活跃套餐：不做限额，仅消耗独立积分', async () => {
    // 创建一个无套餐的新用户
    const user = await createTestUser({ email: `no-active-${Date.now()}@test.com` });
    const u = user.id;
    await setWalletBalance(u, {
      packageTokensRemaining: 0,
      independentTokens: 800,
      dailyUsageCount: 0,
      lastRecoveryAt: new Date(),
    });

    const amount = 500;
    const res = await useCreditsService(u, amount, 'UnitTest-Service', { case: 'no-active-only-independent' }, { requestId: `req-${Date.now()}-5` });
    expect(res.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: u } });
    expect(wallet?.independentTokens).toBe(BigInt(300));
    expect(wallet?.dailyUsageCount).toBe(BigInt(0)); // 不累计

    const tx = await prisma.creditTransaction.findFirst({ where: { userId: u, type: 'expense' }, orderBy: { createdAt: 'desc' } });
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

    const amount = 700;
    const requestId = `req-${Date.now()}-6`;
    const r1 = await useCreditsService(userId, amount, 'UnitTest-Service', { idem: true }, { requestId });
    const r2 = await useCreditsService(userId, amount, 'UnitTest-Service', { idem: true }, { requestId });

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.balance?.packageCredits).toBe(1300);
    expect(r2.balance?.packageCredits).toBe(1300);

    const txs = await prisma.creditTransaction.findMany({ where: { userId, type: 'expense', requestId } });
    expect(txs.length).toBe(1);
  });

  test('用前自动恢复：先恢复再消费（不阻塞）', async () => {
    // 1 小时前，会员速度 500/h
    const last = new Date(Date.now() - 60 * 60 * 1000);
    await setWalletBalance(userId, {
      packageTokensRemaining: 1000,
      independentTokens: 0,
      dailyUsageCount: 0,
      lastRecoveryAt: last,
    });

    const amount = 600; // 恢复 500 后余额 1500，再消费 600 => 900
    const res = await useCreditsService(userId, amount, 'UnitTest-Service', { case: 'auto-recover-before-use' }, { requestId: `req-${Date.now()}-7` });
    expect(res.success).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining)).toBeGreaterThanOrEqual(900);
    expect(Number(wallet?.packageTokensRemaining)).toBeLessThanOrEqual(910); // 考虑微小延迟误差
  });
});
