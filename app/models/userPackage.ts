import { prisma } from "@/app/models/db";
import { UserPackage as PrismaUserPackage } from "@prisma/client";

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  order_no: string;
  start_date: string;
  end_date: string;
  daily_credits: number;
  package_snapshot?: any;
  is_active: boolean;
  is_auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaUserPackage(userPkg: PrismaUserPackage | null): UserPackage | undefined {
  if (!userPkg) return undefined;

  // 从 packageSnapshot 中提取额外信息
  const snapshot = (userPkg.packageSnapshot as any) || {};

  return {
    id: userPkg.id,
    user_id: userPkg.userId,
    package_id: userPkg.packageId,
    order_no: userPkg.orderId || '', // orderId 对应 order_no
    start_date: userPkg.startAt.toISOString(), // startAt 对应 start_date
    end_date: userPkg.endAt.toISOString(), // endAt 对应 end_date
    daily_credits: userPkg.dailyPoints, // dailyPoints 对应 daily_credits
    package_snapshot: userPkg.packageSnapshot,
    is_active: userPkg.isActive,
    is_auto_renew: snapshot.isAutoRenew || false, // 从 snapshot 中获取
    created_at: userPkg.createdAt.toISOString(),
    updated_at: userPkg.updatedAt.toISOString(),
  };
}

// 获取用户当前活跃套餐
export async function getUserActivePackage(userId: string): Promise<UserPackage | undefined> {
  try {
    const now = new Date();
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        userId,
        isActive: true,
        endAt: { // endDate -> endAt
          gte: now,
        },
      },
      orderBy: {
        endAt: 'desc', // endDate -> endAt
      },
    });
    
    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error getting user active package:', error);
    return undefined;
  }
}

