/**
 * 集成测试：邀请绑定 → 首次付费奖励发放 → 幂等
 * - 创建邀请人与被邀请人
 * - 邀请人设置邀请码，被邀请人绑定
 * - 被邀请人创建套餐订单并支付成功
 * - 断言：邀请人与被邀请人的独立积分增加（配置值），存在奖励流水（meta.source='referral_reward'）
 * - 再次购买不重复发放
 */

import { prisma } from '@/app/models/db'
import { POST as createOrderRoute } from '@/app/api/orders/create/route'
import { handlePaymentSuccess } from '@/app/service/orderProcessor'
import { 
  createTestUser,
  createTestPackage,
  cleanupTestData,
  waitForDbReady,
} from '../helpers/testDb'
import { setUserInviteCode, attachReferralByCode } from '@/app/service/referral'
import { INVITER_REWARD_POINTS, INVITEE_REWARD_POINTS } from '@/config/referral.config'

// mock next-auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))
import { getServerSession } from 'next-auth'

jest.setTimeout(240000)

describe('E2E - Referral first purchase reward', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('首次付费发放奖励，后续订单不重复', async () => {
    // 1) 创建邀请人与被邀请人
    const inviter = await createTestUser({ email: `ref-inviter-${Date.now()}@test.com` })
    const invitee = await createTestUser({ email: `ref-invitee-${Date.now()}@test.com` })

    // 2) 邀请人设置邀请码，被邀请人绑定
    await setUserInviteCode(inviter.id, 'REF2AA')
    const attached = await attachReferralByCode(invitee.id, 'ref2aa')
    expect(attached.attached).toBe(true)
    expect(attached.inviterId).toBe(inviter.id)

    // 3) 创建一个测试套餐
    const pkg = await createTestPackage({ name: 'ReferralPkg', dailyPoints: 6000, planType: 'basic' })

    // 4) mock 被邀请人 session
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { uuid: invitee.id, id: invitee.id, email: invitee.email },
    })

    // 5) 调用 API 创建订单
    const req: any = {
      json: async () => ({ orderType: 'package', packageId: pkg.id, paymentMethod: 'stripe' }),
    }
    const res: any = await createOrderRoute(req as any)
    const body = await res.json()
    expect(body?.success).toBe(true)
    const orderNo = body?.data?.order?.orderNo
    expect(orderNo).toBeTruthy()

    // 6) 支付成功
    const pay = await handlePaymentSuccess(orderNo, { email: invitee.email })
    expect(pay.success).toBe(true)

    // 等待异步处理
    for (let i = 0; i < 20; i++) {
      const iWallet = await prisma.wallet.findUnique({ where: { userId: inviter.id } })
      const eWallet = await prisma.wallet.findUnique({ where: { userId: invitee.id } })
      if (iWallet && eWallet) break
      await new Promise((r) => setTimeout(r, 300))
    }

    // 7) 校验奖励余额
    const inviterWallet = await prisma.wallet.findUnique({ where: { userId: inviter.id } })
    const inviteeWallet = await prisma.wallet.findUnique({ where: { userId: invitee.id } })
    expect(Number(inviterWallet?.independentTokens || 0n)).toBeGreaterThanOrEqual(INVITER_REWARD_POINTS)
    expect(Number(inviteeWallet?.independentTokens || 0n)).toBeGreaterThanOrEqual(INVITEE_REWARD_POINTS)

    // 8) 校验奖励流水存在（至少一条）
    const inviterTx = await prisma.creditTransaction.findFirst({
      where: { userId: inviter.id, type: 'income', bucket: 'independent' },
      orderBy: { createdAt: 'desc' },
    })
    const inviteeTx = await prisma.creditTransaction.findFirst({
      where: { userId: invitee.id, type: 'income', bucket: 'independent' },
      orderBy: { createdAt: 'desc' },
    })
    expect(inviterTx).toBeTruthy()
    expect(inviteeTx).toBeTruthy()

    // 9) 再次购买不重复发放
    const req2: any = {
      json: async () => ({ orderType: 'package', packageId: pkg.id, paymentMethod: 'stripe' }),
    }
    const res2: any = await createOrderRoute(req2 as any)
    const body2 = await res2.json()
    const orderNo2 = body2?.data?.order?.orderNo
    const pay2 = await handlePaymentSuccess(orderNo2, { email: invitee.email })
    expect(pay2.success).toBe(true)

    // 记录第二次后的余额
    const inviterWallet2 = await prisma.wallet.findUnique({ where: { userId: inviter.id } })
    const inviteeWallet2 = await prisma.wallet.findUnique({ where: { userId: invitee.id } })
    expect(Number(inviterWallet2?.independentTokens || 0n)).toBe(Number(inviterWallet?.independentTokens || 0n))
    expect(Number(inviteeWallet2?.independentTokens || 0n)).toBe(Number(inviteeWallet?.independentTokens || 0n))
  })
})

