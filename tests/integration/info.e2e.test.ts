/**
 * 集成测试：GET /api/credits/info
 * - 返回余额/配置/使用信息
 * - 不隐式触发自动恢复
 */

import { prisma } from '@/app/models/db';
import { GET as infoRoute } from '@/app/api/credits/info/route';
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

describe('E2E - GET /api/credits/info', () => {
  let userId: string;
  let email: string;

  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  test('应返回余额/配置/使用信息，且不触发自动恢复', async () => {
    const user = await createTestUser({ email: `integ-info-${Date.now()}@test.com` });
    userId = user.id;
    email = user.email;

    const pkg = await createTestPackage({
      name: 'Info Member',
      planType: 'basic',
      dailyPoints: 6000,
      features: {
        creditCap: 6000,
        recoveryRate: 500,
        dailyUsageLimit: 18000,
        manualResetPerDay: 1,
      },
    });
    await createTestUserPackage(userId, pkg.id, { dailyPoints: 6000 });

    // 设置 1 小时前的 lastRecoveryAt 与低余额
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await setWalletBalance(userId, {
      packageTokensRemaining: 1000,
      independentTokens: 0,
      dailyUsageCount: 0,
      lastRecoveryAt: oneHourAgo,
    });

    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: userId, id: userId, email } });

    const res = await infoRoute({} as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);
    expect(data?.data?.balance?.packageTokensRemaining).toBe(1000);
    expect(typeof data?.data?.packageConfig?.creditCap).toBe('number');
    expect(typeof data?.data?.packageConfig?.recoveryRate).toBe('number');
    expect(typeof data?.data?.usage?.dailyUsageCount).toBe('number');
    // lastRecoveryAt 字段存在
    expect(data?.data?.usage?.lastRecoveryAt === null || typeof data?.data?.usage?.lastRecoveryAt === 'string').toBe(true);

    // 再次读取钱包，确认未触发自动恢复
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(1000);
  });
});

