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
import { activatePackageCredits, dailyResetCredits } from "./creditManager";
import { batchCreateResetTransactions } from "@/app/models/creditTransaction";
import { getCreditBalance, batchResetPackageCredits } from "@/app/models/creditBalance";
import { prisma } from "@/app/models/db";

export interface PackagePurchaseResult {
  success: boolean;
  userPackage?: any;
  error?: string;
}

// 购买套餐
export async function purchasePackage(
  userUuid: string,
  packageId: string,
  orderNo: string
): Promise<PackagePurchaseResult> {
  try {
    // 获取套餐信息
    const packageInfo = await getPackageById(packageId);
    if (!packageInfo) {
      return { success: false, error: 'Package not found' };
    }
    
    if (!packageInfo.is_active) {
      return { success: false, error: 'Package is not active' };
    }
    
    // 计算套餐起止时间
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageInfo.valid_days);
    
    // 创建套餐快照
    const packageSnapshot = {
      id: packageInfo.id,
      name: packageInfo.name,
      version: packageInfo.version,
      price: packageInfo.price,
      dailyCredits: packageInfo.daily_credits,
      validDays: packageInfo.valid_days,
      planType: packageInfo.plan_type,
      features: packageInfo.features,
    };
    
    // 创建用户套餐
    const userPackage = await createUserPackage({
      user_uuid: userUuid,
      package_id: packageId,
      order_no: orderNo,
      start_date: startDate,
      end_date: endDate,
      daily_credits: packageInfo.daily_credits,
      package_snapshot: packageSnapshot,
    });
    
    if (!userPackage) {
      return { success: false, error: 'Failed to create user package' };
    }
    
    // 激活套餐积分
    const creditResult = await activatePackageCredits(
      userUuid,
      packageInfo.daily_credits,
      orderNo
    );
    
    if (!creditResult.success) {
      return { success: false, error: 'Failed to activate package credits' };
    }
    
    // 更新用户的 planType
    try {
      await prisma.user.update({
        where: { uuid: userUuid },
        data: { 
          planType: packageInfo.plan_type || 'basic',
          planExpiredAt: endDate
        }
      });
    } catch (error) {
      console.error('Failed to update user planType:', error);
      // 不影响购买流程，继续执行
    }
    
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
  userUuid: string,
  packageId: string,
  orderNo: string
): Promise<PackagePurchaseResult> {
  try {
    // 获取套餐信息
    const packageInfo = await getPackageById(packageId);
    if (!packageInfo) {
      return { success: false, error: 'Package not found' };
    }
    
    if (!packageInfo.is_active) {
      return { success: false, error: 'Package is not active' };
    }
    
    // 创建套餐快照
    const packageSnapshot = {
      id: packageInfo.id,
      name: packageInfo.name,
      version: packageInfo.version,
      price: packageInfo.price,
      dailyCredits: packageInfo.daily_credits,
      validDays: packageInfo.valid_days,
      planType: packageInfo.plan_type,
      features: packageInfo.features,
    };
    
    // 续费套餐
    const userPackage = await renewUserPackage(
      userUuid,
      packageId,
      orderNo,
      packageInfo.valid_days,
      packageInfo.daily_credits,
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
export async function getPackagesWithUserStatus(userUuid?: string) {
  try {
    // 获取所有激活的套餐
    const packages = await getActivePackages();
    
    // 如果提供了用户ID，获取用户当前套餐
    let userPackage = null;
    if (userUuid) {
      userPackage = await getUserActivePackage(userUuid);
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
      userUuid: string;
      amount: number;
      beforeBalance: number;
      afterBalance: number;
    }> = [];
    
    // 4. 获取每个用户的当前余额
    for (const user of activeUsers) {
      try {
        const balance = await getCreditBalance(user.userUuid);
        if (balance) {
          resetData.push({
            userUuid: user.userUuid,
            amount: user.dailyCredits,
            beforeBalance: balance.package_credits + balance.independent_credits,
            afterBalance: user.dailyCredits + balance.independent_credits,
          });
        }
      } catch (error) {
        errors.push(`Failed to get balance for user ${user.userUuid}: ${error}`);
      }
    }
    
    // 5. 批量重置积分
    const resetResult = await batchResetPackageCredits(
      activeUsers.map(u => ({
        userUuid: u.userUuid,
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
      console.log(`Package expiring for user ${pkg.user_uuid} on ${pkg.end_date}`);
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
    const expiredPackages = await prisma.userPackage.findMany({
      where: {
        isActive: true,
        endDate: {
          lt: now
        }
      }
    });
    
    if (expiredPackages.length === 0) {
      console.log('No expired packages found');
      return 0;
    }
    
    console.log(`Found ${expiredPackages.length} expired packages to process`);
    
    // 批量更新为非活跃状态
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
    
    // 对每个过期的套餐，清空用户的套餐积分
    for (const pkg of expiredPackages) {
      try {
        await prisma.creditBalance.update({
          where: { userUuid: pkg.userUuid },
          data: {
            packageCredits: 0,
            packageResetAt: now,
            updatedAt: now
          }
        });
        
        console.log(`Expired package for user ${pkg.userUuid}`);
      } catch (error) {
        console.error(`Failed to clear package credits for user ${pkg.userUuid}:`, error);
      }
    }
    
    return result.count;
  } catch (error) {
    console.error('Error checking and expiring packages:', error);
    return 0;
  }
}

// 获取套餐推荐
export async function getPackageRecommendations(userUuid?: string): Promise<any[]> {
  try {
    // 获取推荐套餐
    const recommendedPackages = await getRecommendedPackages();
    
    if (!userUuid) {
      return recommendedPackages;
    }
    
    // 获取用户当前套餐和使用情况
    const userPackage = await getUserActivePackage(userUuid);
    const creditBalance = await getCreditBalance(userUuid);
    
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
  userUuid: string,
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
    const currentPackage = await getUserActivePackage(userUuid);
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
    const newDailyPrice = newPackage.price / newPackage.valid_days;
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