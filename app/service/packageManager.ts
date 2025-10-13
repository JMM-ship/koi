import {
  getActivePackages,
  getPackageById,
  getRecommendedPackages
} from "@/app/models/package";
import {
  createUserPackage,
  getUserActivePackage,
  renewUserPackage,
  deactivateExpiredPackages,
  getAllActivePackageUsers,
  getExpiringPackages
} from "@/app/models/userPackage";
import { activatePackageCredits, dailyResetCredits, resetPackageCreditsForNewPackage } from "./creditManager";
import { findOrderByOrderNo } from "@/app/models/order";
import { batchCreateResetTransactions } from "@/app/models/creditTransaction";
import { getCreditBalance, batchResetPackageCredits } from "@/app/models/creditBalance";
import { prisma, dbRouter } from "@/app/models/db";

export interface PackagePurchaseResult {
  success: boolean;
  userPackage?: any;
  error?: string;
}

// 购买套餐
export async function purchasePackage(
  userId: string,
  packageId: string,
  orderNo: string
): Promise<PackagePurchaseResult> {
  try {
    // 获取套餐信息
    const packageInfo = await getPackageById(packageId);
    if (!packageInfo) {
      return { success: false, error: 'Package not found' };
    }
    
    if (!packageInfo.isActive) {
      return { success: false, error: 'Package is not active' };
    }
    
    // 计算套餐起止时间
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (packageInfo.validDays || 0));
    
    // 创建套餐快照
    const packageSnapshot = {
      id: packageInfo.id,
      name: packageInfo.name,
      version: packageInfo.version,
      price: packageInfo.priceCents / 100,
      dailyCredits: packageInfo.dailyPoints,
      validDays: packageInfo.validDays,
      planType: packageInfo.planType,
      features: packageInfo.features,
    };
    
    // 创建用户套餐
    // 尝试将 orderNo 映射为真实的订单 UUID（UserPackage.orderId 为 UUID 类型）
    let orderUuid: string | undefined = undefined;
    try {
      const order = await findOrderByOrderNo(orderNo);
      orderUuid = order?.id;
    } catch {}

    const userPackage = await createUserPackage({
      user_id: userId,
      package_id: packageId,
      // 传入真实的订单 UUID；若不可得则传空字符串，底层将写入 null
      order_no: orderUuid || '',
      start_date: startDate,
      end_date: endDate,
      daily_credits: packageInfo.dailyPoints || 0,
      package_snapshot: packageSnapshot,
    });
    
    if (!userPackage) {
      return { success: false, error: 'Failed to create user package' };
    }
    
    // 重置套餐积分到新套餐的日积分值
    const creditResult = await resetPackageCreditsForNewPackage(
      userId,
      packageInfo.dailyPoints || 0,
      orderNo
    );

    if (!creditResult.success) {
      return { success: false, error: 'Failed to reset package credits' };
    }
    
    // 注：用户的 plan_type 信息现在通过 UserPackage 管理
    // User 模型中不再有 plan_type 字段
    
    return {
      success: true,
      userPackage: {
        ...userPackage,
        packageInfo: packageSnapshot,
      },
    };
  } catch (error) {
    console.error('Error purchasing package:', error);
    return { success: false, error: 'Failed to purchase package' };
  }
}

