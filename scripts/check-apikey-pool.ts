import prisma from '@/lib/prisma'

export type PoolCheckSummary = {
  total: number
  valid: number
  invalid: number
  invalidIds: string[]
}

export async function checkApiKeyPool(): Promise<PoolCheckSummary> {
  const rows = await prisma.apiKey.findMany({
    where: { ownerUserId: null, status: 'active' },
    select: { id: true, meta: true }
  })

  let invalid = 0
  const invalidIds: string[] = []
  for (const r of rows) {
    const meta: any = r.meta || {}
    const ok = !!(meta.key_encrypted || meta.keyEncrypted)
    if (!ok) { invalid++; invalidIds.push(r.id) }
  }
  const total = rows.length
  const valid = total - invalid
  return { total, valid, invalid, invalidIds }
}

async function main() {
  const s = await checkApiKeyPool()
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(s, null, 2))
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1) })
}

