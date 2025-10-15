import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { PaginatedResponse, RedemptionCode } from "@/app/types/admin";

/**
 * GET /api/admin/codes
 * 获取卡密列表
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    // 解析查询参数
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const codeType = searchParams.get('code_type') || undefined;
    const batchId = searchParams.get('batch_id') || undefined;
    const search = searchParams.get('search') || undefined;

    // 构建查询条件
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (codeType) {
      where.codeType = codeType;
    }
    
    if (batchId) {
      where.batchId = batchId;
    }
    
    if (search) {
      where.code = { contains: search };
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询卡密列表
    const [codes, total] = await Promise.all([
      prisma.redemptionCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.redemptionCode.count({ where }),
    ]);

    // 构建响应
    const response: PaginatedResponse<RedemptionCode> = {
      success: true,
      data: codes as RedemptionCode[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch codes',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});