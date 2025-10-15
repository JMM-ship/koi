/*
 * Reduce creditCap by half for all plans (basic/pro/enterprise) and active snapshots,
 * and set recoveryRate to 250/500/1250 respectively (templates + snapshots).
 * Optionally clamp wallet package_tokens_remaining to new caps.
 *
 * Usage: node scripts/ops-reconfigure-caps-and-recovery.js [--clamp-wallets]
 */
const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient({ log: ['error'] });
  const clampWallets = process.argv.includes('--clamp-wallets');
  try {
    await prisma.$connect();

    console.log('Step 1: Set package creditCap = floor(dailyPoints/2)');
    const r0 = await prisma.$executeRawUnsafe(`
      UPDATE packages p
      SET features = jsonb_set(
        COALESCE(p.features, '{}'::jsonb),
        '{creditCap}',
        to_jsonb( (p.daily_points / 2)::int )
      )
      WHERE p.is_active = true AND p.plan_type IN ('basic','pro','enterprise');
    `);
    console.log(`  Packages updated (creditCap from dailyPoints/2): ${Number(r0) || 0}`);

    console.log('Step 2: Sync snapshot creditCap to package creditCap (no double-halving)');
    const r1 = await prisma.$executeRawUnsafe(`
      UPDATE user_packages up
      SET package_snapshot = jsonb_set(
        COALESCE(up.package_snapshot, '{}'::jsonb),
        '{features,creditCap}',
        to_jsonb(
          COALESCE((p.features->>'creditCap')::int, p.daily_points)
        ),
        true
      )
      FROM packages p
      WHERE up.package_id = p.id
        AND up.is_active = true
        AND up.end_at >= now()
        AND p.plan_type IN ('basic','pro','enterprise');
    `);
    console.log(`  Snapshots updated (halve cap): ${Number(r1) || 0}`);

    console.log('Step 3: Set recoveryRate to 250/500/1250 in packages');
    const r2 = await prisma.$executeRawUnsafe(`
      UPDATE packages p
      SET features = jsonb_set(
        COALESCE(p.features, '{}'::jsonb),
        '{recoveryRate}',
        to_jsonb(CASE p.plan_type WHEN 'basic' THEN 250 WHEN 'pro' THEN 500 WHEN 'enterprise' THEN 1250 END)
      )
      WHERE p.is_active = true AND p.plan_type IN ('basic','pro','enterprise');
    `);
    console.log(`  Packages updated (recoveryRate): ${Number(r2) || 0}`);

    console.log('Step 4: Set recoveryRate in active snapshots from package planType');
    const r3 = await prisma.$executeRawUnsafe(`
      UPDATE user_packages up
      SET package_snapshot = jsonb_set(
        COALESCE(up.package_snapshot, '{}'::jsonb),
        '{features,recoveryRate}',
        to_jsonb(CASE p.plan_type WHEN 'basic' THEN 250 WHEN 'pro' THEN 500 WHEN 'enterprise' THEN 1250 END),
        true
      )
      FROM packages p
      WHERE up.package_id = p.id
        AND up.is_active = true
        AND up.end_at >= now()
        AND p.plan_type IN ('basic','pro','enterprise');
    `);
    console.log(`  Snapshots updated (recoveryRate): ${Number(r3) || 0}`);

    if (clampWallets) {
      console.log('Step 5 (optional): Clamp wallets.package_tokens_remaining to new caps (using snapshot cap)');
      const r4 = await prisma.$executeRawUnsafe(`
        UPDATE wallets w
        SET package_tokens_remaining = LEAST(
          w.package_tokens_remaining,
          COALESCE((
            SELECT ((up.package_snapshot->'features'->>'creditCap')::int)::bigint
            FROM user_packages up
            WHERE up.user_id = w.user_id AND up.is_active = true AND up.end_at >= now()
            ORDER BY up.end_at DESC
            LIMIT 1
          ), w.package_tokens_remaining)
        )
        WHERE EXISTS (
          SELECT 1 FROM user_packages up
          WHERE up.user_id = w.user_id AND up.is_active = true AND up.end_at >= now()
        );
      `);
      console.log(`  Wallet rows clamped: ${Number(r4) || 0}`);
    } else {
      console.log('Step 5: Skip wallets clamp (run with --clamp-wallets to enable)');
    }

    console.log('Done.');
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
