/**
 * 积分恢复服务
 * 实现按小时持续恢复的积分系统
 */

import { prisma } from '@/app/models/db';

export interface PackageConfig {
  creditCap: number;          // 积分上限
  recoveryRate: number;       // 每小时恢复速度
  dailyUsageLimit: number;    // 每日使用上限
  manualResetPerDay: number;  // 每日手动重置次数
}

/**
 * 计算应该恢复的积分数量
 * @param lastRecoveryTime 上次恢复时间
 * @param currentCredits 当前积分
 * @param config 套餐配置
 * @param now 当前时间（可选，用于测试）
 * @returns 应恢复的积分数量
 */
export function calculateRecoverableCredits(
  lastRecoveryTime: Date,
  currentCredits: number,
  config: PackageConfig,
  now: Date = new Date()
): number {
  // 1. 计算经过的时间（小时）
  const millisecondsPassed = now.getTime() - lastRecoveryTime.getTime();
  const hoursPassed = millisecondsPassed / (1000 * 60 * 60);

  // 2. 如果时间没有过去，不恢复
  if (hoursPassed <= 0) {
    return 0;
  }

  // 3. 计算应恢复的积分（向下取整）
  const recoveredAmount = Math.floor(hoursPassed * config.recoveryRate);

  // 4. 计算恢复后的总积分
  const newCredits = currentCredits + recoveredAmount;

  // 5. 不能超过上限
  if (newCredits > config.creditCap) {
    // 只恢复到上限
    return Math.max(0, config.creditCap - currentCredits);
  }

  // 6. 如果当前已达到或超过上限，不恢复
  if (currentCredits >= config.creditCap) {
    return 0;
  }

  return recoveredAmount;
}

// already imported prisma above

/**
 * 自动按小时恢复订阅套餐积分（独立积分不参与）
 * - 选择当前活跃套餐（存在多个时取 endAt 最新的一条）
 * - 依据套餐 features 中的 creditCap/recoveryRate 计算恢复量
 * - 使用 Wallet.version 乐观锁原子更新余额与 lastRecoveryAt
 * - 仅在实际恢复 (>0) 时写入 CreditTransaction 流水（income/package）
 */
export async function autoRecoverCredits(
  userId: string,
  opts?: { now?: Date }
): Promise<{
  success: boolean;
  recovered: number;
  newBalance: number;
}> {
  try {
    // 1) 读取活跃套餐（若存在多条，选择 endAt 最新）
    const now = opts?.now ?? new Date();
    const activePackage = await prisma.userPackage.findFirst({
      where: {
        userId,
        isActive: true,
        endAt: { gte: now },
      },
      orderBy: { endAt: 'desc' },
      include: { package: true },
    });

    if (!activePackage) {
      return { success: false, recovered: 0, newBalance: 0 };
}

// manualResetCredits moved below; keep autoRecoverCredits contiguous

    // 2) 解析套餐配置（features 优先级：snapshot -> package -> 兜底）
    const snapshot: any = (activePackage as any).packageSnapshot || {};
    const snapshotFeatures: any = snapshot.features || {};
    const pkgFeatures: any = (activePackage as any).package?.features || {};

    const creditCap: number =
      Number(snapshotFeatures.creditCap ?? pkgFeatures.creditCap ?? activePackage.dailyPoints);
    const recoveryRate: number = Number(snapshotFeatures.recoveryRate ?? pkgFeatures.recoveryRate ?? 0);
    const dailyUsageLimit: number = Number(
      snapshotFeatures.dailyUsageLimit ?? pkgFeatures.dailyUsageLimit ?? 999999
    );
    const manualResetPerDay: number = Number(
      snapshotFeatures.manualResetPerDay ?? pkgFeatures.manualResetPerDay ?? 0
    );

    const config: PackageConfig = {
      creditCap,
      recoveryRate,
      dailyUsageLimit,
      manualResetPerDay,
    };

    // 3) 在单个事务中读取钱包、计算、原子更新并写入流水
    const result = await prisma.$transaction(async (tx) => {
      // 3.1 读取/初始化钱包
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId,
            packageDailyQuotaTokens: BigInt(0),
            packageTokensRemaining: BigInt(0),
            independentTokens: BigInt(0),
            lockedTokens: BigInt(0),
            version: 0,
          },
        });
      }

      // 3.2 计算应恢复的积分
      const lastRecoveryBase: Date =
        wallet.lastRecoveryAt || wallet.updatedAt || wallet.createdAt || now;
      const currentCredits = Number(wallet.packageTokensRemaining ?? BigInt(0));
      const recovered = calculateRecoverableCredits(lastRecoveryBase, currentCredits, config, now);

      if (recovered <= 0) {
        // 无需更新，直接返回当前余额
        return {
          success: true,
          recovered: 0,
          newBalance: currentCredits,
        };
      }

      const before = currentCredits;
      const after = Math.min(before + recovered, config.creditCap);
      const increment = after - before; // 实际增量（考虑上限）

      // 3.3 乐观锁原子更新（WHERE userId AND version = oldVersion）
      const updateRes = await tx.wallet.updateMany({
        where: { userId, version: wallet.version },
        data: {
          packageTokensRemaining: { increment: BigInt(increment) },
          lastRecoveryAt: now,
          version: { increment: 1 },
        },
      });

      if (updateRes.count !== 1) {
        // 乐观锁冲突：不重试，直接失败，让上层决定重试策略
        throw new Error('Optimistic lock conflict');
      }

      // 3.4 创建积分流水（仅记录套餐积分池）
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'income',
          bucket: 'package',
          tokens: increment,
          points: increment,
          beforePackageTokens: BigInt(before),
          afterPackageTokens: BigInt(after),
          beforeIndependentTokens: null,
          afterIndependentTokens: null,
          orderId: null,
          reason: '自动恢复（每小时恢复）',
          meta: {
            source: 'autoRecoverCredits',
            recoveryRate: config.recoveryRate,
            creditCap: config.creditCap,
            before,
            after,
            lastRecoveryBase: lastRecoveryBase.toISOString(),
            hoursPassed: (now.getTime() - lastRecoveryBase.getTime()) / (1000 * 60 * 60),
          },
        },
      });

      return {
        success: true,
        recovered: increment,
        newBalance: after,
      };
    }, { maxWait: 30000, timeout: 30000 });

    return result;
  } catch (error) {
    // 失败时返回失败结果，不泄露内部错误到调用方
    return { success: false, recovered: 0, newBalance: 0 };
  }
}

