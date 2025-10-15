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

    const userUuid = user.uuid;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 获取最近7天的消费趋势
    const consumptionTrends = await prisma.consumptionTrend.findMany({
      where: {
        userUuid,
        date: {
          gte: sevenDaysAgo,
          lte: now
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // 获取用户积分余额信息
    const creditBalance = await prisma.creditBalance.findUnique({
      where: {
        userUuid
      }
    });

    // 获取最近的模型使用记录
    const modelUsages = await prisma.modelUsage.findMany({
      where: {
        userUuid
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    // 获取用户套餐信息
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        userUuid,
        isActive: true,
        endDate: {
          gte: now
        }
      },
      orderBy: {
        endDate: 'desc'
      }
    });

    // 获取用户信息
    const userInfo = await prisma.user.findUnique({
      where: {
        uuid: userUuid
      },
      select: {
        planType: true,
        planExpiredAt: true,
        totalCredits: true
      }
    });

    // 计算积分消耗统计
    const creditStats = await calculateCreditStats(userUuid);

    return NextResponse.json({
      consumptionTrends,
      creditBalance,
      modelUsages,
      userPackage,
      userInfo,
      creditStats
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// 计算积分消耗统计
async function calculateCreditStats(userUuid: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 今日消耗
  const todayUsage = await prisma.creditTransaction.aggregate({
    where: {
      userUuid,
      type: 'expense',
      createdAt: {
        gte: today
      }
    },
    _sum: {
      amount: true
    }
  });

  // 本周消耗
  const weekUsage = await prisma.creditTransaction.aggregate({
    where: {
      userUuid,
      type: 'expense',
      createdAt: {
        gte: weekAgo
      }
    },
    _sum: {
      amount: true
    }
  });

  // 本月消耗
  const monthUsage = await prisma.creditTransaction.aggregate({
    where: {
      userUuid,
      type: 'expense',
      createdAt: {
        gte: monthAgo
      }
    },
    _sum: {
      amount: true
    }
  });

  // 获取所有用户的消耗排名（用于计算百分比）
  const allUsersWeekUsage = await prisma.creditTransaction.groupBy({
    by: ['userUuid'],
    where: {
      type: 'expense',
      createdAt: {
        gte: weekAgo
      }
    },
    _sum: {
      amount: true
    }
  });

  const userWeekTotal = weekUsage._sum.amount || 0;
  const usersWithLessUsage = allUsersWeekUsage.filter(
    u => (u._sum.amount || 0) < userWeekTotal
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
      amount: todayUsage._sum.amount || 0,
      percentage: betterThanPercentage
    },
    week: {
      amount: weekUsage._sum.amount || 0,
      percentage: betterThanPercentage
    },
    month: {
      amount: monthUsage._sum.amount || 0,
      percentage: betterThanPercentage
    }
  };
}