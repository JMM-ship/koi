import { prisma } from "@/app/models/db";
import { Package as PrismaPackage } from "@prisma/client";

export interface PackageFeatures {
  maxRequests?: number;
  maxFileSize?: string;
  supportPriority?: string;
  [key: string]: any;
}

export interface PackageLimitations {
  maxRequests?: number;
  maxFileSize?: string;
  [key: string]: any;
}

export interface Package {
  id: string;
  name: string;
  version: string;
  description?: string;
  priceCents: number;
  currency: string;
  dailyPoints: number;
  validDays?: number;
  planType: string; // basic, pro, enterprise
  features?: PackageFeatures;
  limitations?: PackageLimitations;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 转换函数：将Prisma数据转换为应用层格式（与Prisma保持同名字段）
function fromPrismaPackage(pkg: PrismaPackage | null): Package | undefined {
  if (!pkg) return undefined;
  
  return {
    id: pkg.id,
    name: pkg.name,
    version: pkg.version,
    description: pkg.description || undefined,
    priceCents: pkg.priceCents,
    currency: pkg.currency,
    dailyPoints: pkg.dailyPoints,
    validDays: pkg.validDays || undefined,
    planType: pkg.planType,
    features: (pkg.features as unknown as PackageFeatures) || undefined,
    limitations: (pkg.limitations as unknown as PackageLimitations) || undefined,
    sortOrder: pkg.sortOrder,
    isActive: pkg.isActive,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  };
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaPackage(pkg: Partial<Package>): Partial<PrismaPackage> {
  return {
    name: pkg.name!,
    version: pkg.version!,
    description: pkg.description ?? null,
    priceCents: pkg.priceCents!,
    currency: pkg.currency ?? 'USD',
    dailyPoints: pkg.dailyPoints!,
    validDays: pkg.validDays ?? null,
    planType: pkg.planType ?? 'basic',
    features: (pkg.features as any) ?? {},
    limitations: (pkg.limitations as any) ?? {},
    sortOrder: pkg.sortOrder ?? 0,
    isActive: pkg.isActive ?? true,
  } as any;
}

// 获取所有激活的套餐
export async function getActivePackages(): Promise<Package[]> {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return packages.map(pkg => fromPrismaPackage(pkg)!);
  } catch (error) {
    console.error('Error getting active packages:', error);
    return [];
  }
}

// 根据ID获取套餐
export async function getPackageById(id: string): Promise<Package | undefined> {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
    });
    return fromPrismaPackage(pkg);
  } catch (error) {
    console.error('Error getting package by id:', error);
    return undefined;
  }
}

// 创建套餐
export async function createPackage(data: Partial<Package>): Promise<Package | undefined> {
  try {
    const pkg = await prisma.package.create({
      data: toPrismaPackage(data) as any,
    });
    return fromPrismaPackage(pkg);
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
}

// 更新套餐
export async function updatePackage(id: string, data: Partial<Package>): Promise<Package | undefined> {
  try {
    const pkg = await prisma.package.update({
      where: { id },
      data: toPrismaPackage(data) as any,
    });
    return fromPrismaPackage(pkg);
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
}

// 删除套餐（软删除，设置为非激活）
export async function deletePackage(id: string): Promise<boolean> {
  try {
    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  } catch (error) {
    console.error('Error deleting package:', error);
    return false;
  }
}

// 获取推荐套餐（通过 features 中的 isRecommended 标记）
export async function getRecommendedPackages(): Promise<Package[]> {
  try {
    const packages = await prisma.package.findMany({
      where: {
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const recommendedPackages = packages.filter(pkg => {
      const features = (pkg.features as any) || {};
      return features.isRecommended === true;
    });

    return recommendedPackages.map(pkg => fromPrismaPackage(pkg)!);
  } catch (error) {
    console.error('Error getting recommended packages:', error);
    return [];
  }
}

// 根据版本号获取套餐
export async function getPackageByVersion(version: string): Promise<Package | undefined> {
  try {
    const pkg = await prisma.package.findFirst({
      where: { 
        version,
        isActive: true 
      },
    });
    return fromPrismaPackage(pkg);
  } catch (error) {
    console.error('Error getting package by version:', error);
    return undefined;
  }
}

// 查找与独立积分总额匹配的激活 credits 套餐（dailyPoints 即总积分）
export async function findActiveCreditsPackageByTotalCredits(totalCredits: number): Promise<Package | undefined> {
  try {
    const pkg = await prisma.package.findFirst({
      where: {
        planType: 'credits',
        isActive: true,
        dailyPoints: totalCredits,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return fromPrismaPackage(pkg);
  } catch (error) {
    console.error('Error finding credits package by total credits:', error);
    return undefined;
  }
}
