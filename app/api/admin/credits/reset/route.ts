import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { resetAllPackageCredits, resetUserPackageCredits } from '@/app/service/creditResetService';
import { checkAndResetUserCredits } from '@/app/service/cronJobs';

// POST /api/admin/credits/reset - 手动触发积分重置
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
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

    // 检查是否为管理员
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { userUuid, resetAll = false } = body;

    // 如果指定了用户UUID，只重置该用户
    if (userUuid && !resetAll) {
      const result = await resetUserPackageCredits(userUuid);
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RESET_FAILED',
              message: result.error || 'Failed to reset user credits',
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          userUuid: result.userUuid,
          dailyCredits: result.dailyCredits,
          message: 'User credits reset successfully',
        },
      });
    }

    // 重置所有用户的积分
    if (resetAll) {
      const summary = await resetAllPackageCredits();
      
      return NextResponse.json({
        success: true,
        data: {
          summary,
          message: `Reset completed: ${summary.successCount}/${summary.totalUsers} users processed`,
        },
      });
    }

    // 参数错误
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'Please specify userUuid or set resetAll to true',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in credit reset API:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to reset credits',
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/credits/reset - 获取重置状态
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
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

    // 检查是否为管理员
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const userUuid = searchParams.get('userUuid');

    if (userUuid) {
      // 检查特定用户是否需要重置
      const { shouldResetCredits } = await import('@/app/service/creditResetService');
      const needsReset = await shouldResetCredits(userUuid);
      
      const { getLastResetTime } = await import('@/app/service/creditResetService');
      const lastResetTime = await getLastResetTime(userUuid);

      return NextResponse.json({
        success: true,
        data: {
          userUuid,
          needsReset,
          lastResetTime: lastResetTime?.toISOString() || null,
        },
      });
    }

    // 获取今日重置统计
    const { getTodayResetCount } = await import('@/app/service/creditResetService');
    const todayResetCount = await getTodayResetCount();

    return NextResponse.json({
      success: true,
      data: {
        todayResetCount,
        lastCheckTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting reset status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get reset status',
        },
      },
      { status: 500 }
    );
  }
}