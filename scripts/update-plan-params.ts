import { prisma } from '@/app/models/db'

type Mode = 'dry-run' | 'apply'

function parseArgs(): { mode: Mode } {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  return { mode: apply ? 'apply' : 'dry-run' }
}

type Tier = 'basic' | 'pro' | 'enterprise'
const TARGETS: Record<Tier, { creditCap: number; recoveryRate: number; dailyUsageLimit: number }> = {
  basic: { creditCap: 3000, recoveryRate: 250, dailyUsageLimit: 9000 },
  pro: { creditCap: 5000, recoveryRate: 500, dailyUsageLimit: 17000 },
  enterprise: { creditCap: 7500, recoveryRate: 1250, dailyUsageLimit: 37500 },
}

async function main() {
  const { mode } = parseArgs()
  const tiers: Tier[] = ['basic', 'pro', 'enterprise']

  console.log(`[update-plan-params] mode=${mode}`)

  const active = await prisma.package.findMany({
    where: { isActive: true, planType: { in: tiers as unknown as string[] } },
    orderBy: [{ planType: 'asc' }, { updatedAt: 'desc' }],
  })

  if (active.length === 0) {
    console.log('[update-plan-params] No active subscription packages found.')
    return
  }

  let updateCount = 0
  for (const p of active) {
    const tier = p.planType as Tier
    if (!(tier in TARGETS)) continue
    const before = (p.features as any) || {}
    const target = TARGETS[tier]
    const after = {
      ...before,
      creditCap: target.creditCap,
      recoveryRate: target.recoveryRate,
      dailyUsageLimit: target.dailyUsageLimit,
    }

    console.log('\n[update-plan-params] package:', {
      id: p.id,
      tier,
      name: p.name,
      version: p.version,
      currentCap: before?.creditCap,
      currentRecovery: before?.recoveryRate,
      currentDailyUsageLimit: before?.dailyUsageLimit,
      newCap: after.creditCap,
      newRecovery: after.recoveryRate,
      newDailyUsageLimit: after.dailyUsageLimit,
    })

    if (mode === 'apply') {
      await prisma.package.update({
        where: { id: p.id },
        data: { features: after as any },
      })
      updateCount++
    }
  }

  if (mode === 'apply') {
    console.log(`\n[update-plan-params] Updated ${updateCount} active packages.`)
  } else {
    console.log('\n[update-plan-params] Dry-run complete. Use --apply to persist changes.')
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error('[update-plan-params] failed:', e); process.exit(1) })
