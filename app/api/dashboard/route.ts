import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getMockAuth } from '@/lib/auth-mock';
import prisma from '@/lib/prisma';
import { dbRouter } from '@/app/models/db';

export async function GET(request: Request) {
  try {
    // 尝试获取真实用户，如果失败则使用模拟用户（仅用于开发）
    let user = await getAuth(request);

    // 在开发环境下，如果没有配置认证，使用模拟认证
    if (!user && process.env.NODE_ENV === 'development') {
      console.log('Using mock auth for development');
      user = await getMockAuth();
    }

    if (!user) {
      throw new Error("User not found");
    }

    // 使用会话中的 uuid/id，避免额外查库
    const userId = (user as any).uuid as string;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 并行抓取核心数据，减少总耗时
    // 使用副本库进行查询操作，提升性能
    const [wallet, usageRecords, userPackage, userInfo] = await Promise.all([
      dbRouter.read.wallet.findUnique({ where: { userId } }),
      dbRouter.read.usageRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      dbRouter.read.userPackage.findFirst({
        where: { userId, isActive: true, endAt: { gte: now } },
        include: { package: true },
        orderBy: { endAt: 'desc' },
      }),
      dbRouter.read.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // 计算积分消耗统计（内部已并行化）
    const creditStats = await calculateCreditStats(userId);

    // 格式化响应数据以兼容前端
    const response = {
      creditBalance: {
        id: wallet?.userId,
        userId: wallet?.userId,
        packageCredits: Number(wallet?.packageTokensRemaining || 0),
        independentCredits: Number(wallet?.independentTokens || 0),
        totalCredits: Number(wallet?.packageTokensRemaining || 0) + Number(wallet?.independentTokens || 0),
        updatedAt: wallet?.updatedAt || new Date()
      },
      modelUsages: usageRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        modelName: record.model,
        usageType: 'api_call',
        credits: record.pointsCharged,
        metadata: record.meta,
        status: record.status,
        timestamp: record.createdAt
      })),
      userPackage: userPackage ? {
        id: userPackage.id,
        userId: userPackage.userId,
        packageId: userPackage.packageId,
        packageName: userPackage.package?.name || 'Unknown',
        dailyCredits: userPackage.dailyPoints,
        startDate: userPackage.startAt,
        endDate: userPackage.endAt,
        isActive: userPackage.isActive
      } : null,
      userInfo: userInfo ? {
        ...userInfo,
        planType: userPackage?.package?.planType || 'free',
        planExpiredAt: userPackage?.endAt || null,
        totalCredits: Number(wallet?.packageTokensRemaining || 0) + Number(wallet?.independentTokens || 0)
      } : null,
      creditStats
    };

    return NextResponse.json(response);
  } catch (error) {
    // 输出更详细的错误信息，便于判断是否为连接耗尽/超时等问题
    const err = error as any;
    console.error('Error fetching dashboard data:', {
      message: err?.message,
      name: err?.name,
      code: err?.code,
      meta: err?.meta,
    });
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// 计算积分消耗统计
async function calculateCreditStats(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 使用副本库进行统计查询，减轻主库压力
  // 三段统计 + 排名并行计算
  const [todayUsage, weekUsage, monthUsage, allUsersWeekUsage] = await Promise.all([
    dbRouter.read.creditTransaction.aggregate({
      where: { userId, type: 'expense', createdAt: { gte: today } },
      _sum: { points: true },
    }),
    dbRouter.read.creditTransaction.aggregate({
      where: { userId, type: 'expense', createdAt: { gte: weekAgo } },
      _sum: { points: true },
    }),
    dbRouter.read.creditTransaction.aggregate({
      where: { userId, type: 'expense', createdAt: { gte: monthAgo } },
      _sum: { points: true },
    }),
    dbRouter.read.creditTransaction.groupBy({
      by: ['userId'],
      where: { type: 'expense', createdAt: { gte: weekAgo } },
      _sum: { points: true },
    }),
  ]);

  const userWeekTotal = weekUsage._sum.points || 0;
  const usersWithLessUsage = allUsersWeekUsage.filter(
    u => (u._sum.points || 0) < userWeekTotal
  ).length;
  const totalUsers = allUsersWeekUsage.length || 1;

  let betterThanPercentage;
  if (totalUsers === 1) {
    betterThanPercentage = 100;
  } else {
    betterThanPercentage = Math.round((usersWithLessUsage / totalUsers) * 100);
  }

  return {
    today: {
      amount: todayUsage._sum.points || 0,
      percentage: betterThanPercentage
    },
    week: {
      amount: weekUsage._sum.points || 0,
      percentage: betterThanPercentage
    },
    month: {
      amount: monthUsage._sum.points || 0,
      percentage: betterThanPercentage
    }
  };
}
