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
        nameEn: true,
        description: true,
        price: true,
        originalPrice: true,
        currency: true,
        dailyCredits: true, // 对于积分套餐，这个字段存储总积分数
        features: true,
        tag: true,
        isRecommended: true,
      },
    });

    // 转换数据格式，使前端更容易使用
    const packages = creditPackages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      nameEn: pkg.nameEn,
      description: pkg.description,
      credits: pkg.dailyCredits, // 重命名为更直观的字段
      price: pkg.price,
      originalPrice: pkg.originalPrice,
      currency: pkg.currency,
      popular: pkg.isRecommended,
      tag: pkg.tag,
      features: pkg.features,
      // 计算优惠百分比
      savings: pkg.originalPrice 
        ? `Save ${Math.round((1 - pkg.price / pkg.originalPrice) * 100)}%`
        : null,
    }));

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