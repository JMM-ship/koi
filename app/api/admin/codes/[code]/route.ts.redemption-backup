import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { SuccessResponse } from "@/app/types/admin";

/**
 * PUT /api/admin/codes/[code]
 * 更新卡密状态
 */
export const PUT = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: { code: string } }
) => {
  try {
    const { code } = params;
    const body = await req.json();

    // 验证请求数据
    if (!body.status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 只允许更改为 active 或 cancelled
    if (!['active', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Only active or cancelled are allowed',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 查询卡密当前状态
    const existingCode = await prisma.redemptionCode.findUnique({
      where: { code },
    });

    if (!existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Code not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 已使用的卡密不能修改状态
    if (existingCode.status === 'used') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot modify used codes',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 更新卡密状态
    const updatedCode = await prisma.redemptionCode.update({
      where: { code },
      data: {
        status: body.status,
        notes: body.notes || existingCode.notes,
      },
    });

    const response: SuccessResponse = {
      success: true,
      data: updatedCode,
      message: `Code status updated to ${body.status}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update code',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});