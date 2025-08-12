import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { useCredits } from '@/app/service/creditManager';

// POST /api/credits/use - 使用积分
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    
    const userUuid = session.user.id;
    
    // 解析请求体
    const body = await request.json();
    const { amount, service, metadata } = body;
    
    // 验证参数
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Valid amount is required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Service type is required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // 使用积分
    const result = await useCredits(userUuid, amount, service, metadata);
    
    if (!result.success) {
      // 根据错误类型返回不同的状态码
      const statusCode = result.error === 'Insufficient credits' ? 400 : 500;
      const errorCode = result.error === 'Insufficient credits' ? 'INSUFFICIENT_CREDITS' : 'USE_CREDITS_FAILED';
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: result.error || 'Failed to use credits',
          },
          timestamp: new Date().toISOString(),
        },
        { status: statusCode }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        transaction: result.transaction,
        balance: result.balance,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error using credits:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to use credits',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}