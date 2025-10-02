/**
 * 迁移测试：替换旧套餐并创建新套餐（带特征 features），幂等可重复执行
 * - 使用“标签”限定作用范围，避免影响非测试数据
 */

import { prisma } from '@/app/models/db';
import { waitForDbReady, cleanupTestData } from '../helpers/testDb';

// 从脚本导出可测试的方法
import { migrateSubscriptionPackages } from '@/scripts/migrate-packages';

jest.setTimeout(240000);

describe('Migration - Replace Packages (tagged scope, idempotent)', () => {
  const tag = `mig-${Date.now()}`; // 用于限定测试作用范围

  beforeAll(async () => {
    await waitForDbReady(60000);
    await cleanupTestData();
  });

  afterAll(async () => {
    // 清理本测试创建的套餐（按版本包含 tag）
    await prisma.userPackage.deleteMany({ where: { packageId: { in: (await prisma.package.findMany({ where: { version: { contains: tag } }, select: { id: true } })).map(p => p.id) } } });
    await prisma.package.deleteMany({ where: { version: { contains: tag } } });
    await prisma.$disconnect();
  });

  test('应删除带 tag 的旧套餐并创建 3 个新套餐（basic/pro/enterprise），且可幂等重复', async () => {
    // 1) 先造“旧套餐”（仅限 tag 作用范围，版本包含 tag），避免影响真实数据
    await prisma.package.create({ data: { name: `Old Member ${tag}`, version: `v-old-${tag}-basic`, priceCents: 1000, currency: 'USD', dailyPoints: 1234, planType: 'basic', validDays: 30, features: { old: true }, limitations: {}, isActive: true, sortOrder: 0 } });
    await prisma.package.create({ data: { name: `Old Premium ${tag}`, version: `v-old-${tag}-pro`, priceCents: 2000, currency: 'USD', dailyPoints: 2345, planType: 'pro', validDays: 30, features: { old: true }, limitations: {}, isActive: true, sortOrder: 0 } });
    await prisma.package.create({ data: { name: `Old VIP ${tag}`, version: `v-old-${tag}-enterprise`, priceCents: 3000, currency: 'USD', dailyPoints: 3456, planType: 'enterprise', validDays: 30, features: { old: true }, limitations: {}, isActive: true, sortOrder: 0 } });

    // 2) 执行迁移（仅处理包含 tag 的套餐）
    await migrateSubscriptionPackages({ scope: 'tagged', tag });

    // 3) 校验：应存在 3 个新套餐（版本包含 tag 且含 new 标识），特征符合规范
    const created = await prisma.package.findMany({ where: { version: { contains: `new-${tag}` } } });
    expect(created.length).toBe(3);
    const byPlan: Record<string, any> = {};
    for (const p of created) byPlan[p.planType] = p;

    // basic
    expect(byPlan['basic']).toBeTruthy();
    expect((byPlan['basic'] as any).features).toMatchObject({
      creditCap: 6000,
      recoveryRate: 500,
      dailyUsageLimit: 18000,
      manualResetPerDay: 1,
    });
    expect(byPlan['basic'].dailyPoints).toBe(6000);

    // pro
    expect(byPlan['pro']).toBeTruthy();
    expect((byPlan['pro'] as any).features).toMatchObject({
      creditCap: 10000,
      recoveryRate: 1000,
      dailyUsageLimit: 34000,
      manualResetPerDay: 1,
    });
    expect(byPlan['pro'].dailyPoints).toBe(10000);

    // enterprise
    expect(byPlan['enterprise']).toBeTruthy();
    expect((byPlan['enterprise'] as any).features).toMatchObject({
      creditCap: 15000,
      recoveryRate: 2500,
      dailyUsageLimit: 75000,
      manualResetPerDay: 1,
    });
    expect(byPlan['enterprise'].dailyPoints).toBe(15000);

    // 4) 再次执行（幂等）
    await migrateSubscriptionPackages({ scope: 'tagged', tag });
    const again = await prisma.package.findMany({ where: { version: { contains: `new-${tag}` } } });
    expect(again.length).toBe(3); // 不应产生重复
  });
});
