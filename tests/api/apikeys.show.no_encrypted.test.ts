import { prisma } from '@/app/models/db'
import { v4 as uuidv4 } from 'uuid'

jest.mock('@/lib/auth-light', () => ({
  getAuthLight: jest.fn(async () => ({ uuid: (global as any).__TEST_USER_ID_NOENC__ }))
}))

describe('GET /api/apikeys/:id/show without encrypted payload', () => {
  const userId = uuidv4()
  const email = `test-apikeys-show-noenc-${Date.now()}@example.com`
  let keyId: string

  beforeAll(async () => {
    ;(global as any).__TEST_USER_ID_NOENC__ = userId
    try {
      await prisma.user.create({ data: { id: userId, email, nickname: 'U3', role: 'user', status: 'active', planType: 'free' } })
    } catch {}

    keyId = uuidv4()

    // Construct a key record without meta.key_encrypted
    const crypto = await import('crypto')
    const plaintext = 'sk-noenc-TEST_KEY_123456'
    const pepper = process.env.ENCRYPTION_KEY || ''
    const keyHash = crypto.createHash('sha256').update(plaintext + pepper).digest('hex')

    await prisma.apiKey.create({
      data: {
        id: keyId,
        ownerUserId: userId,
        keyHash,
        prefix: plaintext.substring(0, 7),
        name: 'NoEnc Key',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {},
      }
    })
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { ownerUserId: userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  test('returns 422 with NO_ENCRYPTED_KEY code', async () => {
    const mod = await import('@/app/api/apikeys/[id]/show/route')
    const res = await mod.GET(new Request(`http://localhost/api/apikeys/${keyId}/show`), { params: { id: keyId } as any })
    expect((res as any).status).toBe(422)
    const body = await (res as any).json()
    expect(body?.code).toBe('NO_ENCRYPTED_KEY')
  })
})

