import { resetAllPackageCredits, resetUserPackageCredits, shouldResetCredits } from './creditResetService';
import { checkAndExpirePackages } from './packageManager';
import { batchCheckExpiredOrders } from './orderProcessor';

// 定时任务配置
export interface CronJobConfig {
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  handler: () => Promise<void>;
}

// 任务执行结果
export interface JobExecutionResult {
  jobName: string;
  executedAt: string;
  success: boolean;
  message?: string;
  details?: any;
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

// 执行所有日常维护任务
export async function runDailyMaintenanceTasks(): Promise<JobExecutionResult[]> {
  console.log(`[${new Date().toISOString()}] Starting daily maintenance tasks...`);
  
  const results: JobExecutionResult[] = [];
  
  // 1. 重置套餐积分
  const creditResetResult = await dailyCreditResetJob();
  results.push(creditResetResult);
  
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
      name: 'Daily Credit Reset',
      schedule: '0 0 * * *', // 每天0点执行
      enabled: process.env.ENABLE_CRON_JOBS === 'true',
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