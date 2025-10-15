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

    // 获取指定时间范围的消费趋势
    const trends = await prisma.consumptionTrend.findMany({
      where: {
        userUuid: user.uuid,
        date: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // 填充缺失的日期数据
    const filledTrends = fillMissingDates(trends, startDate, now);

    // 根据类型返回相应的数据
    const formattedData = filledTrends.map(trend => {
      const date = new Date(trend.date);
      const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
      
      let value = 0;
      switch (type) {
        case 'points':
          value = trend.pointsUsed;
          break;
        case 'money':
          value = parseFloat(trend.moneyUsed?.toString() || '0');
          break;
        case 'tokens':
          value = trend.tokensUsed;
          break;
      }

      return {
        date: dateLabel,
        value
      };
    });

    // 计算统计数据
    const total = formattedData.reduce((sum, item) => sum + item.value, 0);
    const average = total / formattedData.length;
    
    // 计算增长率（对比前一周期）
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousTrends = await prisma.consumptionTrend.findMany({
      where: {
        userUuid: user.uuid,
        date: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    let previousTotal = 0;
    previousTrends.forEach(trend => {
      switch (type) {
        case 'points':
          previousTotal += trend.pointsUsed;
          break;
        case 'money':
          previousTotal += parseFloat(trend.moneyUsed?.toString() || '0');
          break;
        case 'tokens':
          previousTotal += trend.tokensUsed;
          break;
      }
    });

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
  trends: any[],
  startDate: Date,
  endDate: Date
) {
  const filledData = [];
  const trendMap = new Map();

  // 创建日期到趋势的映射
  trends.forEach(trend => {
    const dateStr = trend.date.toISOString().split('T')[0];
    trendMap.set(dateStr, trend);
  });

  // 填充所有日期
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const existingTrend = trendMap.get(dateStr);

    if (existingTrend) {
      filledData.push(existingTrend);
    } else {
      // 创建空数据
      filledData.push({
        date: new Date(currentDate),
        pointsUsed: 0,
        moneyUsed: 0,
        tokensUsed: 0
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}