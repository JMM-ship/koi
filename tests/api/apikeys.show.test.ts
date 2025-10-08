import { prisma } from '@/app/models/db'
import { encryptApiKey } from '@/app/lib/crypto'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

jest.mock('@/lib/auth-light', () => ({
  getAuthLight: jest.fn(async () => ({ uuid: (global as any).__TEST_USER_ID2__ }))
}))

describe('GET /api/apikeys/:id/show (on-demand decrypt)', () => {
  const userId = uuidv4()
  const email = `test-apikeys-show-${Date.now()}@example.com`
  const plaintext = 'sk-live-TEST_FULL_KEY_1234567890'
  let keyId: string

  beforeAll(async () => {
    ;(global as any).__TEST_USER_ID2__ = userId
    // Ensure user exists
    try {
      await prisma.user.create({ data: { id: userId, email, nickname: 'U2', role: 'user', status: 'active', planType: 'free' } })
    } catch {}

    // Create a key row first to obtain ID for AAD
    keyId = uuidv4()

    const encrypted = encryptApiKey(plaintext, keyId)
    // keyHash mirrors route.ts logic: sha256(raw + pepper)
    const crypto = await import('crypto')
    const pepper = process.env.ENCRYPTION_KEY || ''
    const keyHash = crypto.createHash('sha256').update(plaintext + pepper).digest('hex')

    await prisma.apiKey.create({
      data: {
        id: keyId,
        ownerUserId: userId,
        keyHash,
        prefix: plaintext.substring(0, 7),
        name: 'Show Key',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: { key_encrypted: encrypted },
      }
    })
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { ownerUserId: userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  test('returns fullKey for the owner on demand', async () => {
    const mod = await import('@/app/api/apikeys/[id]/show/route')
    const res = await mod.GET(new Request(`http://localhost/api/apikeys/${keyId}/show`), { params: { id: keyId } as any })
    expect(res).toBeInstanceOf(NextResponse as any)
    const body = await (res as any).json()
    expect(body).toMatchObject({ success: true })
    expect(body.apiKey.id).toBe(keyId)
    expect(body.apiKey.fullKey).toBe(plaintext)
    // Masked version should still be present for UI
    expect(typeof body.apiKey.apiKey).toBe('string')
  })
})
