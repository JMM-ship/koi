import { prisma } from '@/app/models/db'
import { POST as RegisterPOST } from '@/app/api/auth/register/route'
import { cleanupTestData } from '../helpers/testDb'

jest.setTimeout(120000)

describe('New User Bonus - Email Register', () => {
  const email = `bonus-${Date.now()}@test.com`
  const code = '123456'

  beforeAll(async () => {
    // 插入一条有效的邮箱验证码
    await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
      }
    })
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('注册成功后发放500独立积分并记录流水', async () => {
    const res: any = await RegisterPOST({
      json: async () => ({
        username: 'bonus_user',
        email,
        password: 'Password!123',
        verificationCode: code,
      })
    } as any)

    const body = await res.json()
    expect(body?.success).toBe(true)

    const user = await prisma.user.findFirst({ where: { email } })
    expect(user).toBeTruthy()

    const wallet = await prisma.wallet.findUnique({ where: { userId: user!.id } })
    expect(wallet).toBeTruthy()
    expect(wallet?.independentTokens).toBe(BigInt(500))

    const txs = await prisma.creditTransaction.findMany({
      where: {
        userId: user!.id,
        type: 'income',
        bucket: 'independent',
        reason: '新用户注册奖励',
      }
    })
    expect(txs.length).toBe(1)
    expect(txs[0].points).toBe(500)
    const meta: any = (txs[0] as any).meta
    expect(meta?.source).toBe('email_registration')
  })
})

