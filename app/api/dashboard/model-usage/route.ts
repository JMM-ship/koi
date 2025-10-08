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

    // 先查询该用户的所有API密钥
    const userApiKeys = await prisma.apiKey.findMany({
      where: {
        ownerUserId: userId
      },
      select: {
        id: true
      }
    });

    const apiKeyIds = userApiKeys.map(key => key.id);

    // 如果用户没有API密钥,返回空数据
    if (apiKeyIds.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        limit,
        offset
      });
    }

    // 先查询所有granularity的数据，看看有什么
    const allAggregates = await prisma.usageAggregate.findMany({
      where: {
        apiKeyId: {
          in: apiKeyIds
        }
      },
      take: 5
    });

    // 查询usage_aggregates表,只获取granularity为'h'的数据
    const usageAggregates = await prisma.usageAggregate.findMany({
      where: {
        apiKeyId: {
          in: apiKeyIds
        },
        granularity: 'h'
      },
      orderBy: {
        bucketAt: 'desc'  // 按时间降序排序
      },
      take: limit,
      skip: offset
    });

    // 统计总数
    const total = await prisma.usageAggregate.count({
      where: {
        apiKeyId: {
          in: apiKeyIds
        },
        granularity: 'h'
      }
    });
    
    // 格式化数据以兼容前端
    const formattedData = usageAggregates.map(record => ({
      id: `${record.apiKeyId}-${record.model}-${record.bucketAt.getTime()}`,
      apiKeyId: record.apiKeyId,
      accountId: record.accountId,
      model: record.model,
      granularity: record.granularity,
      timestamp: record.bucketAt,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      cacheTokens: record.cacheTokens,
      allTokens: record.allTokens,
      requests: record.requests
    }));
    console.log('allAggregates', formattedData);

    // ✅ 转换 BigInt
    const safeData = safeJson(formattedData);

    return NextResponse.json({
      data: safeData,
      total,
      limit,
      offset
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