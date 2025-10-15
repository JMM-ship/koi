import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserActivePackage } from '@/app/models/userPackage';
import { getCreditBalance } from '@/app/models/creditBalance';

// GET /api/packages/active - 获取用户当前套餐
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
    
    // 获取用户当前套餐
    const userPackage = await getUserActivePackage(userUuid);
    
    // 获取积分余额
    const creditBalance = await getCreditBalance(userUuid);
    
    // 计算剩余天数
    let remainingDays = 0;
    if (userPackage) {
      const endDate = new Date(userPackage.end_date);
      const now = new Date();
      remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      remainingDays = Math.max(0, remainingDays);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        userPackage: userPackage ? {
          id: userPackage.id,
          packageId: userPackage.package_id,
          packageName: userPackage.package_snapshot?.name || 'Unknown Package',
          startDate: userPackage.start_date,
          endDate: userPackage.end_date,
          dailyCredits: userPackage.daily_credits,
          remainingDays: remainingDays,
          isAutoRenew: userPackage.is_auto_renew,
          packageSnapshot: userPackage.package_snapshot,
        } : null,
        creditBalance: creditBalance ? {
          packageCredits: creditBalance.package_credits,
          independentCredits: creditBalance.independent_credits,
          totalAvailable: creditBalance.package_credits + creditBalance.independent_credits,
        } : {
          packageCredits: 0,
          independentCredits: 0,
          totalAvailable: 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting active package:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get active package',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}