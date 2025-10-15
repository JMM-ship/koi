import { prisma } from '@/app/models/db'
import { waitForDbReady, cleanupTestData, createTestUser } from '../helpers/testDb'
import { canChangeInviteCode, setUserInviteCode } from '@/app/service/referral'

jest.setTimeout(240000)

async function resetReferralMeta(userId: string) {
  // Ensure the meta row is cleared for tests (table not in Prisma schema)
  await prisma.$executeRaw`DELETE FROM referral_meta WHERE user_id = CAST(${userId} AS uuid)`
}

describe('Referral - Invite Code Modify Limit (once for user)', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('user can change invite code only once (then admin required)', async () => {
    const user = await createTestUser({ email: `modify-limit-${Date.now()}@test.com` })
    await resetReferralMeta(user.id)

    // first change allowed
    const allowed1 = await canChangeInviteCode(user.id)
    expect(allowed1).toBe(true)
    await setUserInviteCode(user.id, 'NEW2AA')

    // second change should be blocked by service policy
    const allowed2 = await canChangeInviteCode(user.id)
    expect(allowed2).toBe(false)
    await expect(setUserInviteCode(user.id, 'ZZZ2ZZ')).rejects.toThrow()
  })
})
