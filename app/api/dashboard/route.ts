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
        isActive: userPackage.isActive,
        // 从 Package 表获取价格和功能
        price: userPackage.package?.priceCents ? userPackage.package.priceCents / 100 : 0,
        features: userPackage.package?.features || {}
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

// 计算积分消耗统计（优化版：从聚合表读取百分位）
async function calculateCreditStats(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 使用副本库进行统计查询，减轻主库压力
  // 直接从聚合表读取预计算的消费数据和百分位
  const userCostStats = await dbRouter.read.userCostStats.findUnique({
    where: { userId },
    select: {
      todayPoints: true,
      weekPoints: true,
      monthPoints: true,
      todayPercentile: true,
      weekPercentile: true,
      monthPercentile: true,
    }
  });

  // 如果聚合表中没有数据，使用默认值 0
  return {
    today: {
      amount: Number(userCostStats?.todayPoints || 0),
      percentage: userCostStats?.todayPercentile || 0
    },
    week: {
      amount: Number(userCostStats?.weekPoints || 0),
      percentage: userCostStats?.weekPercentile || 0
    },
    month: {
      amount: Number(userCostStats?.monthPoints || 0),
      percentage: userCostStats?.monthPercentile || 0
    }
  };
}
