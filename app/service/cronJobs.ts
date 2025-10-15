import { resetAllPackageCredits, resetUserPackageCredits, shouldResetCredits } from './creditResetService';
import { checkAndExpirePackages } from './packageManager';
import { batchCheckExpiredOrders } from './orderProcessor';
import { prisma } from '@/app/models/db';
import { autoRecoverCredits } from '@/app/service/creditRecoveryService';
import { updateAllUsers as updateUserCostStats } from '../../scripts/update-user-cost-stats';

// 定时任务配置
export interface CronJobConfig {
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  handler: () => Promise<JobExecutionResult>;
}

// 任务执行结果
export interface JobExecutionResult {
  jobName: string;
  executedAt: string;
  success: boolean;
  message?: string;
  details?: any;
}

// 每小时积分恢复任务（遍历活跃用户，按小时基于 lastRecoveryAt 恢复）
export async function hourlyRecoveryJob(options?: { now?: Date; pageSize?: number; concurrency?: number }): Promise<JobExecutionResult> {
  const startedAt = new Date();
  const now = options?.now ?? new Date();

  const pageSize = options?.pageSize ?? Number(process.env.HOURLY_RECOVERY_PAGE_SIZE || 500);
  const concurrency = options?.concurrency ?? Math.max(1, Number(process.env.HOURLY_RECOVERY_CONCURRENCY || 5));

  let offset = 0;
  let totalUsers = 0;
  let successCount = 0;
  let failedCount = 0;

  try {
    // 分页获取去重后的活跃用户（存在活跃套餐，且未过期）
    // 注意：自动恢复基于 lastRecoveryAt 与 now 的时间差，因此不依赖触发时区；
    // 按小时持续恢复对每个用户独立成立。
    for (;;) {
      const userIds = await prisma.userPackage.findMany({
        where: { isActive: true, endAt: { gte: now } },
        select: { userId: true },
        distinct: ['userId'],
        take: pageSize,
        skip: offset,
        orderBy: { userId: 'asc' },
      });

      if (!userIds.length) break;
      offset += userIds.length;

      totalUsers += userIds.length;

      // 分片 + 保守并发
      for (let i = 0; i < userIds.length; i += concurrency) {
        const slice = userIds.slice(i, i + concurrency);
        const results = await Promise.all(
          slice.map(async (row) => {
            try {
              const r = await autoRecoverCredits(row.userId, { now });
              return { ok: r.success };
            } catch (e) {
              return { ok: false };
            }
          })
        );
        for (const r of results) {
          if (r.ok) successCount++; else failedCount++;
        }
      }
    }

    const message = `Hourly recovery processed ${totalUsers} users: ${successCount} succeeded, ${failedCount} failed`;
    return {
      jobName: 'Hourly Credit Recovery',
      executedAt: startedAt.toISOString(),
      success: failedCount === 0,
      message,
      details: { totalUsers, successCount, failedCount, pageSize, concurrency },
    };
  } catch (error) {
    const message = `Hourly recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return {
      jobName: 'Hourly Credit Recovery',
      executedAt: startedAt.toISOString(),
      success: false,
      message,
    };
  }
}

// 每日积分重置任务
export async function dailyCreditResetJob(): Promise<JobExecutionResult> {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting daily credit reset job...`);
  
  try {
    // 执行批量重置
    const result = await resetAllPackageCredits();
    
    const message = `Credit reset completed: ${result.successCount}/${result.totalUsers} users processed successfully`;
    console.log(`[${new Date().toISOString()}] ${message}`);
    
    return {
      jobName: 'Daily Credit Reset',
      executedAt: startTime.toISOString(),
      success: true,
      message,
      details: result
    };
  } catch (error) {
    const errorMessage = `Credit reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[${new Date().toISOString()}] ${errorMessage}`, error);
    
    return {
      jobName: 'Daily Credit Reset',
      executedAt: startTime.toISOString(),
      success: false,
      message: errorMessage
    };
  }
}

// 套餐到期检查任务
export async function packageExpiryCheckJob(): Promise<JobExecutionResult> {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting package expiry check job...`);
  
  try {
    // 检查并处理到期套餐
    const expiredCount = await checkAndExpirePackages();
    
    const message = `Package expiry check completed: ${expiredCount} packages expired`;
    console.log(`[${new Date().toISOString()}] ${message}`);
    
    return {
      jobName: 'Package Expiry Check',
      executedAt: startTime.toISOString(),
      success: true,
      message,
      details: { expiredCount }
    };
  } catch (error) {
    const errorMessage = `Package expiry check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[${new Date().toISOString()}] ${errorMessage}`, error);
    
    return {
      jobName: 'Package Expiry Check',
      executedAt: startTime.toISOString(),
      success: false,
      message: errorMessage
    };
  }
}

// 过期订单清理任务
export async function expiredOrderCleanupJob(): Promise<JobExecutionResult> {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting expired order cleanup job...`);

  try {
    // 批量检查并清理过期订单
    const cleanedCount = await batchCheckExpiredOrders();

    const message = `Order cleanup completed: ${cleanedCount} expired orders processed`;
    console.log(`[${new Date().toISOString()}] ${message}`);

    return {
      jobName: 'Expired Order Cleanup',
      executedAt: startTime.toISOString(),
      success: true,
      message,
      details: { cleanedCount }
    };
  } catch (error) {
    const errorMessage = `Order cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[${new Date().toISOString()}] ${errorMessage}`, error);

    return {
      jobName: 'Expired Order Cleanup',
      executedAt: startTime.toISOString(),
      success: false,
      message: errorMessage
    };
  }
}

