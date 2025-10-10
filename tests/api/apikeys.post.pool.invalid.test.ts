import { prisma } from '@/app/models/db'
import { v4 as uuidv4 } from 'uuid'

jest.mock('@/lib/auth-light', () => ({
  getAuthLight: jest.fn(async () => ({ uuid: (global as any).__TEST_USER_ID_POOL_INVALID__ }))
}))

describe('POST /api/apikeys with invalid pool record (missing encrypted key)', () => {
  const userId = uuidv4()
  const email = `test-apikeys-post-pool-invalid-${Date.now()}@example.com`

  beforeAll(async () => {
    ;(global as any).__TEST_USER_ID_POOL_INVALID__ = userId
    try {
      await prisma.user.create({ data: { id: userId, email, nickname: 'U4', role: 'user', status: 'active', planType: 'free' } })
    } catch {}

    // Seed one invalid available key in pool: ownerUserId=null, status=active, but missing meta.key_encrypted
    const crypto = await import('crypto')
    const plaintext = 'sk-pool-invalid-TEST_123456'
    const pepper = process.env.ENCRYPTION_KEY || ''
    const keyHash = crypto.createHash('sha256').update(plaintext + pepper).digest('hex')

    await prisma.apiKey.create({
      data: {
        ownerUserId: null,
        keyHash,
        prefix: plaintext.substring(0, 7),
        name: 'Pool Invalid',
        status: 'active',
        meta: {},
      }
    })
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { ownerUserId: null, name: 'Pool Invalid' } })
    await prisma.apiKey.deleteMany({ where: { ownerUserId: userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  test('returns 500 with POOL_KEY_INVALID code', async () => {
    const mod = await import('@/app/api/apikeys/route')
    const req = new Request('http://localhost/api/apikeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'T' }),
    })
    const res = await (mod as any).POST(req)
    expect((res as any).status).toBe(500)
    const body = await (res as any).json()
    expect(body?.code).toBe('POOL_KEY_INVALID')
  })
})

