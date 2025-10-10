import { prisma } from '@/app/models/db'
import { seedApiKeyPool } from '@/scripts/seed-apikey-pool'
import { decryptApiKey } from '@/app/lib/crypto'

describe('scripts/seed-apikey-pool.ts', () => {
  const markerName = `Seeded Pool Key - test ${Date.now()}`

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { ownerUserId: null, name: markerName } })
  })

  test('seeds pool records with encrypted payload', async () => {
    const ids = await seedApiKeyPool(2, { name: markerName })
    expect(Array.isArray(ids)).toBe(true)
    expect(ids.length).toBe(2)

    const rows = await prisma.apiKey.findMany({ where: { id: { in: ids } } })
    expect(rows.length).toBe(2)
    for (const row of rows) {
      const meta: any = row.meta || {}
      expect(!!meta.key_encrypted || !!meta.keyEncrypted).toBe(true)
      const enc = meta.key_encrypted || meta.keyEncrypted
      // should decrypt with AAD=id
      const full = decryptApiKey(enc, row.id)
      expect(typeof full).toBe('string')
      expect(full.startsWith(row.prefix)).toBe(true)
      // keyHash consistency: sha256(full + ENCRYPTION_KEY)
      const crypto = await import('crypto')
      const pepper = process.env.ENCRYPTION_KEY || ''
      const hash = crypto.createHash('sha256').update(full + pepper).digest('hex')
      expect(hash).toBe(row.keyHash)
    }
  })
})

