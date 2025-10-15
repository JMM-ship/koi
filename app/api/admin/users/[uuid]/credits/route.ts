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

    // 查询用户和钱包信息
    const user = await prisma.user.findUnique({
      where: { id: uuid },  // 使用id而不是uuid
      include: {
        wallets: true,  // 包含钱包信息
      },
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

    // 获取或创建钱包
    let wallet = user.wallets;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: uuid,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(0),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });
    }

    // 获取当前独立积分余额
    const currentBalance = Number(wallet.independentTokens);

    // 计算新的积分余额
    let newBalance: number;
    let creditChange: number;

    switch (body.action) {
      case 'add':
        newBalance = currentBalance + body.amount;
        creditChange = body.amount;
        break;
      case 'subtract':
        newBalance = Math.max(0, currentBalance - body.amount);
        creditChange = -body.amount;
        break;
      case 'set':
        newBalance = Math.max(0, body.amount);
        creditChange = newBalance - currentBalance;
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

    // 使用事务更新钱包积分和创建积分记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新钱包中的独立积分
      const updatedWallet = await tx.wallet.update({
        where: { userId: uuid },
        data: {
          independentTokens: BigInt(newBalance),
        },
      });

      // 创建积分交易记录
      const transNo = `ADM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: uuid,
          type: creditChange > 0 ? 'income' : 'expense',
          bucket: 'independent',  // 管理员调整的是独立积分
          tokens: Math.abs(creditChange),
          points: Math.abs(creditChange),
          beforeIndependentTokens: BigInt(currentBalance),
          afterIndependentTokens: BigInt(newBalance),
          reason: `管理员调整: ${body.reason}`,
          meta: {
            action: body.action,
            amount: body.amount,
            adminAction: true,
            reason: body.reason,
          },
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });

    // 构建响应数据
    const response: SuccessResponse<{
      userId: string;
      action: string;
      amount: number;
      previousBalance: number;
      newBalance: number;
      transactionId: string;
    }> = {
      success: true,
      data: {
        userId: uuid,
        action: body.action,
        amount: body.amount,
        previousBalance: currentBalance,
        newBalance,
        transactionId: result.transaction.id,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error adjusting user credits:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to adjust user credits',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});