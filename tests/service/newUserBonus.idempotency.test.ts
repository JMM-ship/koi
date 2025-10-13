import { prisma } from '@/app/models/db'
import { cleanupTestData } from '../helpers/testDb'
import { POST as RegisterPOST } from '@/app/api/auth/register/route'
import { saveUser } from '@/app/service/user'

jest.setTimeout(120000)

describe('New User Bonus - 幂等发放', () => {
  const email = `idempo-${Date.now()}@test.com`
  const code = '654321'

  beforeAll(async () => {
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

  test('同一用户多渠道触发仅发放一次', async () => {
    // 渠道一：邮箱注册
    const res: any = await RegisterPOST({
      json: async () => ({
        username: 'idempo_user',
        email,
        password: 'Password!123',
        verificationCode: code,
      })
    } as any)
    const body = await res.json()
    expect(body?.success).toBe(true)

    const user = await prisma.user.findFirst({ where: { email } })
    expect(user).toBeTruthy()

    // 渠道二：OAuth 首登（模拟重复触发）
    await saveUser({
      email,
      name: 'OAuth Again',
      signin_provider: 'google',
      signin_type: 'oauth',
    } as any)

    const wallet = await prisma.wallet.findUnique({ where: { userId: user!.id } })
    expect(wallet).toBeTruthy()
    // 只发放一次 500
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
  })
})

