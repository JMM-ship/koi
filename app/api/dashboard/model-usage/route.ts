import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getMockAuth } from '@/lib/auth-mock';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
    const { modelName, usageType, credits, tokens = 0, metadata } = body;

    // 获取用户ID
    const userId = user.uuid;

    // 创建使用记录
    const usageRecord = await prisma.usageRecord.create({
      data: {
        requestId: uuidv4(),
        userId: userId,
        provider: metadata?.provider || 'openai',
        model: modelName,
        promptTokens: tokens,
        completionTokens: 0,
        totalTokens: tokens,
        tokensCharged: tokens,
        pointsCharged: credits,
        bucketPackageTokens: 0,
        bucketIndependentTokens: tokens,
        status: 'completed',
        meta: metadata || {},
      }
    });

    // 创建积分交易记录
    await prisma.creditTransaction.create({
      data: {
        userId: userId,
        type: 'expense',
        bucket: 'independent',
        tokens: tokens,
        points: credits,
        beforePackageTokens: BigInt(0),
        afterPackageTokens: BigInt(0),
        beforeIndependentTokens: BigInt(0),
        afterIndependentTokens: BigInt(0),
        reason: `${modelName} usage`,
        meta: {
          modelName,
          usageType,
          ...metadata
        }
      }
    });

    return NextResponse.json({ success: true, usageRecord });
  } catch (error) {
    console.error('Error recording model usage:', error);
    return NextResponse.json(
      { error: 'Failed to record model usage' },
      { status: 500 }
    );
  }
}

// ⚙️ 添加这个工具函数在文件顶部
function safeJson(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

// 获取模型使用历史
export async function GET(request: Request) {
  try {
    // 尝试获取真实用户，如果失败则使用模拟用户（仅用于开发）
    let user = await getAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 获取用户ID
    const userId = user.uuid;

<<<<<<< HEAD
    const expenseTypes = ['expense', 'use'];

    const whereClause = {
      userId,
      type: {
        in: expenseTypes,
      },
    };

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.creditTransaction.count({
        where: whereClause,
      }),
    ]);

    const formattedData = transactions.map((transaction) => {
      const rawMeta = (transaction.meta || {}) as Record<string, any>;
      const displayName = typeof rawMeta.modelName === 'string'
        ? rawMeta.modelName
        : typeof rawMeta.service === 'string'
        ? rawMeta.service
        : transaction.reason || 'Credits Usage';

      const usageType = typeof rawMeta.usageType === 'string'
        ? rawMeta.usageType
        : transaction.bucket;

      return {
        id: transaction.id,
        userId: transaction.userId,
        modelName: displayName,
        usageType,
        credits: transaction.points,
        metadata: transaction.meta,
        status: 'completed',
        bucket: transaction.bucket,
        reason: transaction.reason,
        timestamp: transaction.createdAt,
      };
    });
=======
    const expenseTypes = ['expense', 'use'];

    const whereClause = {
      userId,
      type: {
        in: expenseTypes,
      },
    };

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.creditTransaction.count({
        where: whereClause,
      }),
    ]);

    const formattedData = transactions.map((transaction) => {
      const rawMeta = (transaction.meta || {}) as Record<string, any>;
      const displayName = typeof rawMeta.modelName === 'string'
        ? rawMeta.modelName
        : typeof rawMeta.service === 'string'
        ? rawMeta.service
        : transaction.reason || 'Credits Usage';

      const usageType = typeof rawMeta.usageType === 'string'
        ? rawMeta.usageType
        : transaction.bucket;

      return {
        id: transaction.id,
        userId: transaction.userId,
        modelName: displayName,
        usageType,
        credits: transaction.points,
        metadata: transaction.meta,
        status: 'completed',
        bucket: transaction.bucket,
        reason: transaction.reason,
        timestamp: transaction.createdAt,
      };
    });
>>>>>>> feat/observability-sentry-init

    return NextResponse.json({
      data: formattedData,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.log('error这个错了', error);
    
    console.error('Error fetching model usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model usage' },
      { status: 500 }
    );
  }
}