/**
 * 手动重置订阅套餐积分到上限（UTC 日窗口，每日次数限制）
 */
export async function manualResetCredits(userId: string): Promise<{
  success: boolean;
  resetAmount: number;
  newBalance: number;
  code?: 'NO_ACTIVE_PACKAGE' | 'LIMIT_REACHED' | 'ALREADY_AT_CAP';
}> {
  const now = new Date();

  // 选择活跃套餐（若存在多条，选择 endAt 最新）
  const activePackage = await prisma.userPackage.findFirst({
    where: {
      userId,
      isActive: true,
      endAt: { gte: now },
    },
    orderBy: { endAt: 'desc' },
    include: { package: true },
  });

  if (!activePackage) {
    return { success: false, resetAmount: 0, newBalance: 0, code: 'NO_ACTIVE_PACKAGE' };
  }

  // 解析套餐配置
  const snapshot: any = (activePackage as any).packageSnapshot || {};
  const snapshotFeatures: any = snapshot.features || {};
  const pkgFeatures: any = (activePackage as any).package?.features || {};

  const creditCap: number =
    Number(snapshotFeatures.creditCap ?? pkgFeatures.creditCap ?? activePackage.dailyPoints);
  const manualResetPerDay: number = Number(
    snapshotFeatures.manualResetPerDay ?? pkgFeatures.manualResetPerDay ?? 1
  );

  if (manualResetPerDay <= 0) {
    return { success: false, resetAmount: 0, newBalance: 0, code: 'LIMIT_REACHED' };
  }

  // 单一事务：读取钱包、校验窗口与次数、原子更新余额与计数、写流水
  return await prisma.$transaction(async (tx) => {
    // 读取或初始化钱包
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(0),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });
    }

    // 计算是否同一 UTC 日
    const isSameUtcDay = (a?: Date | null, b?: Date | null) => {
      if (!a || !b) return false;
      const ay = a.getUTCFullYear();
      const am = a.getUTCMonth();
      const ad = a.getUTCDate();
      const by = b.getUTCFullYear();
      const bm = b.getUTCMonth();
      const bd = b.getUTCDate();
      return ay === by && am === bm && ad === bd;
    };

    const resetsToday = isSameUtcDay(wallet.manualResetAt, now) ? wallet.manualResetCount : 0;
    if (resetsToday >= manualResetPerDay) {
      return {
        success: false,
        resetAmount: 0,
        newBalance: Number(wallet.packageTokensRemaining ?? BigInt(0)),
        code: 'LIMIT_REACHED',
      };
    }

    const before = Number(wallet.packageTokensRemaining ?? BigInt(0));
    const increment = Math.max(0, creditCap - before);
    if (increment <= 0) {
      return {
        success: false,
        resetAmount: 0,
        newBalance: before,
        code: 'ALREADY_AT_CAP',
      };
    }

    const after = before + increment; // == creditCap

    // 乐观锁原子更新
    const updateRes = await tx.wallet.updateMany({
      where: { userId, version: wallet.version },
      data: {
        packageTokensRemaining: BigInt(after),
        manualResetCount: isSameUtcDay(wallet.manualResetAt, now)
          ? wallet.manualResetCount + 1
          : 1,
        manualResetAt: now,
        lastRecoveryAt: now,
        version: { increment: 1 },
      },
    });

    if (updateRes.count !== 1) {
      // 冲突即失败
      return { success: false, resetAmount: 0, newBalance: before, code: 'LIMIT_REACHED' };
    }

    // 写入 reset 流水
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'reset',
        bucket: 'package',
        tokens: increment,
        points: increment,
        beforePackageTokens: BigInt(before),
        afterPackageTokens: BigInt(after),
        beforeIndependentTokens: null,
        afterIndependentTokens: null,
        orderId: null,
        reason: '手动重置到上限',
        meta: {
          source: 'manualResetCredits',
          creditCap,
          manualResetPerDay,
          resetsTodayBefore: resetsToday,
          resetsTodayAfter: resetsToday + 1,
          atUtc: now.toISOString(),
        },
      },
    });

    return { success: true, resetAmount: increment, newBalance: after };
  }, { maxWait: 30000, timeout: 30000 });
}
