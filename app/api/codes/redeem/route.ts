import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/auth/helpers'
import { redeemCode } from '@/app/service/redemption'

// POST /api/codes/redeem
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const code = (body?.code || '').trim()
    if (!code) {
      return NextResponse.json({ success: false, error: 'INVALID_PARAMS' }, { status: 400 })
    }

    const res = await redeemCode((session.user as any).id || (session.user as any).uuid, code)
    if (!res.success) {
      const map: Record<string, number> = {
        UNAUTHORIZED: 401,
        INVALID_PARAMS: 400,
        CODE_NOT_FOUND: 404,
        CODE_NOT_ACTIVE: 400,
        CODE_EXPIRED: 400,
        CODE_ALREADY_USED: 400,
        DOWNGRADE_NOT_ALLOWED: 400,
        PLAN_NOT_FOUND: 404,
        INVALID_CODE_VALUE: 400,
      }
      return NextResponse.json({ success: false, error: res.error }, { status: map[res.error] || 400 })
    }

    return NextResponse.json({ success: true, data: { message: res.message || 'OK' } })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

