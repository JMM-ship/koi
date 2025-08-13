import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { UserDetail, SuccessResponse } from "@/app/types/admin";

/**
 * GET /api/admin/users/[uuid]
 * 获取用户详情
 */
export const GET = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: { uuid: string } }
) => {
  try {
    const { uuid } = params;

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { uuid },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 查询统计信息
    const [totalOrders, totalApiKeys] = await Promise.all([
      prisma.order.count({
        where: { userUuid: uuid },
      }),
      prisma.apiKey.count({
        where: { userUuid: uuid },
      }),
    ]);

    // 查询最后活跃时间（基于最近的订单或API密钥创建时间）
    const lastOrder = await prisma.order.findFirst({
      where: { userUuid: uuid },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const userDetail: UserDetail = {
      ...user,
      stats: {
        totalOrders,
        totalApiCalls: totalApiKeys, // 用API密钥数量代替
        lastActiveAt: lastOrder?.createdAt || null,
      },
    };

    const response: SuccessResponse<UserDetail> = {
      success: true,
      data: userDetail,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user detail',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/users/[uuid]
 * 更新用户信息
 */
export const PUT = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: { uuid: string } }
) => {
  try {
    const { uuid } = params;
    const body = await req.json();

    // 验证请求数据
    const allowedFields = ['status', 'planType', 'planExpiredAt', 'role', 'nickname'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 如果设置了套餐到期时间，确保是有效的日期
    if (updateData.planExpiredAt) {
      updateData.planExpiredAt = new Date(updateData.planExpiredAt);
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { uuid },
      data: updateData,
    });

    const response: SuccessResponse = {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating user:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});