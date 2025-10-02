/**
 * 端到端：购买 → 查询 → 使用 → 自动恢复 → 手动重置 → 查询
 */

import { prisma } from '@/app/models/db';
import { POST as createOrderRoute } from '@/app/api/orders/create/route';
import { POST as useCreditsRoute } from '@/app/api/credits/use/route';
import { GET as infoRoute } from '@/app/api/credits/info/route';
import { POST as manualResetRoute } from '@/app/api/credits/manual-reset/route';
import { handlePaymentSuccess } from '@/app/service/orderProcessor';
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

describe('E2E - Full Journey (purchase → use → auto recover → manual reset → info)', () => {
  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  test('完整流程', async () => {
    // 1) 用户与套餐
    const user = await createTestUser({ email: `e2e-journey-${Date.now()}@test.com` });
    const pkg = await createTestPackage({
      name: 'E2E Member', planType: 'basic', dailyPoints: 6000,
      features: { creditCap: 6000, recoveryRate: 500, dailyUsageLimit: 18000, manualResetPerDay: 1 },
    });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: user.id, id: user.id, email: user.email } });

    // 2) 创建订单 + 支付
    const reqCreate: any = { json: async () => ({ orderType: 'package', packageId: pkg.id, paymentMethod: 'stripe' }) };
    const resCreate = await createOrderRoute(reqCreate as any);
    const dCreate = await (resCreate as any).json();
    expect(dCreate?.success).toBe(true);
    const orderNo = dCreate?.data?.order?.orderNo;
    expect(orderNo).toBeTruthy();
    const payRes = await handlePaymentSuccess(orderNo, { email: user.email });
    expect(payRes.success).toBe(true);

    // 等待写入可见
    for (let i = 0; i < 20; i++) {
      const up = await prisma.userPackage.findFirst({ where: { userId: user.id, isActive: true } });
      const w = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (up && w) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3) 查询 info
    const infoRes = await infoRoute({} as any);
    const info = await (infoRes as any).json();
    expect(info?.success).toBe(true);
    const cap = info?.data?.packageConfig?.creditCap;
    expect(typeof cap).toBe('number');
    const pkgRemain1 = info?.data?.balance?.packageTokensRemaining;
    expect(typeof pkgRemain1).toBe('number');
    expect(pkgRemain1).toBeGreaterThanOrEqual(5900); // 激活后的冷启动重置到 6000（允许少量延迟）

    // 4) 使用 900（套餐池 6000 -> 5100）
    const reqUse1: any = { json: async () => ({ amount: 900, service: 'E2E', metadata: { step: 1 }, requestId: `rid-${Date.now()}-1` }) };
    const resUse1 = await useCreditsRoute(reqUse1 as any);
    const dUse1 = await (resUse1 as any).json();
    expect(dUse1?.success).toBe(true);
    const w1 = await prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(Number(w1?.packageTokensRemaining || 0n)).toBe(5100);

    // 5) 用前自动恢复：lastRecoveryAt 回退 1h，再使用 600，套餐余额应在 [5000±10]
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await setWalletBalance(user.id, { lastRecoveryAt: oneHourAgo });
    const reqUse2: any = { json: async () => ({ amount: 600, service: 'E2E', metadata: { step: 2 }, requestId: `rid-${Date.now()}-2` }) };
    const resUse2 = await useCreditsRoute(reqUse2 as any);
    const dUse2 = await (resUse2 as any).json();
    expect(dUse2?.success).toBe(true);
    const w2 = await prisma.wallet.findUnique({ where: { userId: user.id } });
    const remain2 = Number(w2?.packageTokensRemaining || 0n);
    expect(remain2).toBeGreaterThanOrEqual(4990);
    expect(remain2).toBeLessThanOrEqual(5010);

    // 6) 手动重置：首次成功到上限，再次 LIMIT_REACHED
    const resReset1 = await manualResetRoute({} as any);
    const dReset1 = await (resReset1 as any).json();
    expect(dReset1?.success).toBe(true);
    expect(typeof dReset1?.data?.resetsRemainingToday).toBe('number');
    const w3 = await prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(Number(w3?.packageTokensRemaining || 0n)).toBe(cap);

    const resReset2 = await manualResetRoute({} as any);
    const dReset2 = await (resReset2 as any).json();
    expect(dReset2?.success).toBe(false);
    expect(dReset2?.error?.code).toBe('LIMIT_REACHED');

    // 7) 终态查询：余额=cap，今日剩余次数=0
    const infoRes2 = await infoRoute({} as any);
    const info2 = await (infoRes2 as any).json();
    expect(info2?.success).toBe(true);
    expect(info2?.data?.balance?.packageTokensRemaining).toBe(cap);
    expect(info2?.data?.usage?.resetsRemainingToday).toBe(0);
  });
});

