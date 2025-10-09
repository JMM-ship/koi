import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { encryptApiKey } from '@/app/lib/crypto'

function hashApiKey(rawKey: string): string {
  const pepper = process.env.ENCRYPTION_KEY || ''
  return crypto.createHash('sha256').update(rawKey + pepper).digest('hex')
}

function generateApiKey(): string {
  const prefix = 'sk-'
  const randomBytes = crypto.randomBytes(32).toString('base64url')
  return `${prefix}${randomBytes}`
}

export async function seedApiKeyPool(count: number = 1, options?: { name?: string }) {
  const createdIds: string[] = []
  const name = options?.name || 'Seeded Pool Key'
  for (let i = 0; i < count; i++) {
    const id = uuidv4()
    const fullKey = generateApiKey()
    const keyHash = hashApiKey(fullKey)
    const prefix = fullKey.substring(0, 7)
    const keyEncrypted = encryptApiKey(fullKey, id)

    const rec = await prisma.apiKey.create({
      data: {
        id,
        ownerUserId: null,
        keyHash,
        prefix,
        name,
        status: 'active',
        meta: { key_encrypted: keyEncrypted },
      }
    })
    createdIds.push(rec.id)
  }
  return createdIds
}

async function main() {
  const arg = process.argv[2]
  const count = arg ? parseInt(arg, 10) : 1
  if (Number.isNaN(count) || count <= 0) {
    // eslint-disable-next-line no-console
    console.error('Usage: ts-node scripts/seed-apikey-pool.ts <count>')
    process.exit(1)
  }
  const ids = await seedApiKeyPool(count)
  // eslint-disable-next-line no-console
  console.log(`Seeded ${ids.length} API keys`, ids)
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  })
}

