import { prisma } from "@/app/models/db";
import { CreditBalance as PrismaCreditBalance } from "@prisma/client";

export interface CreditBalance {
  id: string;
  user_uuid: string;
  package_credits: number;
  package_reset_at?: string;
  independent_credits: number;
  total_used: number;
  total_purchased: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaCreditBalance(balance: PrismaCreditBalance | null): CreditBalance | undefined {
  if (!balance) return undefined;
  
  return {
    id: balance.id,
    user_uuid: balance.userUuid,
    package_credits: balance.packageCredits,
    package_reset_at: balance.packageResetAt?.toISOString(),
    independent_credits: balance.independentCredits,
    total_used: balance.totalUsed,
    total_purchased: balance.totalPurchased,
    version: balance.version,
    created_at: balance.createdAt.toISOString(),
    updated_at: balance.updatedAt.toISOString(),
  };
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaCreditBalance(balance: Partial<CreditBalance>): any {
  return {
    userUuid: balance.user_uuid,
    packageCredits: balance.package_credits || 0,
    packageResetAt: balance.package_reset_at ? new Date(balance.package_reset_at) : null,
    independentCredits: balance.independent_credits || 0,
    totalUsed: balance.total_used || 0,
    totalPurchased: balance.total_purchased || 0,
    version: balance.version || 0,
  };
}

// 获取用户积分余额
export async function getCreditBalance(userUuid: string): Promise<CreditBalance | undefined> {
  try {
    const balance = await prisma.creditBalance.findUnique({
      where: { userUuid },
    });
    
    // 如果不存在，创建新的余额记录
    if (!balance) {
      const newBalance = await prisma.creditBalance.create({
        data: {
          userUuid,
          packageCredits: 0,
          independentCredits: 0,
          totalUsed: 0,
          totalPurchased: 0,
          version: 0,
        },
      });
      return fromPrismaCreditBalance(newBalance);
    }
    
    return fromPrismaCreditBalance(balance);
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return undefined;
  }
}

// 更新套餐积分
export async function updatePackageCredits(
  userUuid: string, 
  credits: number,
  resetAt?: Date
): Promise<CreditBalance | undefined> {
  try {
    // 使用upsert确保记录存在
    const balance = await prisma.creditBalance.upsert({
      where: { userUuid },
      update: {
        packageCredits: credits,
        packageResetAt: resetAt || new Date(),
      },
      create: {
        userUuid,
        packageCredits: credits,
        packageResetAt: resetAt || new Date(),
        independentCredits: 0,
        totalUsed: 0,
        totalPurchased: 0,
        version: 0,
      },
    });
    return fromPrismaCreditBalance(balance);
  } catch (error) {
    console.error('Error updating package credits:', error);
    throw error;
  }
}

// 增加独立积分
export async function addIndependentCredits(
  userUuid: string, 
  amount: number
): Promise<CreditBalance | undefined> {
  try {
    const balance = await prisma.creditBalance.upsert({
      where: { userUuid },
      update: {
        independentCredits: {
          increment: amount,
        },
        totalPurchased: {
          increment: amount,
        },
      },
      create: {
        userUuid,
        packageCredits: 0,
        independentCredits: amount,
        totalUsed: 0,
        totalPurchased: amount,
        version: 0,
      },
    });
    return fromPrismaCreditBalance(balance);
  } catch (error) {
    console.error('Error adding independent credits:', error);
    throw error;
  }
}

// 使用积分（带乐观锁）
export async function useCredits(
  userUuid: string,
  amount: number
): Promise<{ success: boolean; balance?: CreditBalance; error?: string }> {
  try {
    // 获取当前余额
    const currentBalance = await prisma.creditBalance.findUnique({
      where: { userUuid },
    });
    
    if (!currentBalance) {
      return { success: false, error: 'Balance not found' };
    }
    
    // 计算可用积分
    const totalAvailable = currentBalance.packageCredits + currentBalance.independentCredits;
    if (totalAvailable < amount) {
      return { success: false, error: 'Insufficient credits' };
    }
    
    // 计算扣减逻辑
    let packageDeduction = 0;
    let independentDeduction = 0;
    
    if (currentBalance.packageCredits >= amount) {
      // 套餐积分足够
      packageDeduction = amount;
    } else {
      // 需要使用独立积分
      packageDeduction = currentBalance.packageCredits;
      independentDeduction = amount - packageDeduction;
    }
    
    // 使用乐观锁更新
    const updatedBalance = await prisma.creditBalance.update({
      where: { 
        userUuid,
        version: currentBalance.version, // 乐观锁检查
      },
      data: {
        packageCredits: {
          decrement: packageDeduction,
        },
        independentCredits: {
          decrement: independentDeduction,
        },
        totalUsed: {
          increment: amount,
        },
        version: {
          increment: 1,
        },
      },
    });
    
    return { 
      success: true, 
      balance: fromPrismaCreditBalance(updatedBalance) 
    };
  } catch (error: any) {
    if (error.code === 'P2025') {
      // 乐观锁冲突，版本号不匹配
      return { success: false, error: 'Concurrent update detected, please retry' };
    }
    console.error('Error using credits:', error);
    return { success: false, error: 'Failed to use credits' };
  }
}

// 重置套餐积分
export async function resetPackageCredits(
  userUuid: string,
  dailyCredits: number
): Promise<CreditBalance | undefined> {
  try {
    const balance = await prisma.creditBalance.update({
      where: { userUuid },
      data: {
        packageCredits: dailyCredits,
        packageResetAt: new Date(),
      },
    });
    return fromPrismaCreditBalance(balance);
  } catch (error) {
    console.error('Error resetting package credits:', error);
    return undefined;
  }
}

// 获取用户积分统计
export async function getCreditStats(userUuid: string): Promise<{
  totalAvailable: number;
  packageCredits: number;
  independentCredits: number;
  totalUsed: number;
  totalPurchased: number;
  todayUsed?: number;
} | undefined> {
  try {
    const balance = await getCreditBalance(userUuid);
    if (!balance) return undefined;
    
    // 获取今日使用量（需要从流水表查询，这里先返回0）
    const todayUsed = 0; // TODO: 实现从CreditTransaction表查询
    
    return {
      totalAvailable: balance.package_credits + balance.independent_credits,
      packageCredits: balance.package_credits,
      independentCredits: balance.independent_credits,
      totalUsed: balance.total_used,
      totalPurchased: balance.total_purchased,
      todayUsed,
    };
  } catch (error) {
    console.error('Error getting credit stats:', error);
    return undefined;
  }
}

// 批量重置所有用户的套餐积分
export async function batchResetPackageCredits(
  userPackages: Array<{ userUuid: string; dailyCredits: number }>
): Promise<number> {
  try {
    let successCount = 0;
    
    // 使用事务批量更新
    await prisma.$transaction(async (tx) => {
      for (const pkg of userPackages) {
        await tx.creditBalance.update({
          where: { userUuid: pkg.userUuid },
          data: {
            packageCredits: pkg.dailyCredits,
            packageResetAt: new Date(),
          },
        });
        successCount++;
      }
    });
    
    return successCount;
  } catch (error) {
    console.error('Error batch resetting package credits:', error);
    return 0;
  }
}