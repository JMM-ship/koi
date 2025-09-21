import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getMockAuth } from '@/lib/auth-mock';
import prisma from '@/lib/prisma';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.uuid;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 获取最近7天的积分交易记录（替代consumptionTrends）
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100
    });

    // 获取用户钱包信息（替代creditBalance）
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId
      }
    });

    // 获取最近的使用记录（替代modelUsages）
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // 获取用户套餐信息
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        userId,
        isActive: true,
        endAt: {
          gte: now
        }
      },
      include: {
        package: true
      },
      orderBy: {
        endAt: 'desc'
      }
    });

    // 获取用户信息
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // 计算积分消耗统计
    const creditStats = await calculateCreditStats(userId);

    // 格式化响应数据以兼容前端
    const response = {
      consumptionTrends: formatConsumptionTrends(creditTransactions, sevenDaysAgo, now),
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
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// 格式化消费趋势数据
function formatConsumptionTrends(
  transactions: any[],
  startDate: Date,
  endDate: Date
) {
  // 按日期分组聚合
  const dailyData = new Map<string, { pointsUsed: number; tokensUsed: number; moneyUsed: number }>();

  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const date = new Date(transaction.createdAt);
      const dateStr = date.toISOString().split('T')[0];

      const existing = dailyData.get(dateStr) || { pointsUsed: 0, tokensUsed: 0, moneyUsed: 0 };
      existing.pointsUsed += transaction.points;
      existing.tokensUsed += transaction.tokens;
      dailyData.set(dateStr, existing);
    }
  });

  // 填充缺失的日期
  const result = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const data = dailyData.get(dateStr) || { pointsUsed: 0, tokensUsed: 0, moneyUsed: 0 };

    result.push({
      date: new Date(dateStr),
      ...data
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

// 计算积分消耗统计
async function calculateCreditStats(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 今日消耗
  const todayUsage = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: 'expense',
      createdAt: {
        gte: today
      }
    },
    _sum: {
      points: true
    }
  });

  // 本周消耗
  const weekUsage = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: 'expense',
      createdAt: {
        gte: weekAgo
      }
    },
    _sum: {
      points: true
    }
  });

  // 本月消耗
  const monthUsage = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: 'expense',
      createdAt: {
        gte: monthAgo
      }
    },
    _sum: {
      points: true
    }
  });

  // 获取所有用户的消耗排名（用于计算百分比）
  const allUsersWeekUsage = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: {
      type: 'expense',
      createdAt: {
        gte: weekAgo
      }
    },
    _sum: {
      points: true
    }
  });

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