// 续费套餐
export async function renewPackage(
  userId: string,
  packageId: string,
  orderNo: string,
  renewMonths: number = 1 // 续费月数
): Promise<PackagePurchaseResult> {
  try {
    // 获取套餐信息
    const packageInfo = await getPackageById(packageId);
    if (!packageInfo) {
      return { success: false, error: 'Package not found' };
    }

    if (!packageInfo.isActive) {
      return { success: false, error: 'Package is not active' };
    }

    // 创建套餐快照
    const packageSnapshot = {
      id: packageInfo.id,
      name: packageInfo.name,
      version: packageInfo.version,
      price: packageInfo.priceCents / 100,
      dailyCredits: packageInfo.dailyPoints,
      validDays: packageInfo.validDays,
      planType: packageInfo.planType,
      features: packageInfo.features,
    };

    // 计算续费天数: validDays * renewMonths
    const renewDays = (packageInfo.validDays || 0) * renewMonths;

    // 续费套餐
    const userPackage = await renewUserPackage(
      userId,
      packageId,
      orderNo,
      renewDays, // 使用计算后的续费天数
      packageInfo.dailyPoints || 0,
      packageSnapshot
    );

    if (!userPackage) {
      return { success: false, error: 'Failed to renew package' };
    }

    return {
      success: true,
      userPackage: {
        ...userPackage,
        packageInfo: packageSnapshot,
      },
    };
  } catch (error) {
    console.error('Error renewing package:', error);
    return { success: false, error: 'Failed to renew package' };
  }
}

// 获取套餐列表（带用户状态）
export async function getPackagesWithUserStatus(userId?: string) {
  try {
    // 获取所有激活的套餐
    const packages = await getActivePackages();
    
    
    // 如果提供了用户ID，获取用户当前套餐
    let userPackage = null;
    if (userId) {
      userPackage = await getUserActivePackage(userId);
    }

    // 标记用户当前套餐
    const packagesWithStatus = packages.map(pkg => ({
      ...pkg,
      isCurrent: userPackage?.package_id === pkg.id,
      userPackage: userPackage?.package_id === pkg.id ? userPackage : null,
    }));

    return {
      packages: packagesWithStatus,
      currentPackage: userPackage,
    };
  } catch (error) {
    console.error('Error getting packages with user status:', error);
    return {
      packages: [],
      currentPackage: null,
    };
  }
}

// 每日重置任务
export async function dailyResetTask(): Promise<{
  success: boolean;
  resetCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let resetCount = 0;
  
  try {
    // 1. 先处理过期套餐
    const expiredCount = await deactivateExpiredPackages();
    console.log(`Deactivated ${expiredCount} expired packages`);
    
    // 2. 获取所有活跃套餐用户
    const activeUsers = await getAllActivePackageUsers();
    console.log(`Found ${activeUsers.length} active package users`);
    
    if (activeUsers.length === 0) {
      return { success: true, resetCount: 0, errors };
    }
    
    // 3. 准备批量重置数据
    const resetData: Array<{
      userId: string;
      amount: number;
      beforeBalance: number;
      afterBalance: number;
    }> = [];
    
    // 4. 获取每个用户的当前余额
    for (const user of activeUsers) {
      try {
        const balance = await getCreditBalance(user.userId);
        if (balance) {
          resetData.push({
            userId: user.userId,
            amount: user.dailyCredits,
            beforeBalance: balance.package_credits + balance.independent_credits,
            afterBalance: user.dailyCredits + balance.independent_credits,
          });
        }
      } catch (error) {
        errors.push(`Failed to get balance for user ${user.userId}: ${error}`);
      }
    }
    
    // 5. 批量重置积分
    const resetResult = await batchResetPackageCredits(
      activeUsers.map(u => ({
        userId: u.userId,
        dailyCredits: u.dailyCredits,
      }))
    );
    
    resetCount = resetResult;
    
    // 6. 批量创建重置流水
    await batchCreateResetTransactions(resetData);
    
    console.log(`Successfully reset credits for ${resetCount} users`);
    
    return {
      success: true,
      resetCount,
      errors,
    };
  } catch (error) {
    console.error('Error in daily reset task:', error);
    errors.push(`Critical error: ${error}`);
    return {
      success: false,
      resetCount,
      errors,
    };
  }
}

// 检查即将过期的套餐并发送通知
export async function checkExpiringPackages(days: number = 3): Promise<{
  expiringPackages: any[];
  notificationsSent: number;
}> {
  try {
    const expiringPackages = await getExpiringPackages(days);
    
    // TODO: 实现邮件通知逻辑
    // 这里可以集成邮件服务发送提醒
    let notificationsSent = 0;
    
    for (const pkg of expiringPackages) {
      // 发送通知逻辑
      console.log(`Package expiring for user ${pkg.user_id} on ${pkg.end_date}`);
      notificationsSent++;
    }
    
    return {
      expiringPackages,
      notificationsSent,
    };
  } catch (error) {
    console.error('Error checking expiring packages:', error);
    return {
      expiringPackages: [],
      notificationsSent: 0,
    };
  }
}

