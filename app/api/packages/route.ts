import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { getActivePackages, getPackageById } from '@/app/models/package';
import { getPackagesWithUserStatus } from '@/app/service/packageManager';

// GET /api/packages - 获取套餐列表
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active') === 'true';
    const currency = searchParams.get('currency') || 'CNY';
    
    // 获取用户会话（可选）
    const session = await getServerSession(authOptions);
    const userUuid = session?.user?.uuid;
    
    // 获取套餐列表
    let result;
    if (userUuid) {
      // 如果有用户登录，返回带用户状态的套餐列表
      result = await getPackagesWithUserStatus(userUuid);
    } else {
      // 未登录用户，只返回套餐列表
      const packages = await getActivePackages();
      result = {
        packages: packages.filter(pkg => !active || pkg.is_active),
        currentPackage: null,
      };
    }
    
    // 根据货币过滤（如果需要）
    if (currency !== 'CNY') {
      // TODO: 实现多币种支持
      result.packages = result.packages.map(pkg => ({
        ...pkg,
        currency: currency,
        // 这里可以添加汇率转换逻辑
      }));
    }
    console.log(result,"结果");
    
    return NextResponse.json({
      success: true,
      data: {
        packages: result.packages,
        currentPackage: result.currentPackage,
        total: result.packages.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting packages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get packages',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}