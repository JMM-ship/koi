import { 
  getCreditBalance, 
  useCredits as useCreditBalance,
  addIndependentCredits,
  updatePackageCredits,
  resetPackageCredits,
  getCreditStats
} from "@/app/models/creditBalance";
import { 
  createCreditTransaction,
  TransactionType,
  CreditType,
  getTodayUsage,
  getMonthlyUsage
} from "@/app/models/creditTransaction";
import { getUserActivePackage } from "@/app/models/userPackage";
import { prisma } from "@/app/models/db";

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
  userUuid: string,
  amount: number,
  service: string,
  metadata?: any
): Promise<CreditUsageResult> {
  try {
    // 获取当前余额
    const currentBalance = await getCreditBalance(userUuid);
    if (!currentBalance) {
      return { success: false, error: 'User balance not found' };
    }
    
    const beforeBalance = currentBalance.package_credits + currentBalance.independent_credits;
    
    // 使用积分（带乐观锁）
    const result = await useCreditBalance(userUuid, amount);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // 确定使用的积分类型
    let creditType: CreditType;
    if (currentBalance.package_credits >= amount) {
      creditType = CreditType.Package;
    } else if (currentBalance.package_credits > 0) {
      creditType = CreditType.Package; // 混合使用，记为套餐
    } else {
      creditType = CreditType.Independent;
    }
    
    // 创建流水记录
    const transaction = await createCreditTransaction({
      user_uuid: userUuid,
      type: TransactionType.Expense,
      credit_type: creditType,
      amount,
      before_balance: beforeBalance,
      after_balance: beforeBalance - amount,
      description: `${service}服务消耗`,
      metadata: {
        service,
        ...metadata,
      },
    });
    
    return {
      success: true,
      balance: {
        packageCredits: result.balance!.package_credits,
        independentCredits: result.balance!.independent_credits,
        totalAvailable: result.balance!.package_credits + result.balance!.independent_credits,
      },
      transaction: transaction ? {
        transNo: transaction.trans_no,
        amount: transaction.amount,
        creditType: transaction.credit_type,
      } : undefined,
    };
  } catch (error) {
    console.error('Error using credits:', error);
    return { success: false, error: 'Failed to use credits' };
  }
}

// 购买独立积分
export async function purchaseCredits(
  userUuid: string,
  amount: number,
  orderNo: string
): Promise<CreditPurchaseResult> {
  try {
    // 使用事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 获取当前余额
      const currentBalance = await getCreditBalance(userUuid);
      const beforeBalance = currentBalance 
        ? currentBalance.package_credits + currentBalance.independent_credits 
        : 0;
      
      // 增加独立积分
      const newBalance = await addIndependentCredits(userUuid, amount);
      if (!newBalance) {
        throw new Error('Failed to add credits');
      }
      
      // 创建流水记录
      const transaction = await createCreditTransaction({
        user_uuid: userUuid,
        type: TransactionType.Income,
        credit_type: CreditType.Independent,
        amount,
        before_balance: beforeBalance,
        after_balance: beforeBalance + amount,
        order_no: orderNo,
        description: '购买独立积分',
        metadata: {
          orderNo,
          purchaseType: 'independent',
        },
      });
      
      return {
        balance: newBalance,
        transaction,
      };
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
  userUuid: string,
  dailyCredits: number,
  orderNo: string
): Promise<CreditPurchaseResult> {
  try {
    // 使用事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 获取当前余额
      const currentBalance = await getCreditBalance(userUuid);
      const beforeBalance = currentBalance 
        ? currentBalance.package_credits + currentBalance.independent_credits 
        : 0;
      
      // 更新套餐积分
      const newBalance = await updatePackageCredits(userUuid, dailyCredits);
      if (!newBalance) {
        throw new Error('Failed to update package credits');
      }
      
      // 创建流水记录
      const transaction = await createCreditTransaction({
        user_uuid: userUuid,
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

// 每日重置套餐积分
export async function dailyResetCredits(userUuid: string): Promise<boolean> {
  try {
    // 获取用户活跃套餐
    const activePackage = await getUserActivePackage(userUuid);
    if (!activePackage) {
      return false;
    }
    
    // 获取当前余额
    const currentBalance = await getCreditBalance(userUuid);
    if (!currentBalance) {
      return false;
    }
    
    const beforeBalance = currentBalance.package_credits + currentBalance.independent_credits;
    
    // 重置套餐积分
    const newBalance = await resetPackageCredits(userUuid, activePackage.daily_credits);
    if (!newBalance) {
      return false;
    }
    
    // 创建重置流水
    await createCreditTransaction({
      user_uuid: userUuid,
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
export async function getUserCreditInfo(userUuid: string): Promise<{
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
    const balance = await getCreditBalance(userUuid);
    if (!balance) {
      return undefined;
    }
    
    // 获取使用统计
    const [todayUsed, monthUsed] = await Promise.all([
      getTodayUsage(userUuid),
      getMonthlyUsage(userUuid),
    ]);
    
    // 获取套餐信息
    const activePackage = await getUserActivePackage(userUuid);
    
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
  userUuid: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; available: number }> {
  try {
    const balance = await getCreditBalance(userUuid);
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
  userUuid: string,
  amount: number,
  orderNo: string,
  refundType: 'package' | 'independent'
): Promise<boolean> {
  try {
    const currentBalance = await getCreditBalance(userUuid);
    if (!currentBalance) {
      return false;
    }
    
    const beforeBalance = currentBalance.package_credits + currentBalance.independent_credits;
    
    // 根据退款类型处理
    if (refundType === 'package') {
      // 套餐退款，清空套餐积分
      await updatePackageCredits(userUuid, 0);
    } else {
      // 独立积分退款，扣减独立积分
      const result = await useCreditBalance(userUuid, amount);
      if (!result.success) {
        return false;
      }
    }
    
    // 创建退款流水
    await createCreditTransaction({
      user_uuid: userUuid,
      type: TransactionType.Expense,
      credit_type: refundType === 'package' ? CreditType.Package : CreditType.Independent,
      amount,
      before_balance: beforeBalance,
      after_balance: beforeBalance - amount,
      order_no: orderNo,
      description: '订单退款扣减积分',
      metadata: {
        orderNo,
        refundType,
        refundAmount: amount,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error refunding credits:', error);
    return false;
  }
}