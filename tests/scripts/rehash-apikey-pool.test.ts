import { prisma } from '@/app/models/db'
import { rehashApiKeyPool } from '@/scripts/rehash-apikey-pool'
import { v4 as uuidv4 } from 'uuid'
import { encryptApiKey } from '@/app/lib/crypto'

describe('scripts/rehash-apikey-pool.ts', () => {
  const createdIds: string[] = []
  const OLD_ENV = process.env

  beforeAll(() => {
    process.env = { ...OLD_ENV, ENCRYPTION_KEY: 'pepper-new' }
  })

  afterAll(async () => {
    process.env = OLD_ENV
    if (createdIds.length) {
      await prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } })
    }
  })

  test('rehashes pool records to match current ENCRYPTION_KEY', async () => {
    const crypto = await import('crypto')
    const id = uuidv4()
    const full = 'sk-rehash-TEST_ABC'
    const enc = encryptApiKey(full, id)

    // Insert with keyHash computed using a different pepper
    const wrongPepper = 'pepper-old'
    const wrongHash = crypto.createHash('sha256').update(full + wrongPepper).digest('hex')
    const row = await prisma.apiKey.create({
      data: {
        id,
        ownerUserId: null,
        keyHash: wrongHash,
        prefix: full.substring(0, 7),
        name: 'Pool REHASH',
        status: 'active',
        meta: { key_encrypted: enc },
      }
    })
    createdIds.push(row.id)

    const res = await rehashApiKeyPool()
    expect(res.scanned).toBeGreaterThanOrEqual(1)

    const updated = await prisma.apiKey.findUnique({ where: { id } })
    const rightHash = crypto.createHash('sha256').update(full + (process.env.ENCRYPTION_KEY || '')).digest('hex')
    expect(updated?.keyHash).toBe(rightHash)
  })
})

