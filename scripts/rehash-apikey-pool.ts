import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { decryptApiKey } from '@/app/lib/crypto'

function hashApiKey(rawKey: string): string {
  const pepper = process.env.ENCRYPTION_KEY || ''
  return crypto.createHash('sha256').update(rawKey + pepper).digest('hex')
}

export async function rehashApiKeyPool(limit?: number) {
  const where = { ownerUserId: null as any, status: 'active' as any }
  const rows = await prisma.apiKey.findMany({ where, select: { id: true, keyHash: true, meta: true, prefix: true }, take: limit })
  let scanned = 0
  let updated = 0
  for (const row of rows) {
    scanned++
    const meta: any = row.meta || {}
    const enc: string | undefined = meta.key_encrypted || meta.keyEncrypted
    if (!enc) continue // only rehash records we can decrypt reliably
    try {
      const full = decryptApiKey(enc, row.id)
      const newHash = hashApiKey(full)
      if (newHash !== row.keyHash) {
        await prisma.apiKey.update({ where: { id: row.id }, data: { keyHash: newHash, prefix: full.substring(0, 7) } })
        updated++
      }
    } catch (e) {
      // skip records that cannot be decrypted under current API_KEYS_ATREST_KEY
    }
  }
  return { scanned, updated }
}

async function main() {
  const arg = process.argv[2]
  const limit = arg ? parseInt(arg, 10) : undefined
  const res = await rehashApiKeyPool(limit)
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1) })
}

