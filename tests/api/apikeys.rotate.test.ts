import { prisma } from '@/app/models/db'
import { v4 as uuidv4 } from 'uuid'
import { encryptApiKey } from '@/app/lib/crypto'

jest.mock('@/lib/auth-light', () => ({
  getAuthLight: jest.fn(async () => ({ uuid: (global as any).__TEST_USER_ID_ROTATE__ }))
}))

describe('POST /api/apikeys/rotate', () => {
  const userId = uuidv4()
  const email = `test-apikeys-rotate-${Date.now()}@example.com`
  let oldKeyId: string
  let poolId: string
  let poolPlaintext: string

  beforeAll(async () => {
    ;(global as any).__TEST_USER_ID_ROTATE__ = userId
    try {
      await prisma.user.create({ data: { id: userId, email, nickname: 'UR', role: 'user', status: 'active', planType: 'free' } })
    } catch {}

    // existing active key (could be old type without encrypted meta)
    const crypto = await import('crypto')
    const oldPlain = 'sk-old-rotate-KEY_123456'
    const pepper = process.env.ENCRYPTION_KEY || ''
    const oldHash = crypto.createHash('sha256').update(oldPlain + pepper).digest('hex')
    const old = await prisma.apiKey.create({
      data: {
        ownerUserId: userId,
        keyHash: oldHash,
        prefix: oldPlain.substring(0, 7),
        name: 'Old Active',
        status: 'active',
        meta: {},
      }
    })
    oldKeyId = old.id

    // pool record with valid encrypted meta
    poolId = uuidv4()
    poolPlaintext = 'sk-rotate-NEW_KEY_ABCDEFG'
    const poolPepper = process.env.ENCRYPTION_KEY || ''
    const poolHash = crypto.createHash('sha256').update(poolPlaintext + poolPepper).digest('hex')
    const enc = encryptApiKey(poolPlaintext, poolId)
    await prisma.apiKey.create({
      data: {
        id: poolId,
        ownerUserId: null,
        keyHash: poolHash,
        prefix: poolPlaintext.substring(0, 7),
        name: 'Rotated Key',
        status: 'active',
        meta: { key_encrypted: enc },
      }
    })
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { id: { in: [oldKeyId, poolId] } } })
    await prisma.apiKey.deleteMany({ where: { ownerUserId: userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  test('rotates active key by claiming from pool and deleting old', async () => {
    const mod = await import('@/app/api/apikeys/rotate/route')
    const req = new Request('http://localhost/api/apikeys/rotate', { method: 'POST' })
    const res = await (mod as any).POST(req)
    expect((res as any).status).toBe(200)
    const body = await (res as any).json()
    expect(body?.success).toBe(true)
    expect(body?.apiKey?.id).toBe(poolId)
    expect(body?.apiKey?.fullKey).toBe(poolPlaintext)

    const old = await prisma.apiKey.findUnique({ where: { id: oldKeyId } })
    expect(old?.status).toBe('deleted')

    const claimed = await prisma.apiKey.findUnique({ where: { id: poolId } })
    expect(claimed?.ownerUserId).toBe(userId)
  })
})

