import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getMockAuth } from '@/lib/auth-mock';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { modelName, usageType, credits, metadata } = body;

    // 创建模型使用记录
    const modelUsage = await prisma.modelUsage.create({
      data: {
        userId: user.id,
        modelName,
        usageType,
        credits,
        metadata,
        status: 'completed'
      }
    });

    // 更新今日消费趋势
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingTrend = await prisma.consumptionTrend.findFirst({
      where: {
        userId: user.id,
        date: today
      }
    });

    if (existingTrend) {
      await prisma.consumptionTrend.update({
        where: {
          id: existingTrend.id
        },
        data: {
          pointsUsed: {
            increment: credits
          }
        }
      });
    } else {
      await prisma.consumptionTrend.create({
        data: {
          userId: user.id,
          date: today,
          pointsUsed: credits
        }
      });
    }

    return NextResponse.json({ success: true, modelUsage });
  } catch (error) {
    console.error('Error recording model usage:', error);
    return NextResponse.json(
      { error: 'Failed to record model usage' },
      { status: 500 }
    );
  }
}

// 获取模型使用历史
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const modelUsages = await prisma.modelUsage.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.modelUsage.count({
      where: {
        userId: user.id
      }
    });

    return NextResponse.json({
      data: modelUsages,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching model usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model usage' },
      { status: 500 }
    );
  }
}