// 创建用户套餐
export async function createUserPackage(data: {
  user_id: string;
  package_id: string;
  order_no: string;
  start_date: Date;
  end_date: Date;
  daily_credits: number;
  package_snapshot?: any;
  is_auto_renew?: boolean;
}): Promise<UserPackage | undefined> {
  try {
    // 先将当前活跃的套餐设为非活跃
    await prisma.userPackage.updateMany({
      where: {
        userId: data.user_id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
    
    // 创建新套餐
    const userPackage = await prisma.userPackage.create({
      data: {
        userId: data.user_id,
        packageId: data.package_id,
        orderId: data.order_no, // orderNo -> orderId
        startAt: data.start_date, // startDate -> startAt
        endAt: data.end_date, // endDate -> endAt
        dailyPoints: data.daily_credits, // dailyCredits -> dailyPoints
        dailyQuotaTokens: BigInt(data.daily_credits), // 对应SQL中的daily_quota_tokens字段
        packageSnapshot: data.package_snapshot ? {
          ...data.package_snapshot,
          isAutoRenew: data.is_auto_renew || false
        } : { isAutoRenew: data.is_auto_renew || false },
        isActive: true,
      },
    });
    
    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error creating user package:', error);
    throw error;
  }
}

// 更新套餐状态
export async function updateUserPackageStatus(
  id: string,
  isActive: boolean
): Promise<UserPackage | undefined> {
  try {
    const userPackage = await prisma.userPackage.update({
      where: { id },
      data: { isActive },
    });
    
    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error updating user package status:', error);
    return undefined;
  }
}

// 更新自动续费状态
export async function updateAutoRenewStatus(
  id: string,
  isAutoRenew: boolean
): Promise<UserPackage | undefined> {
  try {
    // 先获取当前套餐
    const currentPackage = await prisma.userPackage.findUnique({
      where: { id },
    });

    if (!currentPackage) return undefined;

    const currentSnapshot = (currentPackage.packageSnapshot as any) || {};

    // 更新 packageSnapshot 中的自动续费状态
    const userPackage = await prisma.userPackage.update({
      where: { id },
      data: {
        packageSnapshot: {
          ...currentSnapshot,
          isAutoRenew,
        },
      },
    });

    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error updating auto renew status:', error);
    return undefined;
  }
}

// 获取用户所有套餐历史
export async function getUserPackageHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ packages: UserPackage[]; total: number }> {
  try {
    const skip = (page - 1) * pageSize;
    
    const [packages, total] = await Promise.all([
      prisma.userPackage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.userPackage.count({
        where: { userId },
      }),
    ]);
    
    return {
      packages: packages.map(pkg => fromPrismaUserPackage(pkg)!),
      total,
    };
  } catch (error) {
    console.error('Error getting user package history:', error);
    return { packages: [], total: 0 };
  }
}

// 获取即将过期的套餐
export async function getExpiringPackages(days: number = 3): Promise<UserPackage[]> {
  try {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const packages = await prisma.userPackage.findMany({
      where: {
        isActive: true,
        endAt: { // endDate -> endAt
          gte: now,
          lte: expiryDate,
        },
      },
      orderBy: {
        endAt: 'asc', // endDate -> endAt
      },
    });
    
    return packages.map(pkg => fromPrismaUserPackage(pkg)!);
  } catch (error) {
    console.error('Error getting expiring packages:', error);
    return [];
  }
}

// 获取已过期的套餐
export async function getExpiredPackages(): Promise<UserPackage[]> {
  try {
    const now = new Date();
    
    const packages = await prisma.userPackage.findMany({
      where: {
        isActive: true,
        endAt: { // endDate -> endAt
          lt: now,
        },
      },
    });
    
    return packages.map(pkg => fromPrismaUserPackage(pkg)!);
  } catch (error) {
    console.error('Error getting expired packages:', error);
    return [];
  }
}

// 批量更新过期套餐状态
export async function deactivateExpiredPackages(): Promise<number> {
  try {
    const now = new Date();
    
    const result = await prisma.userPackage.updateMany({
      where: {
        isActive: true,
        endAt: { // endDate -> endAt
          lt: now,
        },
      },
      data: {
        isActive: false,
      },
    });
    
    return result.count;
  } catch (error) {
    console.error('Error deactivating expired packages:', error);
    return 0;
  }
}

// 获取所有活跃套餐用户（用于每日重置）
export async function getAllActivePackageUsers(): Promise<Array<{
  userId: string;
  dailyCredits: number;
}>> {
  try {
    const now = new Date();
    
    const packages = await prisma.userPackage.findMany({
      where: {
        isActive: true,
        endAt: { // endDate -> endAt
          gte: now,
        },
      },
      select: {
        userId: true,
        dailyPoints: true, // dailyCredits -> dailyPoints
      },
    });
    
    return packages.map(pkg => ({
      userId: pkg.userId,
      dailyCredits: pkg.dailyPoints, // dailyCredits -> dailyPoints
    }));
  } catch (error) {
    console.error('Error getting all active package users:', error);
    return [];
  }
}

// 获取所有活跃套餐（包含详细信息）
export async function getAllActivePackages(): Promise<UserPackage[]> {
  try {
    const now = new Date();
    
    const packages = await prisma.userPackage.findMany({
      where: {
        isActive: true,
        endAt: { // endDate -> endAt
          gte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return packages.map(pkg => fromPrismaUserPackage(pkg)!).filter(Boolean);
  } catch (error) {
    console.error('Error getting all active packages:', error);
    return [];
  }
}

// 根据订单号获取用户套餐
export async function getUserPackageByOrderNo(orderNo: string): Promise<UserPackage | undefined> {
  try {
    const userPackage = await prisma.userPackage.findFirst({
      where: { orderId: orderNo }, // orderNo -> orderId
    });
    
    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error getting user package by order no:', error);
    return undefined;
  }
}

// 续费套餐
export async function renewUserPackage(
  userId: string,
  packageId: string,
  orderNo: string,
  validDays: number,
  dailyCredits: number,
  packageSnapshot?: any
): Promise<UserPackage | undefined> {
  try {
    // 获取当前套餐
    const currentPackage = await getUserActivePackage(userId);
    
    let startDate: Date;
    let endDate: Date;
    
    if (currentPackage && new Date(currentPackage.end_date) > new Date()) {
      // 如果当前套餐未过期，从当前套餐结束时间开始
      startDate = new Date(currentPackage.end_date);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + validDays);
    } else {
      // 如果没有套餐或已过期，从现在开始
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + validDays);
    }
    
    return createUserPackage({
      user_id: userId,
      package_id: packageId,
      order_no: orderNo,
      start_date: startDate,
      end_date: endDate,
      daily_credits: dailyCredits,
      package_snapshot: packageSnapshot,
    });
  } catch (error) {
    console.error('Error renewing user package:', error);
    throw error;
  }
}