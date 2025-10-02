import {
  getCreditBalance,
  addIndependentCredits,
  updatePackageCredits,
  resetPackageCredits,
  getCreditStats,
} from "@/app/models/creditBalance";
import { 
  createCreditTransaction,
  TransactionType,
  CreditType,
  getTodayUsage,
  getMonthlyUsage
} from "@/app/models/creditTransaction";
import { prisma } from "@/app/models/db";
import { getUserActivePackage } from "@/app/models/userPackage";
import { autoRecoverCredits } from "@/app/service/creditRecoveryService";

export interface CreditUsageResult {
  success: boolean;
  balance?: {
    packageCredits: number;
    independentCredits: number;
    totalAvailable: number;
  };
  transaction?: {
    transNo: string;
    amount: number;
    creditType: string;
  };
  error?: string;
}

export interface CreditPurchaseResult {
  success: boolean;
  balance?: {
    packageCredits: number;
    independentCredits: number;
    totalAvailable: number;
  };
  transaction?: any;
  error?: string;
}

// 使用积分
export async function useCredits(
  userId: string,
  amount: number,
  service: string,
  metadata?: any,
  options?: { requestId?: string }
): Promise<CreditUsageResult & { remainingToday?: number }> {
  try {
    if (!userId || !amount || amount <= 0) {
      return { success: false, error: 'Invalid parameters' };
    }

    // 幂等：若传入 requestId 且已存在相同请求的消费流水，直接返回当前余额（不重复扣减）
    if (options?.requestId) {
      const existing = await prisma.creditTransaction.findFirst({
        where: { userId, type: TransactionType.Expense, requestId: options.requestId },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        return {
          success: true,
          balance: wallet
            ? {
                packageCredits: Number(wallet.packageTokensRemaining ?? BigInt(0)),
                independentCredits: Number(wallet.independentTokens ?? BigInt(0)),
                totalAvailable:
                  Number(wallet.packageTokensRemaining ?? BigInt(0)) + Number(wallet.independentTokens ?? BigInt(0)),
              }
            : { packageCredits: 0, independentCredits: 0, totalAvailable: 0 },
          transaction: { transNo: existing.id, amount: existing.points, creditType: existing.bucket },
        };
      }
    }

    // 用前自动恢复（失败不阻塞）
    try {
      await autoRecoverCredits(userId);
    } catch {}

    const now = new Date();

    // 读取活跃套餐并解析 features（仅用于每日限额）
    const activePackage = await prisma.userPackage.findFirst({
      where: { userId, isActive: true, endAt: { gte: now } },
      orderBy: { endAt: 'desc' },
      include: { package: true },
    });

    const snapshot: any = (activePackage as any)?.packageSnapshot || {};
    const snapshotFeatures: any = snapshot.features || {};
    const pkgFeatures: any = (activePackage as any)?.package?.features || {};

    const dailyUsageLimit: number = Number(
      snapshotFeatures.dailyUsageLimit ?? pkgFeatures.dailyUsageLimit ?? 999999
    );

    // 乐观锁 + 事务
    const exec = async (): Promise<CreditUsageResult & { remainingToday?: number }> => {
      return prisma.$transaction(async (tx) => {
        // 读取或创建钱包（使用 upsert 避免读扩散与并发竞态；若用户不存在将因外键报错）
        let wallet = await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            packageDailyQuotaTokens: BigInt(0),
            packageTokensRemaining: BigInt(0),
            independentTokens: BigInt(0),
            lockedTokens: BigInt(0),
            version: 0,
          },
        });

        // UTC 日判断
        const isSameUtcDay = (a?: Date | null, b?: Date | null) => {
          if (!a || !b) return false;
          return (
            a.getUTCFullYear() === b.getUTCFullYear() &&
            a.getUTCMonth() === b.getUTCMonth() &&
            a.getUTCDate() === b.getUTCDate()
          );
        };

        const hasActive = !!activePackage;
        const currentDailyUsage = isSameUtcDay(wallet.dailyUsageResetAt, now)
          ? Number(wallet.dailyUsageCount ?? BigInt(0))
          : 0;
        const allowedPackageRemaining = hasActive
          ? Math.max(0, dailyUsageLimit - currentDailyUsage)
          : Number.POSITIVE_INFINITY;

        const packageAvail = Number(wallet.packageTokensRemaining ?? BigInt(0));
        const independentAvail = Number(wallet.independentTokens ?? BigInt(0));

        const packageUse = Math.min(amount, packageAvail, allowedPackageRemaining);
        const independentNeed = amount - packageUse;

        // 优先返回每日限额受限
        if (
          independentAvail < independentNeed &&
          packageUse < Math.min(amount, packageAvail)
        ) {
          return {
            success: false,
            error: 'DAILY_LIMIT_REACHED',
            remainingToday: Math.max(0, allowedPackageRemaining),
          } as any;
        }

        // 余额不足
        if (packageAvail + independentAvail < amount) {
          return { success: false, error: 'Insufficient credits' };
        }

        // 计算前后余额
        const beforePackage = packageAvail;
        const beforeIndependent = independentAvail;
        const afterPackage = beforePackage - packageUse;
        const afterIndependent = beforeIndependent - independentNeed;

        // 计算新的 dailyUsage
        const nextDailyUsageBase = hasActive
          ? (isSameUtcDay(wallet.dailyUsageResetAt, now) ? currentDailyUsage : 0)
          : currentDailyUsage; // 无活跃套餐保持原值
        const nextDailyUsage = hasActive ? nextDailyUsageBase + packageUse : nextDailyUsageBase;

        // 组装更新数据（使用乐观锁）
        const data: any = {
          packageTokensRemaining: { decrement: BigInt(packageUse) },
          independentTokens: { decrement: BigInt(independentNeed) },
          version: { increment: 1 },
        };
        if (hasActive) {
          data.dailyUsageCount = BigInt(nextDailyUsage);
          if (!isSameUtcDay(wallet.dailyUsageResetAt, now)) {
            data.dailyUsageResetAt = now;
          }
        }

        const updated = await tx.wallet.updateMany({
          where: { userId, version: wallet.version },
          data,
        });
        if (updated.count !== 1) {
          throw new Error('Optimistic lock conflict');
        }

        // 创建流水（单条，精确四字段）
        const bucket = packageUse > 0 && independentNeed === 0
          ? CreditType.Package
          : packageUse === 0 && independentNeed > 0
          ? CreditType.Independent
          : CreditType.Package; // 混合按 package 记

        const created = await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.Expense,
            bucket,
            tokens: amount,
            points: amount,
            beforePackageTokens: BigInt(beforePackage),
            afterPackageTokens: BigInt(afterPackage),
            beforeIndependentTokens: BigInt(beforeIndependent),
            afterIndependentTokens: BigInt(afterIndependent),
            orderId: null,
            requestId: options?.requestId || (metadata?.requestId ?? null),
            reason: `${service}服务消耗`,
            meta: {
              service,
              ...metadata,
              packageUsed: packageUse,
              independentUsed: independentNeed,
              dailyUsageBefore: currentDailyUsage,
              dailyUsageAfter: nextDailyUsage,
            },
          },
        });

        return {
          success: true,
          balance: {
            packageCredits: afterPackage,
            independentCredits: afterIndependent,
            totalAvailable: afterPackage + afterIndependent,
          },
          transaction: {
            transNo: created.id,
            amount,
            creditType: bucket,
          },
        };
      }, { maxWait: 30000, timeout: 30000 });
    };

    // 短重试（最多 2 次）
    for (let i = 0; i < 3; i++) {
      try {
        return await exec();
      } catch (e: any) {
        if (String(e?.message || '').includes('Optimistic lock conflict') && i < 2) {
          await new Promise((r) => setTimeout(r, 50 * (i + 1)));
          continue;
        }
        throw e;
      }
    }

    // 理论不会到达
    return { success: false, error: 'Failed to use credits' };
  } catch (error) {
    console.error('Error using credits:', error);
    return { success: false, error: 'Failed to use credits' };
  }
}

