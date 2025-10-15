/*
 * Test script to verify plan caps and recovery rates took effect.
 * - Checks active packages (basic/pro/enterprise):
 *   creditCap == floor(dailyPoints/2)
 *   recoveryRate == 250/500/1250
 *   dailyUsageLimit == 9000/17000/37500
 * - Checks active user_packages snapshots align with package values (cap & recovery).
 *
 * Usage: node scripts/test-plan-caps.js
 * Exit code: 0 on success; 1 on failure.
 */
const { PrismaClient } = require('@prisma/client');

const EXPECTED_RECOVERY = { basic: 250, pro: 500, enterprise: 1250 };
const EXPECTED_DAILY_LIMIT = { basic: 9000, pro: 17000, enterprise: 37500 };

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

async function main() {
  const prisma = new PrismaClient({ log: ['error'] });
  try {
    await prisma.$connect();

    console.log('== Checking active packages ==');
    const packages = await prisma.package.findMany({
      where: { isActive: true, planType: { in: ['basic','pro','enterprise'] } },
      orderBy: { planType: 'asc' },
      select: { id: true, planType: true, dailyPoints: true, features: true, version: true }
    });
    const byType = Object.fromEntries(packages.map(p => [p.planType, p]));
    for (const pt of ['basic','pro','enterprise']) {
      const p = byType[pt];
      if (!p) { fail(`missing active package for planType=${pt}`); continue; }
      const f = p.features || {};
      const expectedCap = Math.floor((p.dailyPoints || 0) / 2);
      const cap = Number(f.creditCap ?? p.dailyPoints ?? 0);
      const rrate = Number(f.recoveryRate ?? 0);
      const dlimit = Number(f.dailyUsageLimit ?? 0);
      if (cap !== expectedCap) fail(`package ${pt} creditCap mismatch: got=${cap}, expected=${expectedCap}`);
      if (rrate !== EXPECTED_RECOVERY[pt]) fail(`package ${pt} recoveryRate mismatch: got=${rrate}, expected=${EXPECTED_RECOVERY[pt]}`);
      if (dlimit !== EXPECTED_DAILY_LIMIT[pt]) fail(`package ${pt} dailyUsageLimit mismatch: got=${dlimit}, expected=${EXPECTED_DAILY_LIMIT[pt]}`);
      console.log({ planType: pt, dailyPoints: p.dailyPoints, creditCap: cap, recoveryRate: rrate, dailyUsageLimit: dlimit });
    }

    console.log('\n== Checking active user_packages snapshots ==');
    const rows = await prisma.$queryRawUnsafe(`
      SELECT up.id AS up_id, up.user_id, p.plan_type,
             up.daily_points AS up_daily_points,
             (up.package_snapshot->'features'->>'creditCap')::int AS snap_cap,
             (up.package_snapshot->'features'->>'recoveryRate')::int AS snap_recovery,
             (p.features->>'creditCap')::int AS pkg_cap,
             (p.features->>'recoveryRate')::int AS pkg_recovery
      FROM user_packages up
      JOIN packages p ON p.id = up.package_id
      WHERE up.is_active = true AND up.end_at >= now() AND p.plan_type IN ('basic','pro','enterprise')
      ORDER BY up.end_at DESC
    `);
    let checked = 0;
    for (const r of rows) {
      checked++;
      const pt = r.plan_type;
      const expCap = r.pkg_cap ?? Math.floor((r.up_daily_points || 0) / 2);
      if (r.snap_cap !== expCap) fail(`snapshot cap mismatch up=${r.up_id} plan=${pt}: snap=${r.snap_cap}, expected=${expCap}`);
      const expRec = EXPECTED_RECOVERY[pt];
      if (r.snap_recovery !== expRec) fail(`snapshot recovery mismatch up=${r.up_id} plan=${pt}: snap=${r.snap_recovery}, expected=${expRec}`);
    }
    console.log(`Checked active snapshots: ${checked}`);

  } catch (e) {
    fail(e?.message || String(e));
  } finally {
    await prisma.$disconnect();
    if (process.exitCode && process.exitCode !== 0) {
      process.exit(process.exitCode);
    } else {
      console.log('\nALL CHECKS PASSED');
    }
  }
}

main();