// 检查并处理已过期的套餐
export async function checkAndExpirePackages(): Promise<number> {
  try {
    // 查找所有已过期但仍然活跃的套餐
    const now = new Date();
    // 使用副本库查询过期套餐列表
    const expiredPackages = await dbRouter.read.userPackage.findMany({
      where: {
        isActive: true,
        endAt: {  // endDate -> endAt
          lt: now
        }
      }
    });

    if (expiredPackages.length === 0) {
      console.log('No expired packages found');
      return 0;
    }

    console.log(`Found ${expiredPackages.length} expired packages to process`);

    // 批量更新为非活跃状态 - 使用主库进行写操作
    const result = await prisma.userPackage.updateMany({
      where: {
        id: {
          in: expiredPackages.map(p => p.id)
        }
      },
      data: {
        isActive: false,
        updatedAt: now
      }
    });

    // 对每个过期的套餐，清空用户的套餐积分 - 使用主库进行写操作
    for (const pkg of expiredPackages) {
      try {
        await prisma.wallet.update({
          where: { userId: pkg.userId },
          data: {
            packageTokensRemaining: BigInt(0),
            packageResetAt: now,
            updatedAt: now
          }
        });

        console.log(`Expired package for user ${pkg.userId}`);
      } catch (error) {
        console.error(`Failed to clear package credits for user ${pkg.userId}:`, error);
      }
    }

    return result.count;
  } catch (error) {
    console.error('Error checking and expiring packages:', error);
    return 0;
  }
}

// 获取套餐推荐
export async function getPackageRecommendations(userId?: string): Promise<any[]> {
  try {
    // 获取推荐套餐
    const recommendedPackages = await getRecommendedPackages();
    
    if (!userId) {
      return recommendedPackages;
    }
    
    // 获取用户当前套餐和使用情况
    const userPackage = await getUserActivePackage(userId);
    const creditBalance = await getCreditBalance(userId);
    
    // 根据用户使用情况调整推荐
    // TODO: 实现更智能的推荐算法
    
    return recommendedPackages;
  } catch (error) {
    console.error('Error getting package recommendations:', error);
    return [];
  }
}

// 计算套餐升级/降级差价
export async function calculatePackageChange(
  userId: string,
  newPackageId: string
): Promise<{
  canChange: boolean;
  currentPackage?: any;
  newPackage?: any;
  proratedAmount?: number;
  remainingDays?: number;
  error?: string;
}> {
  try {
    // 获取当前套餐
    const currentPackage = await getUserActivePackage(userId);
    if (!currentPackage) {
      return { canChange: false, error: 'No active package found' };
    }
    
    // 获取新套餐信息
    const newPackage = await getPackageById(newPackageId);
    if (!newPackage) {
      return { canChange: false, error: 'New package not found' };
    }
    
    // 计算剩余天数
    const now = new Date();
    const endDate = new Date(currentPackage.end_date);
    const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (remainingDays <= 0) {
      return { canChange: false, error: 'Current package has expired' };
    }
    
    // 计算按比例退款/补差价
    const currentDailyPrice = currentPackage.package_snapshot?.price / currentPackage.package_snapshot?.validDays || 0;
    const newDailyPrice = (newPackage.priceCents / 100) / (newPackage.validDays || 1);
    const proratedAmount = Math.round((newDailyPrice - currentDailyPrice) * remainingDays);
    
    return {
      canChange: true,
      currentPackage,
      newPackage,
      proratedAmount,
      remainingDays,
    };
  } catch (error) {
    console.error('Error calculating package change:', error);
    return { canChange: false, error: 'Failed to calculate package change' };
  }
}
