import { PrismaClient } from '@prisma/client';

// 副本数据库连接实例
// 用于只读操作，分散主库压力

const globalForReplica = global as unknown as {
  prismaReplica: PrismaClient | undefined;
};

// 获取副本数据库URL，支持多个副本（逗号分隔）
const replicaUrls = process.env.REPLICA_DATABASE_URL?.split(',').map(url => url.trim()).filter(Boolean) || [];

// 如果没有配置副本URL，返回 null
let prismaReplica: PrismaClient | null = null;

if (replicaUrls.length > 0) {
  // 简单的负载均衡：随机选择一个副本URL
  const selectedReplicaUrl = replicaUrls[Math.floor(Math.random() * replicaUrls.length)];

  if (globalForReplica.prismaReplica) {
    prismaReplica = globalForReplica.prismaReplica;
  } else {
    prismaReplica = new PrismaClient({
      datasources: {
        db: {
          url: selectedReplicaUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForReplica.prismaReplica = prismaReplica;
    }
  }

  console.log(`[Prisma Replica] Connected to read replica: ${selectedReplicaUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);
} else {
  console.log('[Prisma Replica] No REPLICA_DATABASE_URL configured, will fallback to primary database for reads');
}

export default prismaReplica;
