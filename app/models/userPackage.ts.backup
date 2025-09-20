import { prisma } from "@/app/models/db";
import { UserPackage as PrismaUserPackage } from "@prisma/client";

export interface UserPackage {
  id: string;
  user_uuid: string;
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
  
  return {
    id: userPkg.id,
    user_uuid: userPkg.userUuid,
    package_id: userPkg.packageId,
    order_no: userPkg.orderNo,
    start_date: userPkg.startDate.toISOString(),
    end_date: userPkg.endDate.toISOString(),
    daily_credits: userPkg.dailyCredits,
    package_snapshot: userPkg.packageSnapshot,
    is_active: userPkg.isActive,
    is_auto_renew: userPkg.isAutoRenew,
    created_at: userPkg.createdAt.toISOString(),
    updated_at: userPkg.updatedAt.toISOString(),
  };
}

// 获取用户当前活跃套餐
export async function getUserActivePackage(userUuid: string): Promise<UserPackage | undefined> {
  try {
    const now = new Date();
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        userUuid,
        isActive: true,
        endDate: {
          gte: now,
        },
      },
      orderBy: {
        endDate: 'desc',
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
  user_uuid: string;
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
        userUuid: data.user_uuid,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
    
    // 创建新套餐
    const userPackage = await prisma.userPackage.create({
      data: {
        userUuid: data.user_uuid,
        packageId: data.package_id,
        orderNo: data.order_no,
        startDate: data.start_date,
        endDate: data.end_date,
        dailyCredits: data.daily_credits,
        packageSnapshot: data.package_snapshot || null,
        isActive: true,
        isAutoRenew: data.is_auto_renew || false,
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
    const userPackage = await prisma.userPackage.update({
      where: { id },
      data: { isAutoRenew },
    });
    
    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error updating auto renew status:', error);
    return undefined;
  }
}

// 获取用户所有套餐历史
export async function getUserPackageHistory(
  userUuid: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ packages: UserPackage[]; total: number }> {
  try {
    const skip = (page - 1) * pageSize;
    
    const [packages, total] = await Promise.all([
      prisma.userPackage.findMany({
        where: { userUuid },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.userPackage.count({
        where: { userUuid },
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
        endDate: {
          gte: now,
          lte: expiryDate,
        },
      },
      orderBy: {
        endDate: 'asc',
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
        endDate: {
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
        endDate: {
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
  userUuid: string;
  dailyCredits: number;
}>> {
  try {
    const now = new Date();
    
    const packages = await prisma.userPackage.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: now,
        },
      },
      select: {
        userUuid: true,
        dailyCredits: true,
      },
    });
    
    return packages.map(pkg => ({
      userUuid: pkg.userUuid,
      dailyCredits: pkg.dailyCredits,
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
        endDate: {
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
      where: { orderNo },
    });
    
    return fromPrismaUserPackage(userPackage);
  } catch (error) {
    console.error('Error getting user package by order no:', error);
    return undefined;
  }
}

// 续费套餐
export async function renewUserPackage(
  userUuid: string,
  packageId: string,
  orderNo: string,
  validDays: number,
  dailyCredits: number,
  packageSnapshot?: any
): Promise<UserPackage | undefined> {
  try {
    // 获取当前套餐
    const currentPackage = await getUserActivePackage(userUuid);
    
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
      user_uuid: userUuid,
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