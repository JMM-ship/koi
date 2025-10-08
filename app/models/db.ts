import prisma from '@/lib/prisma';
import { dbRouter } from '@/lib/database-router';

// 统一由 lib/prisma 提供单例实例
export function getPrismaClient() {
  return prisma;
}

export { prisma };

// 导出数据库路由器，支持读写分离
export { dbRouter };

// 导出Prisma类型，方便在其他文件中使用
export type { User, Order, ApiKey, Wallet, CreditTransaction, Package, UserPackage, UsageRecord } from '@prisma/client';
