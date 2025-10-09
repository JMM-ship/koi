import { prisma } from '@/app/models/db'
import fs from 'fs'
import path from 'path'

type Mode = 'all' | 'dedupe-only' | 'index-only'

function parseMode(): Mode {
  const args = process.argv.slice(2)
  if (args.includes('--dedupe-only')) return 'dedupe-only'
  if (args.includes('--index-only')) return 'index-only'
  return 'all'
}

async function dedupeActivePerTier() {
  const tiers = ['basic', 'pro', 'enterprise'] as const
  const nowActive = await prisma.package.findMany({
    where: {
      isActive: true,
      planType: { in: tiers as unknown as string[] },
    },
    orderBy: [
      { updatedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  const groups: Record<string, typeof nowActive> = {}
  for (const t of tiers) groups[t] = []
  for (const p of nowActive) groups[p.planType]?.push(p)

  let deactivated = 0
  const actions: Array<{ tier: string; keepId: string; deactivateIds: string[] }> = []

  for (const tier of tiers) {
    const arr = groups[tier] || []
    if (arr.length <= 1) continue
    // Ensure stable order: latest first
    arr.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt) || Number(b.createdAt) - Number(a.createdAt))
    const keep = arr[0]
    const toDeactivate = arr.slice(1)
    const ids = toDeactivate.map(p => p.id)
    if (ids.length) {
      await prisma.package.updateMany({ where: { id: { in: ids } }, data: { isActive: false } })
      deactivated += ids.length
      actions.push({ tier, keepId: keep.id, deactivateIds: ids })
    }
  }

  return { deactivated, actions }
}

function splitSqlStatements(sql: string): string[] {
  const lines = sql
    .split('\n')
    .filter(l => !l.trim().startsWith('--'))
  const joined = lines.join('\n')
  return joined
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
}

async function createUniqueIndex() {
  const sqlPath = path.join(process.cwd(), 'prisma', 'packages_unique_active.migration.sql')
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found: ${sqlPath}`)
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  const stmts = splitSqlStatements(sql)
  for (const stmt of stmts) {
    await (prisma as any).$executeRawUnsafe(stmt)
  }
}

async function main() {
  const mode = parseMode()
  const doDedupe = mode === 'all' || mode === 'dedupe-only'
  const doIndex = mode === 'all' || mode === 'index-only'

  if (doDedupe) {
    console.log('[enforce-unique-active] Deactivating duplicates per tier...')
    const res = await dedupeActivePerTier()
    console.log(`[enforce-unique-active] Deactivated: ${res.deactivated}`)
    res.actions.forEach(a => {
      console.log(`  - ${a.tier}: keep ${a.keepId}, deactivated ${a.deactivateIds.join(', ')}`)
    })
  }

  if (doIndex) {
    console.log('[enforce-unique-active] Creating partial unique index...')
    await createUniqueIndex()
    console.log('[enforce-unique-active] Index ensured.')
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

