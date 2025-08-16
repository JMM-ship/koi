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
  name_en?: string;
  version: string;
  description?: string;
  price: number;
  original_price?: number;
  currency: string;
  daily_credits: number;
  valid_days: number;
  plan_type: string; // basic, pro, enterprise
  features?: PackageFeatures;
  limitations?: PackageLimitations;
  sort_order: number;
  is_active: boolean;
  is_recommended: boolean;
  tag?: string;
  created_at: string;
  updated_at: string;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaPackage(pkg: any | null): Package | undefined {
  if (!pkg) return undefined;
  
  return {
    id: pkg.id,
    name: pkg.name,
    name_en: pkg.nameEn || undefined,
    version: pkg.version,
    description: pkg.description || undefined,
    price: pkg.price,
    original_price: pkg.originalPrice || undefined,
    currency: pkg.currency,
    daily_credits: pkg.dailyCredits,
    valid_days: pkg.validDays,
    plan_type: pkg.planType,
    features: pkg.features as PackageFeatures || undefined,
    limitations: pkg.limitations as PackageLimitations || undefined,
    sort_order: pkg.sortOrder,
    is_active: pkg.isActive,
    is_recommended: pkg.isRecommended,
    tag: pkg.tag || undefined,
    created_at: pkg.createdAt.toISOString(),
    updated_at: pkg.updatedAt.toISOString(),
  };
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaPackage(pkg: Partial<Package>): any {
  return {
    name: pkg.name,
    nameEn: pkg.name_en || null,
    version: pkg.version,
    description: pkg.description || null,
    price: pkg.price,
    originalPrice: pkg.original_price || null,
    currency: pkg.currency || 'CNY',
    dailyCredits: pkg.daily_credits,
    validDays: pkg.valid_days || 30,
    planType: pkg.plan_type || 'basic',
    features: pkg.features || null,
    limitations: pkg.limitations || null,
    sortOrder: pkg.sort_order || 0,
    isActive: pkg.is_active !== undefined ? pkg.is_active : true,
    isRecommended: pkg.is_recommended || false,
    tag: pkg.tag || null,
  };
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
      data: toPrismaPackage(data),
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
      data: toPrismaPackage(data),
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

// 获取推荐套餐
export async function getRecommendedPackages(): Promise<Package[]> {
  try {
    const packages = await prisma.package.findMany({
      where: { 
        isActive: true,
        isRecommended: true 
      },
      orderBy: { sortOrder: 'asc' },
    });
    return packages.map(pkg => fromPrismaPackage(pkg)!);
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