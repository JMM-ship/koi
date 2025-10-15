import { prisma } from '@/app/models/db'
import { GET as summaryRoute } from '@/app/api/referrals/summary/route'
import { POST as createOrderRoute } from '@/app/api/orders/create/route'
import { handlePaymentSuccess } from '@/app/service/orderProcessor'
import { createTestUser, createTestPackage, cleanupTestData, waitForDbReady } from '../helpers/testDb'
import { setUserInviteCode, attachReferralByCode } from '@/app/service/referral'

// mock next-auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))
import { getServerSession } from 'next-auth'

jest.setTimeout(240000)

describe('GET /api/referrals/summary', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('returns invite code, invited count and total rewards', async () => {
    // setup inviter & invitee
    const inviter = await createTestUser({ email: `sum-inviter-${Date.now()}@test.com` })
    const invitee = await createTestUser({ email: `sum-invitee-${Date.now()}@test.com` })
    await setUserInviteCode(inviter.id, 'SUM2AA')
    await attachReferralByCode(invitee.id, 'SUM2AA')

    // invitee makes a purchase
    const pkg = await createTestPackage({ name: 'SumPkg', planType: 'basic', dailyPoints: 3000 })
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: invitee.id, email: invitee.email } })
    const req: any = { json: async () => ({ orderType: 'package', packageId: pkg.id, paymentMethod: 'stripe' }) }
    const res: any = await createOrderRoute(req as any)
    const body = await res.json()
    const orderNo = body?.data?.order?.orderNo
    await handlePaymentSuccess(orderNo, { email: invitee.email })

    // query summary as inviter
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: inviter.id, email: inviter.email } })
    const res2: any = await summaryRoute({} as any)
    const data = await res2.json()
    expect(data?.success).toBe(true)
    expect(data?.data?.inviteCode).toBe('SUM2AA')
    expect(data?.data?.invitedCount).toBeGreaterThanOrEqual(1)
    expect((data?.data?.totalRewardPoints || 0)).toBeGreaterThan(0)
  })
})

