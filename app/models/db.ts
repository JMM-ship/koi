import { PrismaClient } from '@prisma/client';

// 声明全局类型，避免TypeScript错误
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // 生产环境：创建新的Prisma客户端实例
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // 开发环境：使用全局单例避免热重载时创建多个实例
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: [ 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// 导出Prisma客户端
export function getPrismaClient() {
  return prisma;
}


// 导出prisma实例，方便直接使用
export { prisma };

// 导出Prisma类型，方便在其他文件中使用
export type { User, Order, ApiKey, Wallet, CreditTransaction, Package, UserPackage, UsageRecord } from '@prisma/client';