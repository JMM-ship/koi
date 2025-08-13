import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { AdminStats, SuccessResponse } from "@/app/types/admin";

/**
 * GET /api/admin/stats
 * 获取管理员仪表板统计数据
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    // 获取当前时间
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 查询用户统计
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
    ]);

    // 查询订单统计
    const [
      totalOrders,
      pendingOrders,
      paidOrdersStats,
      todayRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'paid',
          paidAt: { gte: today },
        },
        _sum: { amount: true },
      }),
    ]);

    // 查询卡密统计
    const [
      totalGenerated,
      totalUsed,
      activeCount,
      expiredCount,
    ] = await Promise.all([
      prisma.redemptionCode.count(),
      prisma.redemptionCode.count({ where: { status: 'used' } }),
      prisma.redemptionCode.count({ where: { status: 'active' } }),
      prisma.redemptionCode.count({ where: { status: 'expired' } }),
    ]);

    // 查询积分统计
    const [creditIssued, creditConsumed] = await Promise.all([
      prisma.credit.aggregate({
        where: {
          transType: { in: ['admin_add', 'new_user', 'purchase'] },
        },
        _sum: { credits: true },
      }),
      prisma.credit.aggregate({
        where: {
          transType: { in: ['admin_deduct', 'usage', 'expired'] },
        },
        _sum: { credits: true },
      }),
    ]);

    // 构建统计数据
    const stats: AdminStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
      },
      orders: {
        total: totalOrders,
        totalRevenue: paidOrdersStats._sum.amount || 0,
        todayRevenue: todayRevenue._sum.amount || 0,
        pending: pendingOrders,
      },
      codes: {
        totalGenerated,
        totalUsed,
        active: activeCount,
        expired: expiredCount,
      },
      credits: {
        totalIssued: creditIssued._sum.credits || 0,
        totalConsumed: creditConsumed._sum.credits || 0,
      },
    };

    const response: SuccessResponse<AdminStats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});