// 购买独立积分
export async function purchaseCredits(
  userId: string,
  amount: number,
  orderNo: string
): Promise<CreditPurchaseResult> {
  try {
    // 使用单事务，避免事务内再次调用全局 prisma 造成连接争用
    const result = await prisma.$transaction(async (tx) => {
      // 读取或创建钱包
      let wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(0),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });

      const beforePackage = Number(wallet.packageTokensRemaining ?? BigInt(0));
      const beforeIndependent = Number(wallet.independentTokens ?? BigInt(0));
      const beforeBalance = beforePackage + beforeIndependent;

      // 增加独立积分（乐观锁）
      const updated = await tx.wallet.updateMany({
        where: { userId, version: wallet.version },
        data: {
          independentTokens: { increment: BigInt(amount) },
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new Error('Optimistic lock conflict');
      }

      const afterIndependent = beforeIndependent + amount;
      const afterPackage = beforePackage;

      // 创建流水记录（在同一事务内）
      const trans = await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.Income,
          bucket: CreditType.Independent,
          tokens: amount,
          points: amount,
          beforePackageTokens: BigInt(beforePackage),
          afterPackageTokens: BigInt(afterPackage),
          beforeIndependentTokens: BigInt(beforeIndependent),
          afterIndependentTokens: BigInt(afterIndependent),
          orderId: null, // 非 UUID 的 orderNo 不写入
          reason: '购买独立积分',
          meta: { orderNo, purchaseType: 'independent' },
        },
      });

      return {
        balance: {
          package_credits: afterPackage,
          independent_credits: afterIndependent,
          totalAvailable: afterPackage + afterIndependent,
        } as any,
        transaction: trans,
      };
    }, {
      maxWait: 60000,
      timeout: 60000,
    });
    
    return {
      success: true,
      balance: {
        packageCredits: result.balance.package_credits,
        independentCredits: result.balance.independent_credits,
        totalAvailable: result.balance.package_credits + result.balance.independent_credits,
      },
      transaction: result.transaction,
    };
  } catch (error) {
    console.error('Error purchasing credits:', error);
    return { success: false, error: 'Failed to purchase credits' };
  }
}

