import { PrismaClient } from '@prisma/client';

// PrismaClient 是连接数据库的客户端，在开发环境下会热重载
// 为了避免重复创建实例，我们将其存储在 global 对象中

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;