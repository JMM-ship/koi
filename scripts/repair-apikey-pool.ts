import prisma from '@/lib/prisma'
import { seedApiKeyPool } from '@/scripts/seed-apikey-pool'
import { checkApiKeyPool } from '@/scripts/check-apikey-pool'

export type RepairSummary = {
  removed: number
  added: number
}

export async function repairApiKeyPool(): Promise<RepairSummary> {
  const s = await checkApiKeyPool()
  if (s.invalid === 0) return { removed: 0, added: 0 }

  // delete invalid pool records
  await prisma.apiKey.deleteMany({ where: { id: { in: s.invalidIds } } })

  // re-seed same count
  const newIds = await seedApiKeyPool(s.invalid, { name: 'Repaired Pool Key' })
  return { removed: s.invalid, added: newIds.length }
}

async function main() {
  const res = await repairApiKeyPool()
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1) })
}

