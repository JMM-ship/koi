import { prisma } from '@/app/models/db'
import { cleanupTestData } from '../helpers/testDb'
import { saveUser } from '@/app/service/user'

jest.setTimeout(120000)

describe('New User Bonus - OAuth saveUser()', () => {
  const email = `oauth-bonus-${Date.now()}@test.com`

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('首登创建用户后发放500独立积分并记录流水', async () => {
    await saveUser({
      email,
      name: 'OAuth User',
      image: '',
      signin_provider: 'github',
      signin_type: 'oauth'
    } as any)

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
    expect(meta?.source).toBe('oauth_registration')
    expect(meta?.provider).toBe('github')
  })
})

