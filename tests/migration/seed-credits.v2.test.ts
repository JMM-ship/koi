import { prisma } from '@/app/models/db';
import { waitForDbReady } from '../helpers/testDb';
import { seedCreditPackagesV2 } from '@/scripts/seed-credit-packages.ts';

jest.setTimeout(240000);

describe('Credits V2 Seed - planType=\'credits\' (USD, 6 SKUs)', () => {
  let backupCredits: any[] = [];
  beforeAll(async () => {
    await waitForDbReady(60000);
  });

  afterAll(async () => {
    // Clean up only credits_v2 packages
    await prisma.package.deleteMany({ where: { planType: 'credits', version: 'credits_v2' } });
    // Restore previous credits (if any)
    for (const p of backupCredits) {
      await prisma.package.create({ data: p });
    }
  });

  test('should purge existing credits SKUs and insert 6 standard USD SKUs', async () => {
    // Arrange: backup all existing credits packages and then add some mock legacy ones
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

    await prisma.package.create({ data: { name: 'Legacy Credits A', version: 'legacy_credits', priceCents: 123, currency: 'CNY', dailyPoints: 111, planType: 'credits', validDays: null, features: {}, limitations: {}, isActive: true, sortOrder: 10 } });
    await prisma.package.create({ data: { name: 'Legacy Credits B', version: 'legacy_credits', priceCents: 456, currency: 'CNY', dailyPoints: 222, planType: 'credits', validDays: null, features: {}, limitations: {}, isActive: true, sortOrder: 11 } });

    // Act
    const result = await seedCreditPackagesV2();

    // Assert
    expect(result.success).toBe(true);
    const credits = await prisma.package.findMany({ where: { planType: 'credits' }, orderBy: { sortOrder: 'asc' } });
    expect(credits.length).toBe(6);
    // All are USD and credits_v2
    for (const p of credits) {
      expect(p.currency).toBe('USD');
      expect(p.version).toBe('credits_v2');
      expect(p.isActive).toBe(true);
      // Independent credits: we mark expiry for clarity
      const f: any = p.features || {};
      expect(f.type).toBe('independent');
      expect(f.expiry).toBe('never');
    }

    const points = credits.map((p) => p.dailyPoints);
    const priceCents = credits.map((p) => p.priceCents);

    // 6 SKUs exact
    expect(points).toEqual([200, 1000, 2000, 5000, 8000, 10000]);
    expect(priceCents).toEqual([100, 500, 1000, 2500, 4000, 5000]);

    // Names (english, no Chinese)
    const names = credits.map((p) => p.name);
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
