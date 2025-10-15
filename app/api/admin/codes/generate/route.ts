import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { CodeGenerateRequest, SuccessResponse } from "@/app/types/admin";
import { generateRedemptionCode, generateBatchId } from "@/app/lib/admin/utils";

// POST /api/admin/codes/generate - batch generate codes
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body: CodeGenerateRequest = await req.json();

    if (!body.codeType || !body.codeValue || !body.quantity) {
      return NextResponse.json({ success: false, error: 'Missing required fields', code: 'BAD_REQUEST' }, { status: 400 })
    }

    if (body.quantity < 1 || body.quantity > 1000) {
      return NextResponse.json({ success: false, error: 'Quantity must be between 1 and 1000', code: 'BAD_REQUEST' }, { status: 400 })
    }

    if (body.codeType === 'plan' && (!body.validDays || Number(body.validDays) <= 0)) {
      return NextResponse.json({ success: false, error: 'Valid days is required for plan type codes', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const batchId = generateBatchId();
    const prefix = (body.prefix || 'KOI').toUpperCase();
    const codeType = body.codeType;
    const codeValue = String(body.codeValue);
    const validDays = Number(body.validDays || 0);

    const codes: string[] = [];
    const existing = new Set<string>();
    let attempts = 0;
    while (codes.length < body.quantity && attempts < body.quantity * 20) {
      attempts++;
      const code = generateRedemptionCode(prefix, 16).toUpperCase();
      if (existing.has(code)) continue;
      try {
        await (prisma as any).redemptionCode.create({
          data: {
            code,
            codeType,
            codeValue,
            validDays: validDays > 0 ? validDays : 0,
            status: 'active',
            batchId,
            // No expiry by business decision
            expiresAt: null,
            notes: body.notes || null,
          }
        })
        existing.add(code);
        codes.push(code);
      } catch (e: any) {
        // unique conflict -> retry
        continue;
      }
    }

    if (codes.length === 0) {
      return NextResponse.json({ success: false, error: 'Failed to generate codes', code: 'INTERNAL_ERROR' }, { status: 500 })
    }

    const response: SuccessResponse = {
      success: true,
      data: { batchId, codes, count: codes.length },
      message: `Successfully generated ${codes.length} codes`,
    }
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate codes', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
});

