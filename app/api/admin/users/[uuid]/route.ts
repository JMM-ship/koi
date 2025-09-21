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

    // 查询用户信息（包含钱包信息）
    const user = await prisma.user.findUnique({
      where: { id: uuid },  // 使用id而不是uuid
      include: {
        wallets: true,  // 包含钱包信息
      }
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
        where: { userId: uuid },  // 使用userId而不是userUuid
      }),
      prisma.apiKey.count({
        where: { ownerUserId: uuid },  // 使用ownerUserId而不是userUuid
      }),
    ]);

    // 查询最后活跃时间（基于最近的订单创建时间）
    const lastOrder = await prisma.order.findFirst({
      where: { userId: uuid },  // 使用userId
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // 获取积分余额
    const totalCredits = user.wallets
      ? Number(user.wallets.packageTokensRemaining) + Number(user.wallets.independentTokens)
      : 0;

    // 构建用户详情对象，兼容旧的UserDetail类型
    const userDetail = {
      id: user.id,
      uuid: user.id,  // 兼容旧代码，uuid就是id
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      password: null,  // 新架构中不存储密码
      status: user.status,
      planType: 'free',  // 套餐信息需要从userPackages表查询
      planExpiredAt: null,  // 需要从userPackages表查询
      totalCredits,  // 从钱包计算得出
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      locale: user.locale,
      signinType: null,  // 新架构中已移除
      signinIp: null,  // 新架构中已移除
      signinProvider: null,  // 新架构中已移除
      signinOpenid: null,  // 新架构中已移除
      inviteCode: null,  // 新架构中已移除
      invitedBy: null,  // 新架构中已移除
      isAffiliate: false,  // 新架构中已移除
      stats: {
        totalOrders,
        totalApiCalls: totalApiKeys,
        lastActiveAt: lastOrder?.createdAt || null,
      },
    } as UserDetail;

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

    // 查询用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: uuid },  // 使用id
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 准备更新数据（只更新支持的字段）
    const updateData: any = {};

    if (body.nickname !== undefined) updateData.nickname = body.nickname;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.locale !== undefined) updateData.locale = body.locale;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: uuid },  // 使用id
      data: updateData,
    });

    // 如果需要更新积分，需要更新钱包
    if (body.totalCredits !== undefined) {
      await prisma.wallet.upsert({
        where: { userId: uuid },
        update: {
          independentTokens: BigInt(body.totalCredits),
        },
        create: {
          userId: uuid,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(body.totalCredits),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });
    }

    const response: SuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'User updated successfully' },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
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

/**
 * DELETE /api/admin/users/[uuid]
 * 删除用户
 */
export const DELETE = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: { uuid: string } }
) => {
  try {
    const { uuid } = params;

    // 查询用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: uuid },  // 使用id
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 使用事务删除用户及相关数据
    await prisma.$transaction(async (tx) => {
      // 删除钱包
      await tx.wallet.deleteMany({
        where: { userId: uuid },
      });

      // 删除API密钥
      await tx.apiKey.deleteMany({
        where: { ownerUserId: uuid },
      });

      // 删除用户套餐
      await tx.userPackage.deleteMany({
        where: { userId: uuid },
      });

      // 删除积分交易记录
      await tx.creditTransaction.deleteMany({
        where: { userId: uuid },
      });

      // 最后删除用户
      await tx.user.delete({
        where: { id: uuid },
      });
    });

    const response: SuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'User deleted successfully' },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});