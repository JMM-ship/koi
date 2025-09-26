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
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { id: { contains: search } },  // 搜索id而不是uuid
        { nickname: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询用户列表（包含钱包信息）
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sort]: order,
        },
        include: {
          wallets: true,  // 包含钱包信息以获取积分
          userPackages: {
            where: { isActive: true },
            include: {
              package: true,
            },
            take: 1,  // 只取当前激活的套餐
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // 转换用户数据类型
    const adminUsers: AdminUser[] = users.map(user => {
      // 计算总积分
      const totalCredits = user.wallets
        ? Number(user.wallets.packageTokensRemaining) + Number(user.wallets.independentTokens)
        : 0;

      // 获取当前套餐信息
      const activePackage = user.userPackages[0];
      const planType = activePackage?.package?.planType || 'free';
      const planExpiredAt = activePackage?.endAt || null;

      return {
        id: user.id,
        uuid: user.id,  // 兼容旧代码，uuid就是id
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        password: '',  // 不返回密码
        locale: user.locale,
        signinType: null,  // 新架构中已移除
        signinIp: null,  // 新架构中已移除
        signinProvider: null,  // 新架构中已移除
        signinOpenid: null,  // 新架构中已移除
        inviteCode: user.inviteCode || null,  // 确保inviteCode字段存在
        invitedBy: user.invitedBy || "",  // 从数据库获取，如果为空则使用空字符串
        isAffiliate: false,  // 新架构中已移除
        role: user.role as 'user' | 'admin',
        status: user.status as 'active' | 'suspended' | 'deleted',
        planType: planType as 'free' | 'basic' | 'pro' | 'enterprise',
        planExpiredAt,
        totalCredits,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

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

/**
 * POST /api/admin/users
 * 创建新用户（管理员专用）
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // 验证必需字段
    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
          code: 'DUPLICATE',
        },
        { status: 400 }
      );
    }

    // 创建新用户
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        nickname: body.nickname || body.email.split('@')[0],
        avatarUrl: body.avatarUrl,
        role: body.role || 'user',
        status: body.status || 'active',
        locale: body.locale,
      },
    });

    // 创建钱包
    const initialCredits = body.totalCredits || 0;
    await prisma.wallet.create({
      data: {
        userId: newUser.id,
        packageDailyQuotaTokens: BigInt(0),
        packageTokensRemaining: BigInt(0),
        independentTokens: BigInt(initialCredits),
        lockedTokens: BigInt(0),
        version: 0,
      },
    });

    // 如果指定了套餐，创建用户套餐
    if (body.planType && body.planType !== 'free') {
      const package_ = await prisma.package.findFirst({
        where: {
          planType: body.planType,
          isActive: true,
        },
      });

      if (package_) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (package_.validDays || 30));

        await prisma.userPackage.create({
          data: {
            userId: newUser.id,
            packageId: package_.id,
            startAt: now,
            endAt: endDate,
            dailyPoints: package_.dailyPoints,
            dailyQuotaTokens: BigInt(package_.dailyPoints),
            isActive: true,
            packageSnapshot: package_ as any,
          },
        });

        // 更新钱包的套餐积分
        await prisma.wallet.update({
          where: { userId: newUser.id },
          data: {
            packageDailyQuotaTokens: BigInt(package_.dailyPoints),
            packageTokensRemaining: BigInt(package_.dailyPoints),
            packageResetAt: now,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        message: 'User created successfully',
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});