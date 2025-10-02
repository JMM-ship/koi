/**
 * 手动重置积分功能测试
 * 目标：验证 UTC 天窗口、上限控制、并发安全（版本号）、流水记录
 */

import { prisma } from '@/app/models/db';
import { manualResetCredits } from '@/app/service/creditRecoveryService';
import {
  createTestUser,
  createTestPackage,
  createTestUserPackage,
  setWalletBalance,
  cleanupTestData,
} from '../helpers/testDb';

describe('manualResetCredits', () => {
  let testUserId: string;
  let testPackageId: string;

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await createTestUser({
      email: `manual-reset-${Date.now()}@test.com`,
    });
    testUserId = user.id;

    // 创建套餐，包含手动重置配置（每日1次）
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
    testPackageId = pkg.id;

    await createTestUserPackage(testUserId, testPackageId, { dailyPoints: 6000 });
  });

  test('应将余额提升到上限并创建重置流水', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await setWalletBalance(testUserId, {
      packageTokensRemaining: 3000,
      manualResetCount: 0,
      manualResetAt: yesterday,
    });

    const result = await manualResetCredits(testUserId);

    expect(result.success).toBe(true);
    expect(result.resetAmount).toBe(3000);
    expect(result.newBalance).toBe(6000);

    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet?.packageTokensRemaining).toBe(BigInt(6000));
    expect(wallet?.manualResetCount).toBe(1);
    expect(wallet?.manualResetAt).toBeTruthy();

    // 流水校验
    const tx = await prisma.creditTransaction.findFirst({
      where: { userId: testUserId, type: 'reset', bucket: 'package' },
      orderBy: { createdAt: 'desc' },
    });
    expect(tx).toBeTruthy();
    expect(tx?.tokens).toBe(3000);
    expect(tx?.reason).toContain('手动重置');
  });

  test('同一UTC日再次重置应失败（次数已用完）', async () => {
    // 第一次重置
    await setWalletBalance(testUserId, {
      packageTokensRemaining: 2000,
      manualResetCount: 0,
      manualResetAt: new Date(),
    });
    const first = await manualResetCredits(testUserId);
    expect(first.success).toBe(true);
    expect(first.resetAmount).toBe(4000);
    expect(first.newBalance).toBe(6000);

    // 第二次应失败
    const second = await manualResetCredits(testUserId);
    expect(second.success).toBe(false);
    expect(second.code).toBe('LIMIT_REACHED');

    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet?.manualResetCount).toBe(1);
  });

  test('已在上限时不应改变余额且返回 ALREADY_AT_CAP', async () => {
    await setWalletBalance(testUserId, {
      packageTokensRemaining: 6000, // 已满
      manualResetCount: 0,
      manualResetAt: new Date(),
    });

    const res = await manualResetCredits(testUserId);
    expect(res.success).toBe(false);
    expect(res.code).toBe('ALREADY_AT_CAP');
    expect(res.resetAmount).toBe(0);
    expect(res.newBalance).toBe(6000);

    // 不应新增 reset 类型流水
    const latest = await prisma.creditTransaction.findFirst({
      where: { userId: testUserId, type: 'reset', bucket: 'package' },
      orderBy: { createdAt: 'desc' },
    });
    // 允许为 null 或旧记录，但不应是刚刚新增的同一时刻记录；为简化，此处仅确保不存在新增（本用例前未创建 reset 流水）
    expect(latest).toBeNull();
  });

  test('无活跃套餐应失败', async () => {
    // 创建没有套餐的用户
    const user = await createTestUser({ email: `no-pkg-${Date.now()}@test.com` });
    const res = await manualResetCredits(user.id);
    expect(res.success).toBe(false);
    expect(res.code).toBe('NO_ACTIVE_PACKAGE');
  });

  test('跨日（UTC）应视为今日首次重置', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await setWalletBalance(testUserId, {
      packageTokensRemaining: 1000,
      manualResetCount: 1,
      manualResetAt: yesterday, // 上次是“昨天”
    });

    const res = await manualResetCredits(testUserId);
    expect(res.success).toBe(true);
    expect(res.resetAmount).toBe(5000);

    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet?.manualResetCount).toBe(1); // 跨日重新计数
  });
});

