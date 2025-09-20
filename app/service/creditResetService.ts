import { prisma } from "@/app/models/db";
import { getUserActivePackage, getAllActivePackages } from "@/app/models/userPackage";
import { resetPackageCredits } from "@/app/models/creditBalance";
import { createCreditTransaction, TransactionType, CreditType } from "@/app/models/creditTransaction";

// 重置结果接口
export interface ResetResult {
  userId: string;
  success: boolean;
  dailyCredits?: number;
  error?: string;
}

export interface ResetSummary {
  totalUsers: number;
  successCount: number;
  failedCount: number;
  results: ResetResult[];
  executedAt: string;
}

// 重置单个用户的套餐积分
export async function resetUserPackageCredits(userId: string): Promise<ResetResult> {
  try {
    // 获取用户当前活跃的套餐
    const activePackage = await getUserActivePackage(userId);
    
    if (!activePackage) {
      return {
        userId,
        success: false,
        error: 'No active package found'
      };
    }
    
    // 检查套餐是否已过期
    const now = new Date();
    const endDate = new Date(activePackage.end_date);
    
    if (now > endDate) {
      return {
        userId,
        success: false,
        error: 'Package has expired'
      };
    }
    
    // 获取当前余额（用于记录流水）
    const currentBalance = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    const beforeBalance = currentBalance 
      ? currentBalance.packageTokensRemaining + currentBalance.independentTokens 
      : 0;
    
    // 重置套餐积分
    const newBalance = await resetPackageCredits(userId, activePackage.daily_credits);
    
    if (!newBalance) {
      return {
        userId,
        success: false,
        error: 'Failed to reset credits'
      };
    }
    
    // 创建重置流水记录
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
        packageName: activePackage.package_snapshot?.name || 'Unknown',
        dailyCredits: activePackage.daily_credits,
        resetType: 'daily',
        resetTime: new Date().toISOString()
      }
    });
    
    return {
      userId,
      success: true,
      dailyCredits: activePackage.daily_credits
    };
  } catch (error) {
    console.error(`Error resetting credits for user ${userId}:`, error);
    return {
      userId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 批量重置所有用户的套餐积分
export async function resetAllPackageCredits(): Promise<ResetSummary> {
  const startTime = new Date();
  const results: ResetResult[] = [];
  
  try {
    // 获取所有有活跃套餐的用户
    const activePackages = await getAllActivePackages();
    
    if (!activePackages || activePackages.length === 0) {
      return {
        totalUsers: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        executedAt: startTime.toISOString()
      };
    }
    
    // 批量处理每个用户
    for (const userPackage of activePackages) {
      const result = await resetUserPackageCredits(userPackage.user_id);
      results.push(result);
    }
    
    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    // 记录重置日志
    await logResetOperation({
      executedAt: startTime,
      totalUsers: results.length,
      successCount,
      failedCount,
      details: results
    });
    
    return {
      totalUsers: results.length,
      successCount,
      failedCount,
      results,
      executedAt: startTime.toISOString()
    };
  } catch (error) {
    console.error('Error in batch credit reset:', error);
    throw error;
  }
}

// 检查用户是否需要重置积分
export async function shouldResetCredits(userId: string): Promise<boolean> {
  try {
    const balance = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    if (!balance || !balance.packageResetAt) {
      return true; // 如果没有重置记录，需要重置
    }
    
    // 检查上次重置时间
    const lastReset = new Date(balance.packageResetAt);
    const now = new Date();
    
    // 获取今天的0点时间
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // 如果上次重置时间早于今天0点，则需要重置
    return lastReset < todayStart;
  } catch (error) {
    console.error('Error checking reset status:', error);
    return false;
  }
}

// 记录重置操作日志
async function logResetOperation(operation: {
  executedAt: Date;
  totalUsers: number;
  successCount: number;
  failedCount: number;
  details: ResetResult[];
}) {
  try {
    // 可以将日志保存到数据库或文件系统
    console.log('Credit Reset Operation:', {
      executedAt: operation.executedAt.toISOString(),
      totalUsers: operation.totalUsers,
      successCount: operation.successCount,
      failedCount: operation.failedCount,
      summary: `Successfully reset credits for ${operation.successCount}/${operation.totalUsers} users`
    });
    
    // 记录失败的用户
    const failures = operation.details.filter(d => !d.success);
    if (failures.length > 0) {
      console.error('Failed to reset credits for users:', failures);
    }
  } catch (error) {
    console.error('Error logging reset operation:', error);
  }
}

// 获取上次重置时间
export async function getLastResetTime(userId: string): Promise<Date | null> {
  try {
    const balance = await prisma.wallet.findUnique({
      where: { userId },
      select: { packageResetAt: true }
    });
    
    return balance?.packageResetAt || null;
  } catch (error) {
    console.error('Error getting last reset time:', error);
    return null;
  }
}

// 获取今日已重置的用户数
export async function getTodayResetCount(): Promise<number> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const count = await prisma.wallet.count({
      where: {
        packageResetAt: {
          gte: todayStart
        }
      }
    });
    
    return count;
  } catch (error) {
    console.error('Error getting today reset count:', error);
    return 0;
  }
}