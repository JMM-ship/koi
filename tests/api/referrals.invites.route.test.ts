import { prisma } from '@/app/models/db'
import { GET as invitesRoute } from '@/app/api/referrals/invites/route'
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

describe('GET /api/referrals/invites - invited list with statuses', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('lists invited users with purchase and reward status', async () => {
    const inviter = await createTestUser({ email: `list-inviter-${Date.now()}@test.com` })
    const invitee = await createTestUser({ email: `list-invitee-${Date.now()}@test.com` })
    await setUserInviteCode(inviter.id, 'LIST2A')
    await attachReferralByCode(invitee.id, 'LIST2A')

    // invitee purchase
    const pkg = await createTestPackage({ name: 'ListPkg', planType: 'basic', dailyPoints: 3000 })
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: invitee.id, email: invitee.email } })
    const req: any = { json: async () => ({ orderType: 'package', packageId: pkg.id, paymentMethod: 'stripe' }) }
    const res: any = await createOrderRoute(req as any)
    const body = await res.json()
    await handlePaymentSuccess(body?.data?.order?.orderNo, { email: invitee.email })

    // query invites as inviter
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: inviter.id, email: inviter.email } })
    const res2: any = await invitesRoute({ nextUrl: new URL('http://localhost/api/referrals/invites?page=1&pageSize=10') } as any)
    const data = await res2.json()
    expect(data?.success).toBe(true)
    expect(Array.isArray(data?.data?.items)).toBe(true)
    const one = data?.data?.items?.find((x: any) => x.email === invitee.email)
    expect(one).toBeTruthy()
    expect(one.purchaseStatus).toBe('purchased')
    expect(['rewarded', 'purchased_unrewarded']).toContain(one.rewardStatus)
  })
})

