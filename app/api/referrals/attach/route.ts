import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { attachReferralByCode, validateInviteCodeFormat } from '@/app/service/referral'
import { REFERRAL_COOKIE_NAME } from '@/config/referral.config'

function parseCookie(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=')
    if (idx > -1) {
      const k = part.slice(0, idx).trim()
      const v = part.slice(idx + 1).trim()
      if (k) out[k] = v
    }
  })
  return out
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }, { status: 401 })
    }

    const userId = (session.user as any).id as string

    // code from body or cookie
    let code = ''
    try {
      const body = await req.json()
      if (body?.code) code = String(body.code)
    } catch {}
    if (!code) {
      const cookies = parseCookie(req.headers.get('cookie'))
      code = cookies[REFERRAL_COOKIE_NAME] || ''
    }

    if (!code) {
      return NextResponse.json({ success: true, data: { attached: false, reason: 'NO_CODE' } })
    }

    const normalized = validateInviteCodeFormat(code)
    const result = await attachReferralByCode(userId, normalized)
    return NextResponse.json({ success: true, data: { attached: result.attached, inviterId: result.inviterId } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: String(e?.message || 'Bad request') } }, { status: 400 })
  }
}

