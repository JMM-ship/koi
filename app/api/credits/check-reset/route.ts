import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { checkAndResetUserCredits } from '@/annotation/service/cronJobs';
import { getUserCreditInfo } from '@/annotation/service/creditManager';

// GET /api/credits/check-reset - 检查并重置当前用户的积分
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.uuid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const userUuid = session.user.uuid;

    // 检查并重置积分（如果需要）
    const wasReset = await checkAndResetUserCredits(userUuid);

    // 获取最新的积分信息
    const creditInfo = await getUserCreditInfo(userUuid);

    if (!creditInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User credit information not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        wasReset,
        creditInfo: {
          balance: creditInfo.balance,
          usage: creditInfo.usage,
          package: creditInfo.package,
        },
        message: wasReset ? 'Credits have been reset for today' : 'Credits are up to date',
      },
    });
  } catch (error) {
    console.error('Error checking/resetting credits:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to check/reset credits',
        },
      },
      { status: 500 }
    );
  }
}