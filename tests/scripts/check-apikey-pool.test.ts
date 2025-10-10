import { prisma } from '@/app/models/db'
import { checkApiKeyPool } from '@/scripts/check-apikey-pool'
import { encryptApiKey } from '@/app/lib/crypto'
import { v4 as uuidv4 } from 'uuid'

describe('scripts/check-apikey-pool.ts', () => {
  const toCleanupIds: string[] = []

  afterAll(async () => {
    if (toCleanupIds.length) {
      await prisma.apiKey.deleteMany({ where: { id: { in: toCleanupIds } } })
    }
  })

  test('detects invalid and valid pool records', async () => {
    // create invalid pool record (no encrypted meta)
    const crypto = await import('crypto')
    const p1 = 'sk-pool-INV1'
    const h1 = crypto.createHash('sha256').update(p1 + (process.env.ENCRYPTION_KEY || '')).digest('hex')
    const inv1 = await prisma.apiKey.create({ data: { ownerUserId: null, keyHash: h1, prefix: p1.substring(0,7), name: 'Pool INV1', status: 'active', meta: {} } })
    toCleanupIds.push(inv1.id)

    // create valid pool record
    const id2 = uuidv4()
    const p2 = 'sk-pool-VALID2'
    const h2 = crypto.createHash('sha256').update(p2 + (process.env.ENCRYPTION_KEY || '')).digest('hex')
    const enc2 = encryptApiKey(p2, id2)
    const val2 = await prisma.apiKey.create({ data: { id: id2, ownerUserId: null, keyHash: h2, prefix: p2.substring(0,7), name: 'Pool VAL2', status: 'active', meta: { key_encrypted: enc2 } } })
    toCleanupIds.push(val2.id)

    const s = await checkApiKeyPool()
    expect(s.total).toBeGreaterThanOrEqual(2)
    expect(s.invalid).toBeGreaterThanOrEqual(1)
    expect(s.invalidIds).toContain(inv1.id)
  })
})

