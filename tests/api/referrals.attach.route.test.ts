import { prisma } from '@/app/models/db'
import { POST as attachRoute } from '@/app/api/referrals/attach/route'
import { createTestUser, cleanupTestData, waitForDbReady } from '../helpers/testDb'
import { setUserInviteCode } from '@/app/service/referral'

// mock next-auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))
import { getServerSession } from 'next-auth'

jest.setTimeout(120000)

describe('POST /api/referrals/attach - bind invitedBy', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('attach from cookie if not bound', async () => {
    const inviter = await createTestUser({ email: `api-attach-inviter-${Date.now()}@test.com` })
    const invitee = await createTestUser({ email: `api-attach-invitee-${Date.now()}@test.com` })
    await setUserInviteCode(inviter.id, 'APIA2Z')

    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: invitee.id, email: invitee.email } })

    const headers = new Headers()
    headers.set('cookie', 'referral_code=APIA2Z; Path=/;')
    const req = new Request('http://localhost/api/referrals/attach', { method: 'POST', headers })
    const res: any = await attachRoute(req as any)
    const body = await res.json()
    expect(body?.success).toBe(true)
    expect(body?.data?.attached).toBe(true)

    const updated = await prisma.user.findUnique({ where: { id: invitee.id } })
    expect((updated as any).invitedBy).toBe(inviter.id)
  })
})
