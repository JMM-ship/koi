import { prisma } from '@/app/models/db'

const DESIRED = {
  planType: 'basic' as const,
  name: 'BASE',
  priceCents: 5000,
  currency: 'USD',
  dailyPoints: 6000,
  validDays: 30,
  features: {
    creditCap: 6000,
    recoveryRate: 500,
    dailyUsageLimit: 18000,
    manualResetPerDay: 1,
  },
  sortOrder: 0,
}

async function main() {
  console.log('[restore-basic-plan] Checking current packages...')

  // 1) Already-active basic plan?
  const active = await prisma.package.findFirst({
    where: { planType: DESIRED.planType, isActive: true },
  })

  if (active) {
    console.log('[restore-basic-plan] Active basic plan already exists:')
    console.log({ id: active.id, name: active.name, version: active.version, priceCents: active.priceCents, dailyPoints: active.dailyPoints, isActive: active.isActive })
    return
  }

  // 2) No active one. Try reactivate the latest basic plan if any
  const latest = await prisma.package.findFirst({
    where: { planType: DESIRED.planType },
    orderBy: { updatedAt: 'desc' },
  })

  if (latest) {
    console.log('[restore-basic-plan] Found existing basic plan. Re-activating and updating fields...')
    const updated = await prisma.package.update({
      where: { id: latest.id },
      data: {
        isActive: true,
        priceCents: DESIRED.priceCents,
        currency: DESIRED.currency,
        dailyPoints: DESIRED.dailyPoints,
        validDays: DESIRED.validDays,
        features: DESIRED.features as any,
        sortOrder: DESIRED.sortOrder,
      },
    })
    console.log('[restore-basic-plan] Re-activated:')
    console.log({ id: updated.id, name: updated.name, version: updated.version, priceCents: updated.priceCents, dailyPoints: updated.dailyPoints, isActive: updated.isActive })
    return
  }

  // 3) Create a fresh basic plan
  const version = `v-restore-${new Date().toISOString().slice(0,10)}-basic`
  console.log('[restore-basic-plan] No basic plan found. Creating a fresh one...')
  const created = await prisma.package.create({
    data: {
      name: DESIRED.name,
      version,
      description: 'Restored Basic subscription plan',
      priceCents: DESIRED.priceCents,
      currency: DESIRED.currency,
      dailyPoints: DESIRED.dailyPoints,
      planType: DESIRED.planType,
      validDays: DESIRED.validDays,
      features: DESIRED.features as any,
      limitations: {},
      isActive: true,
      sortOrder: DESIRED.sortOrder,
    },
  })
  console.log('[restore-basic-plan] Created:')
  console.log({ id: created.id, name: created.name, version: created.version, priceCents: created.priceCents, dailyPoints: created.dailyPoints, isActive: created.isActive })
}

main().then(() => process.exit(0)).catch((e) => { console.error('[restore-basic-plan] failed:', e); process.exit(1) })
