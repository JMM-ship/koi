/*
 * Inspect current package caps and recovery rates, plus active snapshot distributions.
 * Usage: node scripts/ops-inspect-caps.js
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({ log: ['error'] });
  try {
    await prisma.$connect();
    console.log('== Inspect: Packages (active basic/pro/enterprise) ==');
    const packages = await prisma.package.findMany({
      where: { isActive: true, planType: { in: ['basic', 'pro', 'enterprise'] } },
      orderBy: { planType: 'asc' },
      select: { id: true, name: true, planType: true, dailyPoints: true, features: true, version: true },
    });
    for (const p of packages) {
      const f = (p.features || {});
      console.log({ id: p.id, planType: p.planType, version: p.version, dailyPoints: p.dailyPoints,
        creditCap: Number(f.creditCap ?? p.dailyPoints ?? 0),
        recoveryRate: Number(f.recoveryRate ?? 0),
        dailyUsageLimit: Number(f.dailyUsageLimit ?? 0),
      });
    }

    console.log('\n== Inspect: Active UserPackage snapshots (distributions) ==');
    const totalActive = await prisma.userPackage.count({ where: { isActive: true, endAt: { gte: new Date() } } });
    console.log('Active user_packages:', totalActive);

    const capDist = await prisma.$queryRawUnsafe(`
      SELECT (package_snapshot->'features'->>'creditCap')::int AS snap_creditCap, COUNT(*)
      FROM user_packages
      WHERE is_active = true AND end_at >= now()
      GROUP BY 1
      ORDER BY 1;
    `);
    console.log('Snapshot creditCap distribution:', capDist);

    const rateDist = await prisma.$queryRawUnsafe(`
      SELECT (package_snapshot->'features'->>'recoveryRate')::int AS snap_recoveryRate, COUNT(*)
      FROM user_packages
      WHERE is_active = true AND end_at >= now()
      GROUP BY 1
      ORDER BY 1;
    `);
    console.log('Snapshot recoveryRate distribution:', rateDist);

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

