import { prisma } from "@/app/models/db";
import { Wallet as PrismaWallet } from "@prisma/client";

export interface CreditBalance {
  id: string;
  user_id: string;
  package_credits: number;
  package_reset_at?: string;
  independent_credits: number;
  total_used: number;
  total_purchased: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// 转换函数：将Prisma Wallet转换为应用层CreditBalance格式（兼容旧代码）
function fromPrismaWallet(wallet: PrismaWallet | null): CreditBalance | undefined {
  if (!wallet) return undefined;

  return {
    id: wallet.userId,  // 使用userId作为id
    user_id: wallet.userId,
    package_credits: Number(wallet.packageTokensRemaining),
    package_reset_at: wallet.packageResetAt?.toISOString(),
    independent_credits: Number(wallet.independentTokens),
    total_used: 0,  // 新模型中没有此字段，返回默认值
    total_purchased: 0,  // 新模型中没有此字段，返回默认值
    version: wallet.version,
    created_at: wallet.createdAt.toISOString(),
    updated_at: wallet.updatedAt.toISOString(),
  };
}

// 获取用户积分余额
export async function getCreditBalance(userId: string): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // 如果不存在，创建新的钱包记录
    if (!wallet) {
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(0),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });
      return fromPrismaWallet(newWallet);
    }

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error getting wallet:', error);
    return undefined;
  }
}

// 更新套餐积分
export async function updatePackageCredits(
  userId: string,
  credits: number,
  resetAt?: Date
): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {
        packageTokensRemaining: BigInt(credits),
        packageResetAt: resetAt || new Date(),
      },
      create: {
        userId,
        packageDailyQuotaTokens: BigInt(credits),
        packageTokensRemaining: BigInt(credits),
        packageResetAt: resetAt || new Date(),
        independentTokens: BigInt(0),
        lockedTokens: BigInt(0),
        version: 0,
      },
    });

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error updating package credits:', error);
    return undefined;
  }
}

// 添加独立积分
export async function addIndependentCredits(
  userId: string,
  credits: number,
  orderNo?: string
): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        independentTokens: {
          increment: BigInt(credits),
        },
      },
    });

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error adding independent credits:', error);
    return undefined;
  }
}

// 使用积分（带乐观锁）
export async function useCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance?: CreditBalance; error?: string }> {
  try {
    const wallet = await prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!current) {
        throw new Error('Wallet not found');
      }

      const totalAvailable = Number(current.packageTokensRemaining) + Number(current.independentTokens);
      if (totalAvailable < amount) {
        throw new Error('Insufficient credits');
      }

      // 优先使用套餐积分
      let packageToUse = Math.min(amount, Number(current.packageTokensRemaining));
      let independentToUse = amount - packageToUse;

      const updated = await tx.wallet.update({
        where: {
          userId,
          version: current.version,  // 乐观锁
        },
        data: {
          packageTokensRemaining: {
            decrement: BigInt(packageToUse),
          },
          independentTokens: {
            decrement: BigInt(independentToUse),
          },
          version: {
            increment: 1,
          },
        },
      });

      return updated;
    });

    return {
      success: true,
      balance: fromPrismaWallet(wallet),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 重置套餐积分
export async function resetPackageCredits(
  userId: string,
  dailyCredits: number
): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        packageTokensRemaining: BigInt(dailyCredits),
        packageResetAt: new Date(),
      },
    });

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error resetting package credits:', error);
    return undefined;
  }
}

// 获取积分统计
export async function getCreditStats(userId: string) {
  const balance = await getCreditBalance(userId);
  if (!balance) return null;

  return {
    packageCredits: balance.package_credits,
    independentCredits: balance.independent_credits,
    totalAvailable: balance.package_credits + balance.independent_credits,
    lastResetAt: balance.package_reset_at,
  };
}

// 导出兼容的函数名
export { getCreditBalance as getUserBalance };
export { updatePackageCredits as setPackageCredits };
export { addIndependentCredits as purchaseCredits };
