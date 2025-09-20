import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { UserListQuery, PaginatedResponse, AdminUser } from "@/app/types/admin";

/**
 * GET /api/admin/users
 * 获取用户列表（管理员专用）
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    // 解析查询参数
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const planType = searchParams.get('plan_type') || undefined;
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { uuid: { contains: search } },
        { nickname: { contains: search } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (planType) {
      where.planType = planType;
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询用户列表
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sort]: order,
        },
        select: {
          id: true,
          uuid: true,
          email: true,
          nickname: true,
          avatarUrl: true,
          role: true,
          status: true,
          planType: true,
          planExpiredAt: true,
          totalCredits: true,
          createdAt: true,
          updatedAt: true,
          signinProvider: true,
          inviteCode: true,
          invitedBy: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // 转换用户数据类型
    const adminUsers: AdminUser[] = users.map(user => ({
      id: user.id,
      uuid: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      password: '', // 不返回密码
      locale: null,
      signinType: null,
      signinIp: null,
      signinProvider: user.signinProvider,
      signinOpenid: null,
      inviteCode: user.inviteCode,
      invitedBy: user.invitedBy,
      isAffiliate: false,
      role: user.role as 'user' | 'admin',
      status: user.status as 'active' | 'suspended' | 'deleted',
      planType: user.planType as 'free' | 'basic' | 'pro' | 'enterprise',
      planExpiredAt: user.planExpiredAt,
      totalCredits: user.totalCredits,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    // 构建响应
    const response: PaginatedResponse<AdminUser> = {
      success: true,
      data: adminUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});