import { PrismaClient } from '@prisma/client';
import prisma from './prisma';
import prismaReplica from './prisma-replica';

/**
 * 数据库路由器 - 实现读写分离
 *
 * 功能说明：
 * - write: 所有写操作使用主库
 * - read: 读操作优先使用副本库，副本不可用时自动降级到主库
 * - primary: 强制使用主库（用于需要强一致性的读操作）
 *
 * 使用场景：
 * 1. 一般查询列表、统计 -> 使用 read（允许轻微延迟）
 * 2. 所有写操作 -> 使用 write
 * 3. 写后立即读、关键业务读取 -> 使用 primary（保证一致性）
 */

interface DatabaseRouter {
  /** 读操作 - 优先使用副本库，降级到主库 */
  read: PrismaClient;
  /** 写操作 - 始终使用主库 */
  write: PrismaClient;
  /** 强制主库 - 用于需要强一致性的读操作 */
  primary: PrismaClient;
  /** 检查副本是否可用 */
  isReplicaAvailable: () => boolean;
}

/**
 * 创建数据库路由器实例
 */
function createDatabaseRouter(): DatabaseRouter {
  const isReplicaAvailable = (): boolean => {
    return prismaReplica !== null;
  };

  return {
    // 读操作：优先副本，降级主库
    read: prismaReplica || prisma,

    // 写操作：始终主库
    write: prisma,

    // 强制主库：用于需要强一致性的场景
    primary: prisma,

    // 副本可用性检查
    isReplicaAvailable,
  };
}

/**
 * 全局路由器实例
 */
export const dbRouter = createDatabaseRouter();

/**
 * 默认导出路由器
 */
export default dbRouter;

/**
 * 使用指南：
 *
 * @example
 * // ✅ 读操作 - 使用副本库（允许轻微延迟）
 * const users = await dbRouter.read.user.findMany();
 * const stats = await dbRouter.read.order.count({ where: { status: 'paid' } });
 *
 * @example
 * // ✅ 写操作 - 使用主库
 * const newUser = await dbRouter.write.user.create({ data: {...} });
 * await dbRouter.write.order.update({ where: { id }, data: {...} });
 *
 * @example
 * // ✅ 写后立即读 - 使用主库（避免复制延迟）
 * const order = await dbRouter.write.order.create({ data: {...} });
 * const fresh = await dbRouter.primary.order.findUnique({ where: { id: order.id } });
 *
 * @example
 * // ✅ 关键业务读取 - 使用主库（保证一致性）
 * const wallet = await dbRouter.primary.wallet.findUnique({ where: { userId } });
 * const balance = await dbRouter.primary.user.findUnique({ where: { id }, include: { wallets: true } });
 *
 * @example
 * // ✅ 检查副本可用性
 * if (dbRouter.isReplicaAvailable()) {
 *   console.log('Read replica is available');
 * }
 */
