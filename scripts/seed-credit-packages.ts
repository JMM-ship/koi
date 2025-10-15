import { prisma } from '@/app/models/db';

// USD credits SKUs: $1=200 credits
const CREDITS_V2 = [
  { name: '200 Credits', dailyPoints: 200, priceCents: 100, sortOrder: 1 },
  { name: '1000 Credits', dailyPoints: 1000, priceCents: 500, sortOrder: 2 },
  { name: '2000 Credits', dailyPoints: 2000, priceCents: 1000, sortOrder: 3 },
  { name: '5000 Credits', dailyPoints: 5000, priceCents: 2500, sortOrder: 4 },
  { name: '8000 Credits', dailyPoints: 8000, priceCents: 4000, sortOrder: 5 },
  { name: '10000 Credits', dailyPoints: 10000, priceCents: 5000, sortOrder: 6 },
];

export async function seedCreditPackagesV2(): Promise<{ success: boolean; created: number; purged: number }>
{
  // Purge all existing credits SKUs then insert v2
  const purged = (await prisma.package.deleteMany({ where: { planType: 'credits' } })).count;

  for (const sku of CREDITS_V2) {
    await prisma.package.create({
      data: {
        name: sku.name,
        version: 'credits_v2',
        description: 'Independent credits (USD)',
        priceCents: sku.priceCents,
        currency: 'USD',
        dailyPoints: sku.dailyPoints,
        planType: 'credits',
        validDays: null, // independent credits never expire by time
        features: {
          totalCredits: sku.dailyPoints,
          type: 'independent',
          expiry: 'never',
        } as any,
        limitations: {},
        isActive: true,
        sortOrder: sku.sortOrder,
      },
    });
  }

  return { success: true, created: CREDITS_V2.length, purged };
}

// CLI entry
if (require.main === module) {
  seedCreditPackagesV2()
    .then((r) => { console.log(`[seed-credit-packages] done:`, r); process.exit(0); })
    .catch((e) => { console.error(`[seed-credit-packages] failed:`, e); process.exit(1); });
}
