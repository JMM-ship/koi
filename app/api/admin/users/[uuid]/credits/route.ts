import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { CreditAdjustRequest, SuccessResponse } from "@/app/types/admin";
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/admin/users/[uuid]/credits
 * 调整用户积分
 */
export const POST = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: { uuid: string } }
) => {
  try {
    const { uuid } = params;
    const body: CreditAdjustRequest = await req.json();

    // 验证请求数据
    if (!body.action || !body.amount || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action, amount, reason',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 查询用户当前积分
    const user = await prisma.user.findUnique({
      where: { uuid },
      select: { totalCredits: true },
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

    // 计算新的积分余额
    let newBalance: number;
    let creditChange: number;

    switch (body.action) {
      case 'add':
        newBalance = user.totalCredits + body.amount;
        creditChange = body.amount;
        break;
      case 'subtract':
        newBalance = Math.max(0, user.totalCredits - body.amount);
        creditChange = -body.amount;
        break;
      case 'set':
        newBalance = Math.max(0, body.amount);
        creditChange = newBalance - user.totalCredits;
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: add, subtract, or set',
            code: 'BAD_REQUEST',
          },
          { status: 400 }
        );
    }

    // 使用事务更新用户积分和创建积分记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户总积分
      const updatedUser = await tx.user.update({
        where: { uuid },
        data: { totalCredits: newBalance },
      });

      // 创建积分交易记录
      const creditRecord = await tx.credit.create({
        data: {
          transNo: `ADMIN-${uuidv4()}`,
          userUuid: uuid,
          transType: creditChange > 0 ? 'admin_add' : 'admin_deduct',
          credits: Math.abs(creditChange),
          expiredAt: body.expiredAt ? new Date(body.expiredAt) : null,
        },
      });

      return {
        user: updatedUser,
        transaction: creditRecord,
      };
    });

    const response: SuccessResponse = {
      success: true,
      data: {
        userUuid: uuid,
        newBalance: newBalance,
        transactionId: result.transaction.transNo,
      },
      message: `Credits ${body.action}ed successfully. Reason: ${body.reason}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adjusting credits:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to adjust credits',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});