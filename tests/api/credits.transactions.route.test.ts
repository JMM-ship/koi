import { prisma } from '@/app/models/db'
import { GET as TransactionsGET } from '@/app/api/credits/transactions/route'
import { cleanupTestData, createTestUser } from '../helpers/testDb'
import { createCreditTransaction, TransactionType, CreditType } from '@/app/models/creditTransaction'

// mock next-auth session
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
import { getServerSession } from 'next-auth'

jest.setTimeout(120000)

describe('API /api/credits/transactions', () => {
  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  test('returns recent transactions and includes new user bonus', async () => {
    const user = await createTestUser({ email: `tx-${Date.now()}@test.com` })
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { uuid: user.id, id: user.id, email: user.email } })

    // insert a bonus transaction
    await createCreditTransaction({
      user_id: user.id,
      type: TransactionType.Income,
      credit_type: CreditType.Independent,
      amount: 500,
      before_balance: 0,
      after_balance: 500,
      description: '新用户注册奖励',
      metadata: { source: 'email_registration' },
    })

    const res: any = await TransactionsGET({ url: 'http://localhost/api/credits/transactions?limit=5' } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body?.success).toBe(true)
    expect(Array.isArray(body?.data?.transactions)).toBe(true)
    const reasons = body.data.transactions.map((t: any) => t.reason)
    expect(reasons).toContain('新用户注册奖励')
    const bonus = body.data.transactions.find((t: any) => t.reason === '新用户注册奖励')
    expect(bonus.points).toBe(500)
    expect(bonus.bucket).toBe('independent')
  })
})

