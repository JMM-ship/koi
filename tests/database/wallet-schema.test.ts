import { prisma } from '@/app/models/db';
import { createTestUser, cleanupTestData } from '../helpers/testDb';

describe('Wallet Schema - New Fields', () => {
  let testUserId: string;
  let testWallet: any; // 缓存钱包数据，减少查询

  beforeAll(async () => {
    // 清理测试数据
    await cleanupTestData();

    // 创建测试用户
    const user = await createTestUser({
      email: 'wallet-test@example.com'
    });
    testUserId = user.id;

    // 预加载钱包数据
    testWallet = await prisma.wallet.findUnique({
      where: { userId: testUserId },
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Daily Usage Tracking', () => {
    test('应该有所有每日使用跟踪字段和正确的默认值', async () => {
      // 使用缓存的 wallet，避免重复查询
      expect(testWallet).toBeTruthy();
      expect(testWallet).toHaveProperty('dailyUsageCount');
      expect(typeof testWallet?.dailyUsageCount).toBe('bigint');
      expect(testWallet?.dailyUsageCount).toBe(BigInt(0)); // 默认值应为0

      expect(testWallet).toHaveProperty('dailyUsageResetAt');
      expect(testWallet?.dailyUsageResetAt).toBeNull(); // 初始值为 null
    });

    test('应该能更新 dailyUsageCount', async () => {
      await prisma.wallet.update({
        where: { userId: testUserId },
        data: {
          dailyUsageCount: BigInt(5000)
        }
      });

      const updated = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      expect(updated?.dailyUsageCount).toBe(BigInt(5000));
    });
  });

  describe('Manual Reset Tracking', () => {
    test('应该有所有手动重置跟踪字段和正确的默认值', async () => {
      expect(testWallet).toHaveProperty('manualResetCount');
      expect(typeof testWallet?.manualResetCount).toBe('number');
      expect(testWallet?.manualResetCount).toBe(0); // 默认值应为0

      expect(testWallet).toHaveProperty('manualResetAt');
      expect(testWallet?.manualResetAt).toBeNull();
    });

    test('应该能更新 manualResetCount', async () => {
      await prisma.wallet.update({
        where: { userId: testUserId },
        data: {
          manualResetCount: 1,
          manualResetAt: new Date()
        }
      });

      const updated = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      expect(updated?.manualResetCount).toBe(1);
      expect(updated?.manualResetAt).toBeInstanceOf(Date);
    });
  });

  describe('Recovery Tracking', () => {
    test('应该有 lastRecoveryAt 字段和正确的默认值', async () => {
      expect(testWallet).toHaveProperty('lastRecoveryAt');
      expect(testWallet?.lastRecoveryAt).toBeNull();
    });

    test('应该能更新 lastRecoveryAt', async () => {
      const now = new Date();

      await prisma.wallet.update({
        where: { userId: testUserId },
        data: {
          lastRecoveryAt: now
        }
      });

      const updated = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      expect(updated?.lastRecoveryAt).toBeInstanceOf(Date);
      expect(updated?.lastRecoveryAt?.getTime()).toBe(now.getTime());
    });
  });

  describe('Field Constraints and Defaults', () => {
    test('新创建的 Wallet 应该有正确的默认值', async () => {
      // 创建新用户和钱包
      const newUser = await createTestUser({
        email: 'new-wallet-test@example.com'
      });

      const wallet = await prisma.wallet.findUnique({
        where: { userId: newUser.id },
      });

      expect(wallet).toBeTruthy();
      expect(wallet?.dailyUsageCount).toBe(BigInt(0));
      expect(wallet?.manualResetCount).toBe(0);
      expect(wallet?.dailyUsageResetAt).toBeNull();
      expect(wallet?.manualResetAt).toBeNull();
      expect(wallet?.lastRecoveryAt).toBeNull();
    });

    test('应该能同时更新所有新字段', async () => {
      const now = new Date();

      await prisma.wallet.update({
        where: { userId: testUserId },
        data: {
          dailyUsageCount: BigInt(10000),
          dailyUsageResetAt: now,
          manualResetCount: 1,
          manualResetAt: now,
          lastRecoveryAt: now
        }
      });

      const updated = await prisma.wallet.findUnique({
        where: { userId: testUserId },
      });

      expect(updated?.dailyUsageCount).toBe(BigInt(10000));
      expect(updated?.dailyUsageResetAt).toBeTruthy();
      expect(updated?.manualResetCount).toBe(1);
      expect(updated?.manualResetAt).toBeTruthy();
      expect(updated?.lastRecoveryAt).toBeTruthy();
    });
  });
});
