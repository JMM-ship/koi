import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { setUserInviteCode, validateInviteCodeFormat, canChangeInviteCode } from '@/app/service/referral'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const body = await req.json().catch(() => ({}))
    const raw = String(body?.code || '').trim()
    if (!raw) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Code is required' } }, { status: 400 })
    }

    const normalized = validateInviteCodeFormat(raw)

    // Soft check to give clearer error before transaction
    const allowed = await canChangeInviteCode(userId)
    if (!allowed) {
      return NextResponse.json({ success: false, error: { code: 'LIMIT_REACHED', message: 'Invite code change limit reached' } }, { status: 400 })
    }

    const final = await setUserInviteCode(userId, normalized)
    return NextResponse.json({ success: true, data: { inviteCode: final } })
  } catch (e: any) {
    const msg = String(e?.message || 'Error')
    let status = 400
    let code = 'BAD_REQUEST'
    if (/already in use/i.test(msg)) {
      code = 'CONFLICT'
      status = 409
    } else if (/limit reached/i.test(msg)) {
      code = 'LIMIT_REACHED'
      status = 400
    }
    return NextResponse.json({ success: false, error: { code, message: msg } }, { status })
  }
}

