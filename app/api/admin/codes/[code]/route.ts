import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin/middleware";
import { prisma } from "@/app/models/db";
import { SuccessResponse } from "@/app/types/admin";

// PUT /api/admin/codes/[code] - update status (active|cancelled)
export const PUT = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: { code: string } }
) => {
  try {
    const { code } = params;
    const body = await req.json();
    const status = body?.status
    if (!status || !['active', 'cancelled'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const existing = await (prisma as any).redemptionCode.findUnique({ where: { code: code.toUpperCase() } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Code not found', code: 'NOT_FOUND' }, { status: 404 })
    }
    if (existing.status === 'used') {
      return NextResponse.json({ success: false, error: 'Cannot modify used codes', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const updated = await (prisma as any).redemptionCode.update({
      where: { code: code.toUpperCase() },
      data: { status, notes: body.notes || existing.notes }
    })

    const response: SuccessResponse = { success: true, data: updated, message: 'Updated' }
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update code', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
});

