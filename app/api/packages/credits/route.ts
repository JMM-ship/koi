import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/models/db';

// GET /api/packages/credits - 获取积分套餐列表
export async function GET(request: NextRequest) {
  try {
    // 获取所有激活的积分套餐
    const creditPackages = await prisma.package.findMany({
      where: {
        planType: 'credits',
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        dailyPoints: true, // 对于积分套餐，这个字段存储总积分数
        features: true,
        sortOrder: true,
      },
    });

    // 转换数据格式，使前端更容易使用
    const packages = creditPackages.map(pkg => {
      // 从features中提取tag和isRecommended等信息
      const features = typeof pkg.features === 'object' && pkg.features !== null
        ? pkg.features as any
        : {};

      // 计算价格（分转元）
      const price = pkg.priceCents / 100;
      const originalPrice = features.originalPrice || null;

      return {
        id: pkg.id,
        name: pkg.name,
        nameEn: features.nameEn || pkg.name, // 如果有英文名则使用，否则用默认名
        description: pkg.description,
        credits: pkg.dailyPoints, // 重命名为更直观的字段
        price: price,
        originalPrice: originalPrice,
        currency: pkg.currency,
        popular: features.isRecommended || false,
        tag: features.tag || null,
        features: features.list || [],
        // 计算优惠百分比
        savings: originalPrice && originalPrice > price
          ? `Save ${Math.round((1 - price / originalPrice) * 100)}%`
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        packages,
        count: packages.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch credit packages',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}