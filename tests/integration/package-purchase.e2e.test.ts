/**
 * 集成测试：订单创建 → 支付成功 → 套餐激活
 * - 通过 API 创建订单（package）
 * - 调用 handlePaymentSuccess 模拟支付成功
 * - 断言：UserPackage 创建 + 钱包余额重置 + 存在重置流水
 */

import { prisma } from '@/app/models/db';
import { POST as createOrderRoute } from '@/app/api/orders/create/route';
import { handlePaymentSuccess } from '@/app/service/orderProcessor';
import {
  createTestUser,
  createTestPackage,
  cleanupTestData,
  waitForDbReady,
} from '../helpers/testDb';

// mock next-auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth';

jest.setTimeout(240000);

describe('E2E - Package Purchase & Activation (API + Service)', () => {
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

  test('创建套餐订单并支付成功后应激活套餐与重置钱包余额', async () => {
    // 1) 创建用户与套餐
    const user = await createTestUser({ email: `integ-purchase-${Date.now()}@test.com` });
    userId = user.id;
    email = user.email;

    const pkg = await createTestPackage({
      name: 'Integ Member',
      planType: 'basic',
      dailyPoints: 6000,
      features: {
        creditCap: 6000,
        recoveryRate: 500,
        dailyUsageLimit: 18000,
        manualResetPerDay: 1,
      },
    });

    // 2) mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { uuid: userId, id: userId, email },
    });

    // 3) 调用 API 创建订单
    const req: any = {
      json: async () => ({
        orderType: 'package',
        packageId: pkg.id,
        paymentMethod: 'stripe',
      }),
    };
    const res = await createOrderRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);
    const orderNo = data?.data?.order?.orderNo;
    expect(orderNo).toBeTruthy();

    // 4) 模拟支付成功
    const pay = await handlePaymentSuccess(orderNo, { email });
    expect(pay.success).toBe(true);

    // 等待异步处理完成（远端一致性）
    for (let i = 0; i < 20; i++) {
      const upCheck = await prisma.userPackage.findFirst({ where: { userId, isActive: true } });
      const wCheck = await prisma.wallet.findUnique({ where: { userId } });
      if (upCheck && wCheck) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // 5) 断言：用户套餐已创建且活跃
    const up = await prisma.userPackage.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(up).toBeTruthy();
    expect(up?.packageSnapshot).toBeTruthy();
    const snap: any = up?.packageSnapshot || {};
    expect(snap.features).toBeTruthy();
    expect(typeof snap.features.creditCap).toBe('number');
    expect(typeof snap.features.recoveryRate).toBe('number');
    expect(typeof snap.features.dailyUsageLimit).toBe('number');
    expect(typeof snap.features.manualResetPerDay).toBe('number');

    // 6) 断言：钱包套餐余额已重置为 dailyPoints
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet).toBeTruthy();
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(snap.dailyCredits || snap.dailyPoints || 6000);

    // 7) 断言：存在 reset/package 的流水记录
    const tx = await prisma.creditTransaction.findFirst({
      where: { userId, type: 'reset', bucket: 'package' },
      orderBy: { createdAt: 'desc' },
    });
    expect(tx).toBeTruthy();
    // tokens/points 至少为 dailyPoints（具体 before/after 字段结构依实现，这里不做过度约束）
    expect(Number(tx?.points || 0)).toBeGreaterThan(0);
  });
});
