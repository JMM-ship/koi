import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserCreditInfo } from '@/app/service/creditManager';

// GET /api/credits/balance - 获取积分余额
export async function GET(request: NextRequest) {
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
    
    // 获取用户积分信息
    const creditInfo = await getUserCreditInfo(userUuid);
    
    if (!creditInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User credit information not found',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        balance: creditInfo.balance,
        usage: creditInfo.usage,
        package: creditInfo.package,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get credit balance',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}