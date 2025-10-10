#!/usr/bin/env node
/**
 * 用户消费统计更新脚本
 * 从 cost_aggregates 聚合用户消费数据并计算排名百分位
 *
 * 使用方法:
 * npx tsx scripts/update-user-cost-stats.ts [options]
 *
 * 选项:
 *   --user <uuid>  更新特定用户的统计
 *   --all          更新所有用户的统计 (默认)
 *   --help         显示帮助信息
 */

import { prisma } from '@/app/models/db';
import { Prisma } from '@prisma/client';

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

interface UserConsumption {
  userId: string;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
}

// 计算时间范围
function getTimeRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return { today, weekAgo, monthAgo, now };
}

// 聚合单个用户的消费数据
async function aggregateUserConsumption(userId: string): Promise<UserConsumption | null> {
  try {
    // 获取用户所有 API Keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { ownerUserId: userId },
      select: { id: true }
    });

    if (apiKeys.length === 0) {
      return {
        userId,
        todayPoints: 0,
        weekPoints: 0,
        monthPoints: 0,
      };
    }

    const apiKeyIds = apiKeys.map(k => k.id);
    const { today, weekAgo, monthAgo, now } = getTimeRanges();

    // 并行查询三个时间段的消费
    const [todayAgg, weekAgg, monthAgg] = await Promise.all([
      prisma.costAggregate.aggregate({
        where: {
          apiKeyId: { in: apiKeyIds },
          granularity: 'd',
          bucketAt: { gte: today, lte: now }
        },
        _sum: { points: true }
      }),
      prisma.costAggregate.aggregate({
        where: {
          apiKeyId: { in: apiKeyIds },
          granularity: 'd',
          bucketAt: { gte: weekAgo, lte: now }
        },
        _sum: { points: true }
      }),
      prisma.costAggregate.aggregate({
        where: {
          apiKeyId: { in: apiKeyIds },
          granularity: 'd',
          bucketAt: { gte: monthAgo, lte: now }
        },
        _sum: { points: true }
      }),
    ]);

    return {
      userId,
      todayPoints: Number(todayAgg._sum.points || 0),
      weekPoints: Number(weekAgg._sum.points || 0),
      monthPoints: Number(monthAgg._sum.points || 0),
    };
  } catch (error) {
    log.error(`Failed to aggregate user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

// 计算百分位
function calculatePercentiles(
  consumptions: UserConsumption[],
  field: 'todayPoints' | 'weekPoints' | 'monthPoints'
): Map<string, number> {
  // 按消费金额排序
  const sorted = [...consumptions].sort((a, b) => a[field] - b[field]);
  const total = sorted.length;

  const percentiles = new Map<string, number>();

  sorted.forEach((item, index) => {
    // 计算百分位：比当前用户消费少的用户占比
    const percentile = total > 1 ? Math.round((index / (total - 1)) * 100) : 100;
    percentiles.set(item.userId, percentile);
  });

  return percentiles;
}

// 更新单个用户的统计
async function updateSingleUser(userId: string) {
  log.info(`Updating stats for user: ${userId}`);

  try {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, nickname: true },
    });

    if (!user) {
      log.error(`User not found: ${userId}`);
      return;
    }

    log.info(`User found: ${user.email}`);

    // 聚合用户消费数据
    const consumption = await aggregateUserConsumption(userId);

    if (!consumption) {
      log.error('Failed to aggregate user consumption');
      return;
    }

    log.info(`Consumption: Today=${consumption.todayPoints}, Week=${consumption.weekPoints}, Month=${consumption.monthPoints}`);

    // 为了计算百分位，需要获取所有用户的数据
    log.info('Fetching all users for percentile calculation...');
    const allUsers = await prisma.user.findMany({ select: { id: true } });

    const allConsumptions: UserConsumption[] = [];
    for (const u of allUsers) {
      const c = await aggregateUserConsumption(u.id);
      if (c) allConsumptions.push(c);
    }

    log.info(`Processing ${allConsumptions.length} users for percentile calculation...`);

    const todayPercentiles = calculatePercentiles(allConsumptions, 'todayPoints');
    const weekPercentiles = calculatePercentiles(allConsumptions, 'weekPoints');
    const monthPercentiles = calculatePercentiles(allConsumptions, 'monthPoints');

    // 更新到数据库
    await prisma.userCostStats.upsert({
      where: { userId },
      update: {
        todayPoints: consumption.todayPoints,
        weekPoints: consumption.weekPoints,
        monthPoints: consumption.monthPoints,
        todayPercentile: todayPercentiles.get(userId) || 0,
        weekPercentile: weekPercentiles.get(userId) || 0,
        monthPercentile: monthPercentiles.get(userId) || 0,
      },
      create: {
        userId,
        todayPoints: consumption.todayPoints,
        weekPoints: consumption.weekPoints,
        monthPoints: consumption.monthPoints,
        todayPercentile: todayPercentiles.get(userId) || 0,
        weekPercentile: weekPercentiles.get(userId) || 0,
        monthPercentile: monthPercentiles.get(userId) || 0,
      }
    });

    log.success(`Stats updated! Percentiles: Today=${todayPercentiles.get(userId)}%, Week=${weekPercentiles.get(userId)}%, Month=${monthPercentiles.get(userId)}%`);
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 更新所有用户的统计
async function updateAllUsers() {
  log.info('Starting batch update for all users...');

  try {
    const startTime = Date.now();

    // 1. 获取所有用户
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });

    log.info(`Found ${users.length} users`);

    // 2. 聚合所有用户的消费数据
    log.info('Aggregating consumption data...');
    const allConsumptions: UserConsumption[] = [];

    for (let i = 0; i < users.length; i++) {
      if (i % 10 === 0) {
        log.info(`Progress: ${i}/${users.length}`);
      }

      const consumption = await aggregateUserConsumption(users[i].id);
      if (consumption) {
        allConsumptions.push(consumption);
      }
    }

    log.info(`Aggregated ${allConsumptions.length} user consumptions`);

    // 3. 计算百分位
    log.info('Calculating percentiles...');
    const todayPercentiles = calculatePercentiles(allConsumptions, 'todayPoints');
    const weekPercentiles = calculatePercentiles(allConsumptions, 'weekPoints');
    const monthPercentiles = calculatePercentiles(allConsumptions, 'monthPoints');

    // 4. 批量更新数据库
    log.info('Updating database...');
    let successCount = 0;
    let failedCount = 0;

    for (const consumption of allConsumptions) {
      try {
        await prisma.userCostStats.upsert({
          where: { userId: consumption.userId },
          update: {
            todayPoints: consumption.todayPoints,
            weekPoints: consumption.weekPoints,
            monthPoints: consumption.monthPoints,
            todayPercentile: todayPercentiles.get(consumption.userId) || 0,
            weekPercentile: weekPercentiles.get(consumption.userId) || 0,
            monthPercentile: monthPercentiles.get(consumption.userId) || 0,
          },
          create: {
            userId: consumption.userId,
            todayPoints: consumption.todayPoints,
            weekPoints: consumption.weekPoints,
            monthPoints: consumption.monthPoints,
            todayPercentile: todayPercentiles.get(consumption.userId) || 0,
            weekPercentile: weekPercentiles.get(consumption.userId) || 0,
            monthPercentile: monthPercentiles.get(consumption.userId) || 0,
          }
        });
        successCount++;
      } catch (error) {
        failedCount++;
        log.error(`Failed to update user ${consumption.userId}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 5. 输出统计结果
    console.log('\n' + '='.repeat(50));
    log.success('Update Summary');
    console.log('='.repeat(50));
    console.log(`Total users: ${users.length}`);
    console.log(`Successfully updated: ${colors.green}${successCount}${colors.reset}`);
    console.log(`Failed: ${colors.red}${failedCount}${colors.reset}`);
    console.log(`Execution time: ${duration}s`);
    console.log('='.repeat(50));
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
${colors.cyan}User Cost Stats Update Tool${colors.reset}

Usage: npx tsx scripts/update-user-cost-stats.ts [options]

Options:
  ${colors.yellow}--user <uuid>${colors.reset}  Update stats for a specific user
  ${colors.yellow}--all${colors.reset}          Update stats for all users (default)
  ${colors.yellow}--help${colors.reset}         Show this help message

Examples:
  npx tsx scripts/update-user-cost-stats.ts --user abc123
  npx tsx scripts/update-user-cost-stats.ts --all

Description:
  This script aggregates user consumption data from cost_aggregates table
  and calculates ranking percentiles for credits consumption ranking.

  It updates the user_cost_stats table with:
  - Today/Week/Month consumption points
  - Percentile rankings (0-100)

Environment Variables:
  DATABASE_URL   Database connection string
  `);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
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
      const userId = args[userIndex + 1];

      if (!userId) {
        log.error('Please provide a user UUID');
        process.exit(1);
      }

      await updateSingleUser(userId);
    } else {
      // 默认更新所有用户
      await updateAllUsers();
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

export { updateAllUsers, updateSingleUser, aggregateUserConsumption };
