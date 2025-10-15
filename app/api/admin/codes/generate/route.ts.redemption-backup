import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { CodeGenerateRequest, SuccessResponse } from "@/app/types/admin";
import { 
  generateRedemptionCode, 
  generateBatchId, 
  calculateExpiryDate 
} from "@/app/lib/admin/utils";

/**
 * POST /api/admin/codes/generate
 * 批量生成卡密
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body: CodeGenerateRequest = await req.json();

    // 验证请求数据
    if (!body.codeType || !body.codeValue || !body.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: codeType, codeValue, quantity',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 验证数量限制（1-1000）
    if (body.quantity < 1 || body.quantity > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity must be between 1 and 1000',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 套餐类型卡密必须设置有效天数
    if (body.codeType === 'plan' && !body.validDays) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid days is required for plan type codes',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    // 生成批次ID
    const batchId = generateBatchId();

    // 生成卡密列表
    const codes: string[] = [];
    const codeRecords: any[] = [];
    const prefix = body.prefix || 'KOI';

    // 生成不重复的卡密
    const existingCodes = new Set<string>();
    let attempts = 0;
    const maxAttempts = body.quantity * 10; // 最多尝试10倍数量

    while (codes.length < body.quantity && attempts < maxAttempts) {
      attempts++;
      const code = generateRedemptionCode(prefix);
      
      if (!existingCodes.has(code)) {
        // 检查数据库中是否已存在
        const exists = await prisma.redemptionCode.findUnique({
          where: { code },
        });
        
        if (!exists) {
          codes.push(code);
          existingCodes.add(code);
          
          // 准备数据库记录
          codeRecords.push({
            code,
            codeType: body.codeType,
            codeValue: String(body.codeValue),
            validDays: body.validDays || 30,
            status: 'active',
            batchId,
            notes: body.notes || null,
            expiresAt: body.codeType === 'credits' 
              ? calculateExpiryDate(365) // 积分卡默认1年有效期
              : null,
          });
        }
      }
    }

    // 如果无法生成足够的卡密
    if (codes.length < body.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate enough unique codes. Please try again.',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }

    // 批量插入到数据库
    await prisma.redemptionCode.createMany({
      data: codeRecords,
    });

    const response: SuccessResponse = {
      success: true,
      data: {
        batchId,
        codes,
        count: codes.length,
      },
      message: `Successfully generated ${codes.length} redemption codes`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate codes',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});