// 用户消费统计更新任务
export async function userCostStatsUpdateJob(): Promise<JobExecutionResult> {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting user cost stats update job...`);

  try {
    // 更新所有用户的消费统计和排名
    await updateUserCostStats();

    const message = 'User cost stats update completed successfully';
    console.log(`[${new Date().toISOString()}] ${message}`);

    return {
      jobName: 'User Cost Stats Update',
      executedAt: startTime.toISOString(),
      success: true,
      message
    };
  } catch (error) {
    const errorMessage = `User cost stats update failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[${new Date().toISOString()}] ${errorMessage}`, error);

    return {
      jobName: 'User Cost Stats Update',
      executedAt: startTime.toISOString(),
      success: false,
      message: errorMessage
    };
  }
}

// 执行所有日常维护任务
export async function runDailyMaintenanceTasks(): Promise<JobExecutionResult[]> {
  console.log(`[${new Date().toISOString()}] Starting daily maintenance tasks...`);
  
  const results: JobExecutionResult[] = [];
  
  // 1. 每小时恢复任务（手动触发一次）
  const hourlyResult = await hourlyRecoveryJob();
  results.push(hourlyResult);
  
  // 2. 检查套餐到期
  const packageExpiryResult = await packageExpiryCheckJob();
  results.push(packageExpiryResult);
  
  // 3. 清理过期订单
  const orderCleanupResult = await expiredOrderCleanupJob();
  results.push(orderCleanupResult);
  
  // 总结
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`[${new Date().toISOString()}] Daily maintenance completed: ${successCount}/${totalCount} tasks succeeded`);
  
  return results;
}

// 检查并重置单个用户的积分（用于实时检查）
export async function checkAndResetUserCredits(userUuid: string): Promise<boolean> {
  try {
    // 检查是否需要重置
    const needsReset = await shouldResetCredits(userUuid);
    
    if (!needsReset) {
      return false;
    }
    
    // 执行重置
    const result = await resetUserPackageCredits(userUuid);
    return result.success;
  } catch (error) {
    console.error(`Error checking/resetting credits for user ${userUuid}:`, error);
    return false;
  }
}

// 获取定时任务配置
export function getCronJobConfigs(): CronJobConfig[] {
  return [
    {
      name: 'Hourly Credit Recovery',
      // 每小时第5分触发（node-cron: 秒 分 时 日 月 周）
      schedule: '0 5 * * * *',
      enabled: process.env.ENABLE_HOURLY_RECOVERY === 'true',
      handler: hourlyRecoveryJob,
    },
    {
      name: 'User Cost Stats Update',
      // 每小时第10分触发（在 cost_aggregates 更新后）
      schedule: '0 10 * * * *',
      enabled: process.env.ENABLE_CRON_JOBS === 'true',
      handler: userCostStatsUpdateJob
    },
    {
      name: 'Daily Credit Reset',
      schedule: '0 0 * * *', // 每天0点执行
      // 通过独立环境变量控制，默认关闭旧作业
      enabled: process.env.ENABLE_DAILY_RESET === 'true',
      handler: dailyCreditResetJob
    },
    {
      name: 'Package Expiry Check',
      schedule: '0 1 * * *', // 每天1点执行
      enabled: process.env.ENABLE_CRON_JOBS === 'true',
      handler: packageExpiryCheckJob
    },
    {
      name: 'Expired Order Cleanup',
      schedule: '0 2 * * *', // 每天2点执行
      enabled: process.env.ENABLE_CRON_JOBS === 'true',
      handler: expiredOrderCleanupJob
    }
  ];
}

// 手动触发特定任务
export async function triggerJob(jobName: string): Promise<JobExecutionResult> {
  const configs = getCronJobConfigs();
  const config = configs.find(c => c.name === jobName);
  
  if (!config) {
    return {
      jobName,
      executedAt: new Date().toISOString(),
      success: false,
      message: `Job '${jobName}' not found`
    };
  }
  
  try {
    return await config.handler();
  } catch (error) {
    return {
      jobName,
      executedAt: new Date().toISOString(),
      success: false,
      message: `Job execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
