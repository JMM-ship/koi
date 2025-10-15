import { prisma } from '@/app/models/db'
import {
  validateInviteCodeFormat,
  generateInviteCode,
  ensureUserInviteCode,
  setUserInviteCode,
} from '@/app/service/referral'
import { waitForDbReady, cleanupTestData, createTestUser } from '../helpers/testDb'

jest.setTimeout(240000)

describe('Referral - Invite Code (format, generation, uniqueness)', () => {
  beforeAll(async () => {
    await waitForDbReady(60000)
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('validateInviteCodeFormat should normalize to uppercase and reject invalid', async () => {
    expect(validateInviteCodeFormat('abcd')).toBe('ABCD')
    expect(validateInviteCodeFormat('A2cD9')).toBe('A2CD9')

    // too short
    expect(() => validateInviteCodeFormat('abc')).toThrow()
    // special chars
    expect(() => validateInviteCodeFormat('AB#C')).toThrow()
  })

  test('generateInviteCode should use allowed charset and default length', async () => {
    const code = generateInviteCode()
    expect(code).toBeTruthy()
    expect(code.length).toBeGreaterThanOrEqual(4)
    // allowed charset check
    expect(code).toMatch(/^[A-Z0-9]+$/)
  })

  test('ensureUserInviteCode should create code when missing and keep existing when valid', async () => {
    const user = await createTestUser({ email: `referral-invite-${Date.now()}@test.com` })

    // remove any existing code to simulate missing
    await prisma.user.update({ where: { id: user.id }, data: { inviteCode: '' } })

    const code = await ensureUserInviteCode(user.id)
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/)
    const fetched = await prisma.user.findUnique({ where: { id: user.id } })
    expect((fetched as any).inviteCode).toBe(code)

    // call again should keep the same code
    const code2 = await ensureUserInviteCode(user.id)
    expect(code2).toBe(code)
  })

  test('setUserInviteCode should enforce case-insensitive uniqueness', async () => {
    const u1 = await createTestUser({ email: `ref-uniq-1-${Date.now()}@test.com` })
    const u2 = await createTestUser({ email: `ref-uniq-2-${Date.now()}@test.com` })

    await setUserInviteCode(u1.id, 'ABCD2') // normalized to uppercase inside

    // same but lowercased should conflict
    await expect(setUserInviteCode(u2.id, 'abcd2')).rejects.toThrow()
  })
})
