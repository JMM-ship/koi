import { prisma } from '@/app/models/db'
import { repairApiKeyPool } from '@/scripts/repair-apikey-pool'
import { checkApiKeyPool } from '@/scripts/check-apikey-pool'
import { v4 as uuidv4 } from 'uuid'
import { encryptApiKey } from '@/app/lib/crypto'

describe('scripts/repair-apikey-pool.ts', () => {
  const createdIds: string[] = []

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.apiKey.deleteMany({ where: { id: { in: createdIds } } })
    }
  })

  test('repairs invalid pool records by deleting and reseeding', async () => {
    // Seed 1 invalid and 1 valid
    const crypto = await import('crypto')
    const invPlain = 'sk-repair-INV'
    const invHash = crypto.createHash('sha256').update(invPlain + (process.env.ENCRYPTION_KEY || '')).digest('hex')
    const inv = await prisma.apiKey.create({ data: { ownerUserId: null, keyHash: invHash, prefix: invPlain.substring(0,7), name: 'Repair INV', status: 'active', meta: {} } })
    createdIds.push(inv.id)

    const id2 = uuidv4()
    const okPlain = 'sk-repair-OK'
    const okHash = crypto.createHash('sha256').update(okPlain + (process.env.ENCRYPTION_KEY || '')).digest('hex')
    const enc = encryptApiKey(okPlain, id2)
    const ok = await prisma.apiKey.create({ data: { id: id2, ownerUserId: null, keyHash: okHash, prefix: okPlain.substring(0,7), name: 'Repair OK', status: 'active', meta: { key_encrypted: enc } } })
    createdIds.push(ok.id)

    const before = await checkApiKeyPool()
    expect(before.invalid).toBeGreaterThanOrEqual(1)

    const res = await repairApiKeyPool()
    expect(res.removed).toBeGreaterThanOrEqual(1)
    expect(res.added).toBe(res.removed)

    const after = await checkApiKeyPool()
    expect(after.invalid).toBe(0)
  })
})

