#!/usr/bin/env node
/**
 * 定时任务调度器
 * 使用 node-cron 实现定时任务调度
 * 
 * 使用方法:
 * 1. 安装依赖: npm install node-cron
 * 2. 运行: npx tsx scripts/cron-scheduler.ts
 * 或者在 package.json 中添加脚本:
 * "cron": "tsx scripts/cron-scheduler.ts"
 */

import * as cron from 'node-cron';
import { 
  dailyCreditResetJob,
  packageExpiryCheckJob,
  expiredOrderCleanupJob,
  getCronJobConfigs
} from '@/app/service/cronJobs';

// 任务调度器类
class CronScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.setupSignalHandlers();
  }

  // 启动调度器
  async start() {
    console.log(`[${new Date().toISOString()}] Starting cron scheduler...`);
    
    // 获取任务配置
    const configs = getCronJobConfigs();
    
    for (const config of configs) {
      if (!config.enabled) {
        console.log(`[${new Date().toISOString()}] Task '${config.name}' is disabled, skipping...`);
        continue;
      }

      // 验证 cron 表达式
      if (!cron.validate(config.schedule)) {
        console.error(`[${new Date().toISOString()}] Invalid cron expression for task '${config.name}': ${config.schedule}`);
        continue;
      }

      // 创建定时任务
      const task = cron.schedule(config.schedule, async () => {
        console.log(`[${new Date().toISOString()}] Executing task: ${config.name}`);
        try {
          await config.handler();
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error executing task '${config.name}':`, error);
        }
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'Asia/Shanghai' // 使用中国时区
      });

      // 保存任务引用
      this.tasks.set(config.name, task);
      
      // 启动任务
      task.start();
      console.log(`[${new Date().toISOString()}] Task '${config.name}' scheduled with pattern: ${config.schedule}`);
    }

    this.isRunning = true;
    console.log(`[${new Date().toISOString()}] Cron scheduler started with ${this.tasks.size} active tasks`);
    
    // 立即执行一次检查（可选）
    if (process.env.RUN_ON_START === 'true') {
      await this.runAllTasksOnce();
    }
  }

  // 停止调度器
  stop() {
    console.log(`[${new Date().toISOString()}] Stopping cron scheduler...`);
    
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`[${new Date().toISOString()}] Task '${name}' stopped`);
    }
    
    this.tasks.clear();
    this.isRunning = false;
    console.log(`[${new Date().toISOString()}] Cron scheduler stopped`);
  }

  // 立即执行所有任务一次
  async runAllTasksOnce() {
    console.log(`[${new Date().toISOString()}] Running all tasks once...`);
    
    const results = [];
    
    // 执行每日积分重置
    console.log(`[${new Date().toISOString()}] Running daily credit reset...`);
    results.push(await dailyCreditResetJob());
    
    // 执行套餐到期检查
    console.log(`[${new Date().toISOString()}] Running package expiry check...`);
    results.push(await packageExpiryCheckJob());
    
    // 执行过期订单清理
    console.log(`[${new Date().toISOString()}] Running expired order cleanup...`);
    results.push(await expiredOrderCleanupJob());
    
    // 打印结果
    console.log(`[${new Date().toISOString()}] All tasks completed:`);
    results.forEach(result => {
      console.log(`  - ${result.jobName}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
    });
  }

  // 设置信号处理器
  private setupSignalHandlers() {
    // 优雅退出
    process.on('SIGINT', () => {
      console.log(`\n[${new Date().toISOString()}] Received SIGINT, shutting down gracefully...`);
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log(`\n[${new Date().toISOString()}] Received SIGTERM, shutting down gracefully...`);
      this.stop();
      process.exit(0);
    });

    // 错误处理
    process.on('uncaughtException', (error) => {
      console.error(`[${new Date().toISOString()}] Uncaught exception:`, error);
      this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(`[${new Date().toISOString()}] Unhandled rejection at:`, promise, 'reason:', reason);
    });
  }

  // 获取状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.size,
      tasks: Array.from(this.tasks.keys())
    };
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('KOI System - Cron Scheduler');
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timezone: ${process.env.TZ || 'Asia/Shanghai'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log('========================================\n');

  const scheduler = new CronScheduler();

  // 解析命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--once') || args.includes('-o')) {
    // 只执行一次所有任务
    console.log('Running all tasks once and exiting...\n');
    await scheduler.runAllTasksOnce();
    process.exit(0);
  } else if (args.includes('--help') || args.includes('-h')) {
    // 显示帮助信息
    console.log('Usage: node cron-scheduler.ts [options]');
    console.log('\nOptions:');
    console.log('  --once, -o    Run all tasks once and exit');
    console.log('  --help, -h    Show this help message');
    console.log('\nEnvironment variables:');
    console.log('  ENABLE_CRON_JOBS=true    Enable cron jobs');
    console.log('  RUN_ON_START=true        Run all tasks once on startup');
    console.log('  TZ=Asia/Shanghai         Set timezone');
    process.exit(0);
  } else {
    // 启动调度器
    await scheduler.start();
    console.log('\nScheduler is running. Press Ctrl+C to stop.\n');
    
    // 保持进程运行
    setInterval(() => {
      // 每小时打印一次状态
      const status = scheduler.getStatus();
      console.log(`[${new Date().toISOString()}] Status: Running with ${status.tasksCount} active tasks`);
    }, 3600000); // 1小时
  }
}

// 执行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { CronScheduler };