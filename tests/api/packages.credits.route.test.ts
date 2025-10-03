import { prisma } from '@/app/models/db';
import { seedCreditPackagesV2 } from '@/scripts/seed-credit-packages.ts';
import { GET as getCreditsRoute } from '@/app/api/packages/credits/route';

jest.setTimeout(120000);

describe('GET /api/packages/credits - USD credits list', () => {
  let backupCredits: any[] = [];
  beforeAll(async () => {
    // Backup existing credits SKUs
    const existing = await prisma.package.findMany({ where: { planType: 'credits' } });
    backupCredits = existing.map((p) => ({
      name: p.name,
      version: p.version,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      dailyPoints: p.dailyPoints,
      planType: p.planType,
      validDays: p.validDays,
      features: p.features as any,
      limitations: p.limitations as any,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    }));

    // Ensure v2 data exists
    await seedCreditPackagesV2();
  });

  afterAll(async () => {
    // Clean up the v2 credits SKUs written by the test
    await prisma.package.deleteMany({ where: { planType: 'credits', version: 'credits_v2' } });
    // Restore backup
    for (const p of backupCredits) {
      await prisma.package.create({ data: p });
    }
  });

  test('returns 6 USD credits SKUs with correct price and points', async () => {
    // The route handler ignores request details, pass a dummy
    const res: any = await getCreditsRoute({} as any);
    const body = await res.json();

    expect(body?.success).toBe(true);
    expect(Array.isArray(body?.data?.packages)).toBe(true);
    expect(body.data.packages.length).toBe(6);

    const credits = body.data.packages.map((p: any) => p.credits);
    const prices = body.data.packages.map((p: any) => p.price);
    const currencies = body.data.packages.map((p: any) => p.currency);

    expect(credits).toEqual([200, 1000, 2000, 5000, 8000, 10000]);
    expect(prices).toEqual([1, 5, 10, 25, 40, 50]);
    expect([...new Set(currencies)]).toEqual(['USD']);

    // Names are English
    const names = body.data.packages.map((p: any) => p.name);
    expect(names).toEqual([
      '200 Credits',
      '1000 Credits',
      '2000 Credits',
      '5000 Credits',
      '8000 Credits',
      '10000 Credits',
    ]);
  });
});
