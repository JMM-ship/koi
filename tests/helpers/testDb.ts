import { prisma } from '@/app/models/db';

// 简单重试工具：用于远程数据库偶发连接失败场景
async function withRetry<T>(fn: () => Promise<T>, retries = 6, baseDelayMs = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      // 仅对连接/可重试错误做退避
      const msg = String(err?.message || '');
      if (
        msg.includes("Can't reach database server") ||
        msg.includes('ECONN') ||
        msg.includes('timeout') ||
        msg.includes('connection')
      ) {
        const delay = baseDelayMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * 测试数据库辅助工具
 */

// 清理所有测试数据
export async function cleanupTestData() {
  // 退避重试：拆分事务，减少长事务与死锁风险
  await withRetry(async () => {
    // 只清理测试相关的数据（通过邮箱前缀识别）
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test.com' } },
          { email: { contains: '@test.com' } },
          { email: { startsWith: 'test-' } },
          { email: { startsWith: 'auto-recovery-' } },
          { email: { startsWith: 'no-package-' } },
          { email: { startsWith: 'manual-reset-' } },
          { email: { startsWith: 'use-credits-' } },
          { email: { startsWith: 'integ-' } },
        ]
      },
      select: { id: true }
    });

    const testUserIds = testUsers.map(u => u.id);

    if (testUserIds.length > 0) {
      // 顺序删除，避免跨表死锁
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.usageRecord.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.oauthSession.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: testUserIds } } });
      await prisma.userPackage.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.apiKey.deleteMany({ where: { ownerUserId: { in: testUserIds } } });
      await prisma.wallet.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.order.deleteMany({ where: { userId: { in: testUserIds } } });
      // 再次确保流水清空
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: testUserIds } } });

      try {
        await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('Foreign key constraint') || msg.includes('user_packages')) {
          await prisma.userPackage.deleteMany({ where: { userId: { in: testUserIds } } });
          await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
        } else {
          throw err;
        }
      }
    }

  const testPkgs = await prisma.package.findMany({
    where: { version: { contains: 'test' } },
    select: { id: true }
  });
  const testPkgIds = testPkgs.map(p => p.id);
  if (testPkgIds.length > 0) {
    // 先删除引用这些套餐的订单，避免外键约束
    await prisma.order.deleteMany({ where: { packageId: { in: testPkgIds } } });
    await prisma.userPackage.deleteMany({ where: { packageId: { in: testPkgIds } } });
    await prisma.package.deleteMany({ where: { id: { in: testPkgIds } } });
  }
  }, 3, 1000);
}

// 等待数据库连接就绪（用于远端连接偶发不可达的情况）
export async function waitForDbReady(timeoutMs: number = 60000) {
  const start = Date.now();
  let lastErr: any;
  while (Date.now() - start < timeoutMs) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

// 创建测试用户
export async function createTestUser(options?: {
  email?: string;
  nickname?: string;
  role?: string;
}) {
  const email = options?.email || `test-${Date.now()}@example.com`;

  const user = await prisma.user.create({
    data: {
      email,
      nickname: options?.nickname || 'Test User',
      role: options?.role || 'user',
      status: 'active',
      planType: 'free',
      totalCredits: 0,
    },
  });

  // 创建钱包
  await prisma.wallet.create({
    data: {
      userId: user.id,
      packageDailyQuotaTokens: BigInt(0),
      packageTokensRemaining: BigInt(0),
      independentTokens: BigInt(0),
      lockedTokens: BigInt(0),
      version: 0,
    },
  });

  return user;
}

// 创建测试套餐
export async function createTestPackage(options?: {
  name?: string;
  priceCents?: number;
  dailyPoints?: number;
  planType?: string;
  features?: any;
}) {
  // 使用时间戳和随机数确保唯一性
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const uniqueSuffix = `${timestamp}-${random}`;

  return await prisma.package.create({
    data: {
      name: options?.name || 'Test Package',
      version: `v1.0-test-${uniqueSuffix}`, // 确保版本号唯一
      priceCents: options?.priceCents || 5000,
      currency: 'USD',
      dailyPoints: options?.dailyPoints || 6000,
      planType: options?.planType || 'basic', // 修改为符合约束的值
      validDays: 30,
      features: options?.features || {
        creditCap: 6000,
        recoveryRate: 500,
        dailyUsageLimit: 18000,
        manualResetPerDay: 1,
      },
      limitations: {},
      isActive: true,
      sortOrder: 0,
    },
  });
}

// 创建用户套餐
export async function createTestUserPackage(
  userId: string,
  packageId: string,
  options?: {
    startAt?: Date;
    endAt?: Date;
    dailyPoints?: number;
  }
) {
  const startAt = options?.startAt || new Date();
  const endAt = options?.endAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后
  const dailyPoints = options?.dailyPoints || 6000;

  return await withRetry(async () => {
    // 获取套餐信息用于快照（考虑远端一致性，重试直到可见）
    const packageInfo = await prisma.package.findUnique({ where: { id: packageId } });
    if (!packageInfo) {
      throw new Error('Package not found for userPackage creation');
    }

    return await prisma.userPackage.create({
      data: {
        userId,
        packageId,
        orderId: null, // 测试环境不关联订单
        startAt,
        endAt,
        dailyPoints,
        dailyQuotaTokens: BigInt(dailyPoints),
        isActive: true,
        packageSnapshot: {
          id: packageInfo.id,
          name: packageInfo.name,
          version: packageInfo.version,
          price: packageInfo.priceCents / 100,
          priceCents: packageInfo.priceCents,
          dailyCredits: packageInfo.dailyPoints,
          dailyPoints: packageInfo.dailyPoints,
          validDays: packageInfo.validDays,
          features: packageInfo.features,
        },
      },
    });
  }, 6, 800);
}

// 设置用户钱包余额
export async function setWalletBalance(
  userId: string,
  options: {
    packageTokensRemaining?: number;
    independentTokens?: number;
    dailyUsageCount?: number;
    dailyUsageResetAt?: Date;
    manualResetCount?: number;
    lastRecoveryAt?: Date;
  }
) {
  return await withRetry(async () => {
    return await prisma.wallet.upsert({
      where: { userId },
      update: {
        packageTokensRemaining: options.packageTokensRemaining !== undefined
          ? BigInt(options.packageTokensRemaining)
          : undefined,
        independentTokens: options.independentTokens !== undefined
          ? BigInt(options.independentTokens)
          : undefined,
        dailyUsageCount: options.dailyUsageCount !== undefined
          ? BigInt(options.dailyUsageCount)
          : undefined,
        dailyUsageResetAt: options.dailyUsageResetAt,
        manualResetCount: options.manualResetCount,
        lastRecoveryAt: options.lastRecoveryAt,
      },
      create: {
        userId,
        packageDailyQuotaTokens: BigInt(0),
        packageTokensRemaining: BigInt(options.packageTokensRemaining ?? 0),
        independentTokens: BigInt(options.independentTokens ?? 0),
        lockedTokens: BigInt(0),
        version: 0,
        dailyUsageCount: BigInt(options.dailyUsageCount ?? 0),
        dailyUsageResetAt: options.dailyUsageResetAt,
        manualResetCount: options.manualResetCount ?? 0,
        lastRecoveryAt: options.lastRecoveryAt,
      },
    });
  }, 4, 500);
}
