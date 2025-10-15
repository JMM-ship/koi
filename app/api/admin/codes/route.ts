import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { PaginatedResponse, RedemptionCode } from "@/app/types/admin";

// GET /api/admin/codes - list codes
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const codeType = searchParams.get('code_type') || undefined;
    const batchId = searchParams.get('batch_id') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (codeType) where.codeType = codeType;
    if (batchId) where.batchId = batchId;
    if (search) where.code = { contains: search };

    const skip = (page - 1) * limit;
    const [codes, total] = await Promise.all([
      (prisma as any).redemptionCode.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      (prisma as any).redemptionCode.count({ where }),
    ]);

    const response: PaginatedResponse<RedemptionCode> = {
      success: true,
      data: codes as RedemptionCode[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch codes', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
});
