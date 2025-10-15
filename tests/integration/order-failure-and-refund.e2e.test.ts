/**
 * 集成测试：购买失败与退款
 * - 创建套餐订单 → 标记支付失败 → 校验订单状态与钱包不变
 * - 独立积分购买 → 退款（扣减独立池）
 * - 套餐退款 → 清空套餐池
 */

import { prisma } from '@/app/models/db';
import { POST as createOrderRoute } from '@/app/api/orders/create/route';
import { handlePaymentFailed } from '@/app/service/orderProcessor';
import { purchaseCredits, refundCredits } from '@/app/service/creditManager';
import {
  createTestUser,
  createTestPackage,
  cleanupTestData,
  waitForDbReady,
  setWalletBalance,
} from '../helpers/testDb';

// mock next-auth session
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
import { getServerSession } from 'next-auth';

jest.setTimeout(240000);

describe('E2E - Order failure and refund scenarios', () => {
  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  test('套餐订单标记支付失败后，订单状态应为 failed 且钱包不变', async () => {
    const user = await createTestUser({ email: `integ-fail-${Date.now()}@test.com` });
    const pkg = await createTestPackage({ name: 'Fail Member', planType: 'basic', dailyPoints: 6000 });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: user.id, id: user.id, email: user.email } });

    const beforeWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    const beforePackage = Number(beforeWallet?.packageTokensRemaining || 0n);
    const beforeIndependent = Number(beforeWallet?.independentTokens || 0n);

    const req: any = { json: async () => ({ orderType: 'package', packageId: pkg.id, paymentMethod: 'stripe' }) };
    const res = await createOrderRoute(req as any);
    const data = await (res as any).json();
    expect(data?.success).toBe(true);
    const orderNo = data?.data?.order?.orderNo;
    expect(orderNo).toBeTruthy();

    const failed = await handlePaymentFailed(orderNo, 'simulated');
    expect(failed.success).toBe(true);

    // 校验订单状态与钱包不变
    const order = await prisma.order.findFirst({ where: { orderNo } });
    expect(order?.status).toBe('failed');
    const afterWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(Number(afterWallet?.packageTokensRemaining || 0n)).toBe(beforePackage);
    expect(Number(afterWallet?.independentTokens || 0n)).toBe(beforeIndependent);
  });

  test('独立积分购买后退款：应扣减独立池并写退款流水', async () => {
    const user = await createTestUser({ email: `integ-refund-indep-${Date.now()}@test.com` });
    // 先购买独立积分 1200
    const buy = await purchaseCredits(user.id, 1200, `order-${Date.now()}`);
    expect(buy.success).toBe(true);

    const ok = await refundCredits(user.id, 200, `refund-${Date.now()}`, 'independent');
    expect(ok).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(Number(wallet?.independentTokens || 0n)).toBe(1000);
    const tx = await prisma.creditTransaction.findFirst({ where: { userId: user.id, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx).toBeTruthy();
  });

  test('套餐退款：应清空套餐池并写退款流水', async () => {
    const user = await createTestUser({ email: `integ-refund-pkg-${Date.now()}@test.com` });
    await setWalletBalance(user.id, { packageTokensRemaining: 3500, independentTokens: 100 });

    const ok = await refundCredits(user.id, 3500, `refund-${Date.now()}`, 'package');
    expect(ok).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(Number(wallet?.packageTokensRemaining || 0n)).toBe(0);
    const tx = await prisma.creditTransaction.findFirst({ where: { userId: user.id, type: 'expense' }, orderBy: { createdAt: 'desc' } });
    expect(tx).toBeTruthy();
  });
});