// 激活套餐积分
export async function activatePackageCredits(
  userId: string,
  dailyCredits: number,
  orderNo: string
): Promise<CreditPurchaseResult> {
  try {
    // 使用事务处理，增加超时时间到30秒
    const result = await prisma.$transaction(async (tx) => {
      // 获取当前余额
      const currentBalance = await getCreditBalance(userId);
      const beforeBalance = currentBalance
        ? currentBalance.package_credits + currentBalance.independent_credits
        : 0;

      // 更新套餐积分
      const newBalance = await updatePackageCredits(userId, dailyCredits);
      if (!newBalance) {
        throw new Error('Failed to update package credits');
      }

      // 创建流水记录
      const transaction = await createCreditTransaction({
        user_id: userId,
        type: TransactionType.Income,
        credit_type: CreditType.Package,
        amount: dailyCredits,
        before_balance: beforeBalance,
        after_balance: newBalance.package_credits + newBalance.independent_credits,
        order_no: orderNo,
        description: '激活套餐积分',
        metadata: {
          orderNo,
          purchaseType: 'package',
          dailyCredits,
        },
      });

      return {
        balance: newBalance,
        transaction,
      };
    }, {
      maxWait: 60000, // 提高等待时间，避免远端DB波动导致超时
      timeout: 60000, // 提高事务超时时间
    });

    return {
      success: true,
      balance: {
        packageCredits: result.balance.package_credits,
        independentCredits: result.balance.independent_credits,
        totalAvailable: result.balance.package_credits + result.balance.independent_credits,
      },
      transaction: result.transaction,
    };
  } catch (error) {
    console.error('Error activating package credits:', error);
    return { success: false, error: 'Failed to activate package credits' };
  }
}

// 购买新套餐时重置积分
export async function resetPackageCreditsForNewPackage(
  userId: string,
  dailyCredits: number,
  orderNo: string
): Promise<CreditPurchaseResult> {
  try {
    // 顺序执行，避免交互式事务在远端连接池超时
    const currentBalance = await getCreditBalance(userId);
    const beforeBalance = currentBalance
      ? currentBalance.package_credits + currentBalance.independent_credits
      : 0;

    const newBalance = await resetPackageCredits(userId, dailyCredits);
    if (!newBalance) {
      throw new Error('Failed to reset package credits');
    }

    const transaction = await createCreditTransaction({
      user_id: userId,
      type: TransactionType.Reset,
      credit_type: CreditType.Package,
      amount: dailyCredits,
      before_balance: beforeBalance,
      after_balance: newBalance.package_credits + newBalance.independent_credits,
      order_no: orderNo,
      description: '购买套餐重置积分',
      metadata: {
        orderNo,
        purchaseType: 'package',
        dailyCredits,
        resetType: 'new_package',
      },
    });

    return {
      success: true,
      balance: {
        packageCredits: newBalance.package_credits,
        independentCredits: newBalance.independent_credits,
        totalAvailable: newBalance.package_credits + newBalance.independent_credits,
      },
      transaction,
    };
  } catch (error) {
    console.error('Error resetting package credits for new package:', error);
    return { success: false, error: 'Failed to reset package credits for new package' };
  }
}

