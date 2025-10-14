import { prisma } from '@/app/models/db';

export interface MigrateOptions {
  scope?: 'tagged' | 'all';
  tag?: string; // when scope = 'tagged', operate only on packages whose version contains tag
  confirmAll?: boolean; // safety guard for destructive 'all'
}

const NEW_SKUS = [
  {
    planType: 'basic',
    name: 'BASE',
    dailyPoints: 6000,
    priceCents: 5000,
    features: { creditCap: 3000, recoveryRate: 250, dailyUsageLimit: 9000, manualResetPerDay: 1 },
  },
  {
    planType: 'pro',
    name: 'PRO',
    dailyPoints: 10000,
    priceCents: 10000,
    features: { creditCap: 5000, recoveryRate: 500, dailyUsageLimit: 17000, manualResetPerDay: 1 },
  },
  {
    planType: 'enterprise',
    name: 'MAX',
    dailyPoints: 15000,
    priceCents: 20000,
    features: { creditCap: 7500, recoveryRate: 1250, dailyUsageLimit: 37500, manualResetPerDay: 1 },
  },
];

export async function migrateSubscriptionPackages(options: MigrateOptions = {}): Promise<{ created: number; deleted: number }>
{
  const scope = options.scope || 'tagged';
  const tag = options.tag || '';

  if (scope === 'tagged' && !tag) {
    throw new Error('Tag is required when scope = tagged');
  }

  if (scope === 'all' && !options.confirmAll) {
    throw new Error('confirmAll must be true to run destructive ALL scope');
  }

  // 1) 删除旧套餐（按范围）
  let deleted = 0;
  if (scope === 'tagged') {
    const toDelete = await prisma.package.findMany({ where: { version: { contains: tag } }, select: { id: true } });
    if (toDelete.length) {
      await prisma.order.deleteMany({ where: { packageId: { in: toDelete.map(p => p.id) } } });
      await prisma.userPackage.deleteMany({ where: { packageId: { in: toDelete.map(p => p.id) } } });
      const del = await prisma.package.deleteMany({ where: { id: { in: toDelete.map(p => p.id) } } });
      deleted = del.count;
    }
  } else {
    // 极度危险：删除所有三档套餐
    const toDelete = await prisma.package.findMany({ where: { planType: { in: ['basic','pro','enterprise'] } }, select: { id: true } });
    await prisma.order.deleteMany({ where: { packageId: { in: toDelete.map(p => p.id) } } });
    await prisma.userPackage.deleteMany({ where: { packageId: { in: toDelete.map(p => p.id) } } });
    const del = await prisma.package.deleteMany({ where: { id: { in: toDelete.map(p => p.id) } } });
    deleted = del.count;
  }

  // 2) 创建新套餐（版本号可包含 tag 以便追踪与幂等）
  let created = 0;
  for (const sku of NEW_SKUS) {
    const version = scope === 'tagged' ? `v-new-${tag}-${sku.planType}` : `v-${new Date().toISOString().slice(0,10)}-${sku.planType}`;

    // 幂等：若存在相同 (name, version)，则更新为新配置；否则创建
    // 由于 Prisma 复合唯一约束 upsert 需要复合 where，使用查找 + create/update 代替
    const existing = await prisma.package.findFirst({ where: { name: sku.name, version } });
    if (existing) {
      await prisma.package.update({
        where: { id: existing.id },
        data: {
          priceCents: sku.priceCents,
          dailyPoints: sku.dailyPoints,
          features: sku.features as any,
          isActive: true,
        },
      });
    } else {
      await prisma.package.create({
        data: {
          name: sku.name,
          version,
          description: 'Subscription plan (migrated)',
          priceCents: sku.priceCents,
          currency: 'USD',
          dailyPoints: sku.dailyPoints,
          planType: sku.planType,
          validDays: 30,
          features: sku.features as any,
          limitations: {},
          isActive: true,
          sortOrder: 0,
        },
      });
      created += 1;
    }
  }

  return { created, deleted };
}

// CLI 入口（谨慎使用）
if (require.main === module) {
  const scope = (process.env.MIGRATION_SCOPE as 'tagged' | 'all') || 'tagged';
  const tag = process.env.MIGRATION_TAG || `cli-${Date.now()}`;
  const confirmAll = process.env.CONFIRM_ALL === 'true';
  migrateSubscriptionPackages({ scope, tag, confirmAll })
    .then((r) => {
      console.log(`[migrate-packages] done:`, r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(`[migrate-packages] failed:`, e);
      process.exit(1);
    });
}
