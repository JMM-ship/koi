/**
 * 自动恢复积分功能测试
 * 测试从数据库读取数据、计算恢复、更新数据库的完整流程
 */

import { prisma } from '@/app/models/db';
import { autoRecoverCredits } from '@/app/service/creditRecoveryService';
import {
  createTestUser,
  createTestPackage,
  createTestUserPackage,
  setWalletBalance,
  cleanupTestData,
} from '../helpers/testDb';

describe('autoRecoverCredits', () => {
  let testUserId: string;
  let testPackageId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前创建新的测试数据
    const user = await createTestUser({
      email: `auto-recovery-${Date.now()}@test.com`,
    });
    testUserId = user.id;

    // 创建会员套餐
    const pkg = await createTestPackage({
      name: 'Member',
      planType: 'basic', // 符合数据库约束
      dailyPoints: 6000,
      features: {
        creditCap: 6000,
        recoveryRate: 500,
        dailyUsageLimit: 18000,
        manualResetPerDay: 1,
      },
    });
    testPackageId = pkg.id;

    // 创建用户套餐
    await createTestUserPackage(testUserId, testPackageId, {
      dailyPoints: 6000,
    });
  });

  describe('基础恢复功能', () => {
    test('应该正确恢复积分并更新数据库', async () => {
      // 设置初始状态：5000积分，1小时前恢复过
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 5000,
        lastRecoveryAt: oneHourAgo,
      });

      // 执行恢复
      const result = await autoRecoverCredits(testUserId);

      // 验证返回结果
      expect(result.success).toBe(true);
      expect(result.recovered).toBe(500); // 1小时 × 500/小时
      expect(result.newBalance).toBe(5500);

      // 验证数据库更新
      const wallet = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      expect(wallet?.packageTokensRemaining).toBe(BigInt(5500));
      expect(wallet?.lastRecoveryAt).toBeTruthy();
      expect(wallet?.lastRecoveryAt!.getTime()).toBeGreaterThan(oneHourAgo.getTime());
    });

    test('应该创建积分流水记录', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 5000,
        lastRecoveryAt: oneHourAgo,
      });

      await autoRecoverCredits(testUserId);

      // 验证流水记录
      const transaction = await prisma.creditTransaction.findFirst({
        where: {
          userId: testUserId,
          type: 'income',
          bucket: 'package',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(transaction).toBeTruthy();
      expect(transaction?.tokens).toBe(500);
      expect(transaction?.reason).toContain('自动恢复');
    });

    test('多次调用应该累积恢复', async () => {
      // 第一次：1小时前，恢复500
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 4000,
        lastRecoveryAt: oneHourAgo,
      });

      const result1 = await autoRecoverCredits(testUserId);
      expect(result1.recovered).toBe(500);
      expect(result1.newBalance).toBe(4500);

      // 立即再次调用应该不恢复（时间未过）
      const result2 = await autoRecoverCredits(testUserId);
      expect(result2.recovered).toBe(0);
      expect(result2.newBalance).toBe(4500);
    });
  });

  describe('边界情况处理', () => {
    test('无活跃套餐时应失败', async () => {
      // 创建没有套餐的用户
      const userWithoutPackage = await createTestUser({
        email: `no-package-${Date.now()}@test.com`,
      });

      const result = await autoRecoverCredits(userWithoutPackage.id);

      expect(result.success).toBe(false);
      expect(result.recovered).toBe(0);
      expect(result.newBalance).toBe(0);
    });

    test('无需恢复时应返回0', async () => {
      // 刚刚恢复过（0秒前）
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 5000,
        lastRecoveryAt: new Date(), // 当前时间
      });

      const result = await autoRecoverCredits(testUserId);

      expect(result.success).toBe(true);
      expect(result.recovered).toBe(0);
      expect(result.newBalance).toBe(5000);
    });

    test('已达上限时不恢复', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 6000, // 已满
        lastRecoveryAt: oneHourAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      expect(result.success).toBe(true);
      expect(result.recovered).toBe(0);
      expect(result.newBalance).toBe(6000);
    });

    test('超过上限时应限制恢复量', async () => {
      // 5小时前，应恢复2500，但上限是6000
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 5000,
        lastRecoveryAt: fiveHoursAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      expect(result.success).toBe(true);
      expect(result.recovered).toBe(1000); // 只能恢复到6000
      expect(result.newBalance).toBe(6000);
    });
  });

  describe('不同套餐的恢复速度', () => {
    test('高级会员每小时恢复1000积分', async () => {
      // 创建高级会员套餐
      const premiumPackage = await createTestPackage({
        name: 'Premium',
        planType: 'pro', // 符合数据库约束
        dailyPoints: 10000,
        features: {
          creditCap: 10000,
          recoveryRate: 1000,
          dailyUsageLimit: 34000,
          manualResetPerDay: 1,
        },
      });

      await createTestUserPackage(testUserId, premiumPackage.id, {
        dailyPoints: 10000,
      });

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 5000,
        lastRecoveryAt: oneHourAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      expect(result.success).toBe(true);
      expect(result.recovered).toBe(1000);
      expect(result.newBalance).toBe(6000);
    });

    test('尊享会员每小时恢复2500积分', async () => {
      // 创建尊享会员套餐
      const vipPackage = await createTestPackage({
        name: 'VIP',
        planType: 'enterprise', // 符合数据库约束
        dailyPoints: 15000,
        features: {
          creditCap: 15000,
          recoveryRate: 2500,
          dailyUsageLimit: 75000,
          manualResetPerDay: 1,
        },
      });

      await createTestUserPackage(testUserId, vipPackage.id, {
        dailyPoints: 15000,
      });

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 10000,
        lastRecoveryAt: oneHourAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      expect(result.success).toBe(true);
      // 由于测试执行有延迟，允许一定误差（2500-2510之间）
      expect(result.recovered).toBeGreaterThanOrEqual(2500);
      expect(result.recovered).toBeLessThanOrEqual(2510);
      expect(result.newBalance).toBeGreaterThanOrEqual(12500);
      expect(result.newBalance).toBeLessThanOrEqual(12510);
    });
  });

  describe('向后兼容性', () => {
    test('旧套餐（无恢复速度配置）应不恢复', async () => {
      // 创建旧版本套餐（没有恢复速度配置）
      const legacyPackage = await createTestPackage({
        name: 'Legacy',
        planType: 'basic',
        dailyPoints: 5000,
        features: {}, // 没有 recoveryRate
      });

      await createTestUserPackage(testUserId, legacyPackage.id, {
        dailyPoints: 5000,
      });

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 3000,
        lastRecoveryAt: oneHourAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      // 旧套餐应该正常处理，但不恢复（recoveryRate = 0）
      expect(result.success).toBe(true);
      expect(result.recovered).toBe(0);
      expect(result.newBalance).toBe(3000);
    });
  });

  describe('乐观锁和并发控制', () => {
    test('应该使用版本号防止并发冲突', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 5000,
        lastRecoveryAt: oneHourAgo,
      });

      // 获取初始版本
      const before = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      await autoRecoverCredits(testUserId);

      // 获取更新后的版本
      const after = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      // 版本号应该增加
      expect(after?.version).toBe(before!.version + 1);
    });
  });

  describe('实际使用场景', () => {
    test('用户使用后30分钟，应部分恢复', async () => {
      // 场景：用户消耗了积分，30分钟后查询
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 3000, // 使用了3000
        lastRecoveryAt: thirtyMinutesAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      // 30分钟 = 0.5小时，应恢复 500 * 0.5 = 250
      expect(result.success).toBe(true);
      expect(result.recovered).toBe(250);
      expect(result.newBalance).toBe(3250);
    });

    test('用户长时间未使用，应恢复到上限', async () => {
      // 场景：用户1天没用，积分应该满了
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await setWalletBalance(testUserId, {
        packageTokensRemaining: 1000,
        lastRecoveryAt: oneDayAgo,
      });

      const result = await autoRecoverCredits(testUserId);

      // 24小时 × 500 = 12000，但上限是6000
      expect(result.success).toBe(true);
      expect(result.recovered).toBe(5000); // 从1000恢复到6000
      expect(result.newBalance).toBe(6000);
    });
  });
});
