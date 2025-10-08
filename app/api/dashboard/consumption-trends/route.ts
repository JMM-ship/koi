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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const type = searchParams.get('type') || 'points'; // points, money, tokens

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 获取用户ID
    const userId = user.uuid;

    // 从 creditTransaction 表获取消费数据
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId: userId,
        type: 'expense', // 只获取消费记录
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 按日期分组聚合数据
    const dailyData = new Map<string, number>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      let value = 0;
      switch (type) {
        case 'points':
          value = transaction.points;
          break;
        case 'tokens':
          value = transaction.tokens;
          break;
        case 'money':
          // 如果需要货币数据，可以从 order 表获取
          value = 0; // 暂时返回0，因为creditTransaction不包含货币信息
          break;
      }

      const currentValue = dailyData.get(dateStr) || 0;
      dailyData.set(dateStr, currentValue + value);
    });

    // 填充缺失的日期数据
    const filledData = fillMissingDates(dailyData, startDate, now);

    // 格式化数据
    const formattedData = filledData.map(item => ({
      date: `${new Date(item.date).getMonth() + 1}/${new Date(item.date).getDate()}`,
      value: item.value
    }));

    // 计算统计数据
    const total = formattedData.reduce((sum, item) => sum + item.value, 0);
    const average = total / formattedData.length;

    // 计算增长率（对比前一周期）：仅聚合总量，避免拉取明细
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousAgg = await prisma.creditTransaction.aggregate({
      where: {
        userId: userId,
        type: 'expense',
        createdAt: { gte: previousStartDate, lt: startDate },
      },
      _sum: { points: true, tokens: true },
    });
    const previousTotal = type === 'tokens'
      ? (previousAgg._sum.tokens || 0)
      : (previousAgg._sum.points || 0);

    const increase = total - previousTotal;
    const percentage = previousTotal > 0
      ? ((increase / previousTotal) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      data: formattedData,
      stats: {
        total,
        average,
        increase,
        percentage: `${increase >= 0 ? '+' : ''}${percentage}%`,
        unit: type === 'money' ? 'USD' : type === 'tokens' ? 'Tokens' : 'Points'
      }
    });
  } catch (error) {
    console.error('Error fetching consumption trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consumption trends' },
      { status: 500 }
    );
  }
}

// 填充缺失的日期数据
function fillMissingDates(
  dailyData: Map<string, number>,
  startDate: Date,
  endDate: Date
): { date: string; value: number }[] {
  const filledData = [];

  // 生成所有日期
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    filledData.push({
      date: dateStr,
      value: dailyData.get(dateStr) || 0
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}