// 每日重置套餐积分
export async function dailyResetCredits(userId: string): Promise<boolean> {
  try {
    // 获取用户活跃套餐
    const activePackage = await getUserActivePackage(userId);
    if (!activePackage) {
      return false;
    }
    
    // 获取当前余额
    const currentBalance = await getCreditBalance(userId);
    if (!currentBalance) {
      return false;
    }
    
    const beforeBalance = currentBalance.package_credits + currentBalance.independent_credits;
    
    // 重置套餐积分
    const newBalance = await resetPackageCredits(userId, activePackage.daily_credits);
    if (!newBalance) {
      return false;
    }
    
    // 创建重置流水
    await createCreditTransaction({
      user_id: userId,
      type: TransactionType.Reset,
      credit_type: CreditType.Package,
      amount: activePackage.daily_credits,
      before_balance: beforeBalance,
      after_balance: newBalance.package_credits + newBalance.independent_credits,
      description: '每日积分重置',
      metadata: {
        packageId: activePackage.package_id,
        dailyCredits: activePackage.daily_credits,
        resetType: 'daily',
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error resetting daily credits:', error);
    return false;
  }
}

// 获取用户积分信息
export async function getUserCreditInfo(userId: string): Promise<{
  balance: {
    packageCredits: number;
    independentCredits: number;
    totalAvailable: number;
    packageResetAt?: string;
  };
  usage: {
    todayUsed: number;
    monthUsed: number;
    totalUsed: number;
  };
  package?: {
    dailyLimit: number;
    remainingDays: number;
    endDate: string;
  };
} | undefined> {
  try {
    // 获取余额信息
    const balance = await getCreditBalance(userId);
    if (!balance) {
      return undefined;
    }
    
    // 获取使用统计
    const [todayUsed, monthUsed] = await Promise.all([
      getTodayUsage(userId),
      getMonthlyUsage(userId),
    ]);
    
    // 获取套餐信息
    const activePackage = await getUserActivePackage(userId);
    
    const result: any = {
      balance: {
        packageCredits: balance.package_credits,
        independentCredits: balance.independent_credits,
        totalAvailable: balance.package_credits + balance.independent_credits,
        packageResetAt: balance.package_reset_at,
      },
      usage: {
        todayUsed,
        monthUsed,
        totalUsed: balance.total_used,
      },
    };
    
    if (activePackage) {
      const endDate = new Date(activePackage.end_date);
      const now = new Date();
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      result.package = {
        dailyLimit: activePackage.daily_credits,
        remainingDays: Math.max(0, remainingDays),
        endDate: activePackage.end_date,
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error getting user credit info:', error);
    return undefined;
  }
}

// 检查积分是否充足
export async function checkCreditSufficient(
  userId: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; available: number }> {
  try {
    const balance = await getCreditBalance(userId);
    if (!balance) {
      return { sufficient: false, available: 0 };
    }
    
    const available = balance.package_credits + balance.independent_credits;
    return {
      sufficient: available >= requiredAmount,
      available,
    };
  } catch (error) {
    console.error('Error checking credit sufficient:', error);
    return { sufficient: false, available: 0 };
  }
}

// 退款处理 - 扣减积分
export async function refundCredits(
  userId: string,
  amount: number,
  orderNo: string,
  refundType: 'package' | 'independent'
): Promise<boolean> {
  try {
    if (!userId || !amount || amount <= 0) return false;

    // 使用事务 + 乐观锁，保证扣减一致性
    const ok = await prisma.$transaction(async (tx) => {
      // 读取或创建钱包
      let wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(0),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });

      const beforePackage = Number(wallet.packageTokensRemaining ?? BigInt(0));
      const beforeIndependent = Number(wallet.independentTokens ?? BigInt(0));

      if (refundType === 'package') {
        // 清空套餐池
        const updated = await tx.wallet.updateMany({
          where: { userId, version: wallet.version },
          data: {
            packageTokensRemaining: BigInt(0),
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new Error('Optimistic lock conflict');

        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.Expense,
            bucket: CreditType.Package,
            tokens: amount,
            points: amount,
            beforePackageTokens: BigInt(beforePackage),
            afterPackageTokens: BigInt(0),
            beforeIndependentTokens: BigInt(beforeIndependent),
            afterIndependentTokens: BigInt(beforeIndependent),
            orderId: null,
            reason: '订单退款扣减积分（套餐）',
            meta: { orderNo, refundType, refundAmount: amount },
          },
        });
        return true;
      } else {
        // 独立池必须足够
        if (beforeIndependent < amount) return false;
        const updated = await tx.wallet.updateMany({
          where: { userId, version: wallet.version },
          data: {
            independentTokens: { decrement: BigInt(amount) },
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new Error('Optimistic lock conflict');

        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.Expense,
            bucket: CreditType.Independent,
            tokens: amount,
            points: amount,
            beforePackageTokens: BigInt(beforePackage),
            afterPackageTokens: BigInt(beforePackage),
            beforeIndependentTokens: BigInt(beforeIndependent),
            afterIndependentTokens: BigInt(beforeIndependent - amount),
            orderId: null,
            reason: '订单退款扣减积分（独立）',
            meta: { orderNo, refundType, refundAmount: amount },
          },
        });
        return true;
      }
    }, { maxWait: 60000, timeout: 60000 });

    return ok;
  } catch (error) {
    console.error('Error refunding credits:', error);
    return false;
  }
}
