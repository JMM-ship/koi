import { prisma } from '@/app/models/db'
import { attachReferralByCode, setUserInviteCode } from '@/app/service/referral'
import { waitForDbReady, cleanupTestData, createTestUser } from '../helpers/testDb'

jest.setTimeout(240000)

describe('Referral - Attach by Code', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('should attach invitedBy with valid code (case-insensitive)', async () => {
    const inviter = await createTestUser({ email: `attach-inviter-${Date.now()}@test.com` })
    const invitee = await createTestUser({ email: `attach-invitee-${Date.now()}@test.com` })

    await setUserInviteCode(inviter.id, 'QWER2')

    const res = await attachReferralByCode(invitee.id, 'qwer2')
    expect(res.attached).toBe(true)
    expect(res.inviterId).toBe(inviter.id)

    const updatedInvitee = await prisma.user.findUnique({ where: { id: invitee.id } })
    expect((updatedInvitee as any).invitedBy).toBe(inviter.id)
  })

  test('should be idempotent when already attached', async () => {
    const inviter = await createTestUser({ email: `attach-idem-inviter-${Date.now()}@test.com` })
    const invitee = await createTestUser({ email: `attach-idem-invitee-${Date.now()}@test.com` })

    await setUserInviteCode(inviter.id, 'ZXCV2')
    await attachReferralByCode(invitee.id, 'ZXCV2')

    const again = await attachReferralByCode(invitee.id, 'ZXCV2')
    expect(again.attached).toBe(false)
  })

  test('should prevent self-invite', async () => {
    const u = await createTestUser({ email: `attach-self-${Date.now()}@test.com` })
    await setUserInviteCode(u.id, 'SELF2')
    await expect(attachReferralByCode(u.id, 'SELF2')).rejects.toThrow()
  })

  test('invalid invite code should throw', async () => {
    const u = await createTestUser({ email: `attach-invalid-${Date.now()}@test.com` })
    await expect(attachReferralByCode(u.id, 'AB#C')).rejects.toThrow()
  })
})
