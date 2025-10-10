import { prisma } from '@/app/models/db'
import { v4 as uuidv4 } from 'uuid'
import { encryptApiKey } from '@/app/lib/crypto'
import { getUserUuidByApiKey } from '@/app/models/apikey'

describe('getUserUuidByApiKey matches hashed storage', () => {
  const userId = uuidv4()
  const email = `test-lookup-${Date.now()}@example.com`
  const full = 'sk-lookup-TEST_123456'
  let keyId: string

  beforeAll(async () => {
    // ensure user exists
    try { await prisma.user.create({ data: { id: userId, email, nickname: 'L1', role: 'user', status: 'active', planType: 'free' } }) } catch {}
    keyId = uuidv4()
    const enc = encryptApiKey(full, keyId)
    const crypto = await import('crypto')
    const pepper = process.env.ENCRYPTION_KEY || ''
    const keyHash = crypto.createHash('sha256').update(full + pepper).digest('hex')
    await prisma.apiKey.create({ data: { id: keyId, ownerUserId: userId, keyHash, prefix: full.substring(0,7), name: 'Lookup', status: 'active', meta: { key_encrypted: enc } } })
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { id: keyId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  test('returns owner user id when provided plaintext fullKey', async () => {
    const owner = await getUserUuidByApiKey(full)
    expect(owner).toBe(userId)
  })
})

