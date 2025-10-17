/** @jest-environment node */

// Mock dependencies used by register route
jest.mock('@/app/models/user', () => ({
  createUserWithPassword: jest.fn(async (_email: string, _password: string, _username: string) => ({ id: 'u1', email: _email, nickname: _username })),
  findUserByEmail: jest.fn(async () => null),
}))
jest.mock('@/app/models/verification', () => ({
  findEmailVerificationCodeByEmailAndCode: jest.fn(async () => ({ id: 'vc1', expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() })),
  markVerificationCodeAsUsed: jest.fn(async () => ({})),
}))
jest.mock('@/app/service/newUserBonus', () => ({
  grantNewUserBonus: jest.fn(async () => ({ granted: true })),
}))
jest.mock('@/app/lib/email', () => ({
  sendWelcomeEmail: jest.fn(async () => ({ success: true })),
}))

describe('register route - welcome email', () => {
  test('calls sendWelcomeEmail after successful registration', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req: any = { json: async () => ({ username: 'name', email: 'user@test.com', password: 'Passw0rd!', verificationCode: '123456' }) }
    const res = await POST(req as any)
    const body = await (res as any).json()
    expect(body?.success).toBe(true)
    const { sendWelcomeEmail } = await import('@/app/lib/email')
    expect((sendWelcomeEmail as any).mock.calls.length).toBe(1)
    expect((sendWelcomeEmail as any).mock.calls[0][0]).toBe('user@test.com')
  })
})

