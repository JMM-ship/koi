import prisma from '@/lib/prisma';

// 统一由 lib/prisma 提供单例实例
export function getPrismaClient() {
  return prisma;
}

export { prisma };

// 导出Prisma类型，方便在其他文件中使用
export type { User, Order, ApiKey, Wallet, CreditTransaction, Package, UserPackage, UsageRecord } from '@prisma/client';
