#!/usr/bin/env node
/**
 * 积分重置测试脚本
 * 用于手动触发和测试积分重置功能
 * 
 * 使用方法:
 * npx tsx scripts/reset-credits.ts [options]
 * 
 * 选项:
 *   --user <uuid>  重置特定用户的积分
 *   --all          重置所有用户的积分
 *   --check        检查重置状态
 *   --help         显示帮助信息
 */

import { 
  resetUserPackageCredits, 
  resetAllPackageCredits,
  shouldResetCredits,
  getLastResetTime,
  getTodayResetCount
} from '@/app/service/creditResetService';
import { getUserActivePackage } from '@/app/models/userPackage';
import { getCreditBalance } from '@/app/models/creditBalance';
import { prisma } from '@/app/models/db';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// 重置单个用户的积分
async function resetSingleUser(userUuid: string) {
  log.info(`Resetting credits for user: ${userUuid}`);
  
  try {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { uuid: userUuid },
      select: { email: true, nickname: true },
    });
    
    if (!user) {
      log.error(`User not found: ${userUuid}`);
      return;
    }
    
    log.info(`User found: ${user.email} (${user.nickname || 'No nickname'})`);
    
    // 获取用户当前套餐
    const activePackage = await getUserActivePackage(userUuid);
    if (!activePackage) {
      log.warn('User has no active package');
      return;
    }
    
    log.info(`Active package: ${activePackage.daily_credits} credits/day, expires ${activePackage.end_date}`);
    
    // 获取当前积分余额
    const balanceBefore = await getCreditBalance(userUuid);
    log.info(`Current balance: Package=${balanceBefore?.package_credits || 0}, Independent=${balanceBefore?.independent_credits || 0}`);
    
    // 检查是否需要重置
    const needsReset = await shouldResetCredits(userUuid);
    if (!needsReset) {
      log.warn('Credits already reset today');
      const lastReset = await getLastResetTime(userUuid);
      if (lastReset) {
        log.info(`Last reset: ${lastReset.toISOString()}`);
      }
      return;
    }
    
    // 执行重置
    const result = await resetUserPackageCredits(userUuid);
    
    if (result.success) {
      log.success(`Credits reset successfully! Daily credits: ${result.dailyCredits}`);
      
      // 获取重置后的余额
      const balanceAfter = await getCreditBalance(userUuid);
      log.info(`New balance: Package=${balanceAfter?.package_credits || 0}, Independent=${balanceAfter?.independent_credits || 0}`);
    } else {
      log.error(`Failed to reset credits: ${result.error}`);
    }
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 重置所有用户的积分
async function resetAllUsers() {
  log.info('Starting batch credit reset for all users...');
  
  try {
    const startTime = Date.now();
    const summary = await resetAllPackageCredits();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    log.success(`Reset Summary`);
    console.log('='.repeat(50));
    console.log(`Total users processed: ${summary.totalUsers}`);
    console.log(`Successful resets: ${colors.green}${summary.successCount}${colors.reset}`);
    console.log(`Failed resets: ${colors.red}${summary.failedCount}${colors.reset}`);
    console.log(`Execution time: ${duration}s`);
    console.log('='.repeat(50));
    
    // 显示失败的用户
    if (summary.failedCount > 0) {
      console.log('\nFailed users:');
      summary.results
        .filter(r => !r.success)
        .forEach(r => {
          log.error(`  ${r.userUuid}: ${r.error}`);
        });
    }
    
    // 显示成功的用户
    if (summary.successCount > 0) {
      console.log('\nSuccessful resets:');
      summary.results
        .filter(r => r.success)
        .slice(0, 10) // 只显示前10个
        .forEach(r => {
          log.success(`  ${r.userUuid}: ${r.dailyCredits} credits`);
        });
      
      if (summary.successCount > 10) {
        console.log(`  ... and ${summary.successCount - 10} more`);
      }
    }
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 检查重置状态
async function checkStatus() {
  log.info('Checking credit reset status...');
  
  try {
    const todayCount = await getTodayResetCount();
    
    console.log('\n' + '='.repeat(50));
    log.info('Reset Status');
    console.log('='.repeat(50));
    console.log(`Users reset today: ${colors.cyan}${todayCount}${colors.reset}`);
    console.log(`Current time: ${new Date().toISOString()}`);
    
    // 获取一些统计信息
    const activePackagesCount = await prisma.userPackage.count({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });
    
    const expiredPackagesCount = await prisma.userPackage.count({
      where: {
        isActive: true,
        endDate: {
          lt: new Date(),
        },
      },
    });
    
    console.log(`Active packages: ${colors.green}${activePackagesCount}${colors.reset}`);
    console.log(`Expired packages (need cleanup): ${colors.yellow}${expiredPackagesCount}${colors.reset}`);
    console.log('='.repeat(50));
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
${colors.cyan}Credit Reset Tool${colors.reset}

Usage: npx tsx scripts/reset-credits.ts [options]

Options:
  ${colors.yellow}--user <uuid>${colors.reset}  Reset credits for a specific user
  ${colors.yellow}--all${colors.reset}          Reset credits for all users
  ${colors.yellow}--check${colors.reset}        Check reset status
  ${colors.yellow}--help${colors.reset}         Show this help message

Examples:
  npx tsx scripts/reset-credits.ts --user abc123
  npx tsx scripts/reset-credits.ts --all
  npx tsx scripts/reset-credits.ts --check

Environment Variables:
  DATABASE_URL   Database connection string
  `);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  // 检查数据库连接
  try {
    await prisma.$connect();
    log.success('Database connected');
  } catch (error) {
    log.error('Failed to connect to database');
    process.exit(1);
  }
  
  try {
    if (args.includes('--user')) {
      const userIndex = args.indexOf('--user');
      const userUuid = args[userIndex + 1];
      
      if (!userUuid) {
        log.error('Please provide a user UUID');
        process.exit(1);
      }
      
      await resetSingleUser(userUuid);
    } else if (args.includes('--all')) {
      await resetAllUsers();
    } else if (args.includes('--check')) {
      await checkStatus();
    } else {
      log.error('Invalid option. Use --help for usage information');
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
    log.info('Database disconnected');
  }
}

// 执行主函数
if (require.main === module) {
  main().catch((error) => {
    log.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  });
}