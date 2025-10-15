import { NextResponse } from 'next/server'
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE_DAYS } from '@/config/referral.config'
import { validateInviteCodeFormat } from '@/app/service/referral'

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const url = new URL(req.url)
  const raw = params?.code || ''
  let normalized: string | null = null
  try {
    normalized = validateInviteCodeFormat(raw)
  } catch {
    normalized = null
  }

  const redirectTo = new URL('/auth/signin', url.origin)
  if (normalized) {
    redirectTo.searchParams.set('ref', normalized)
    // Open the Register tab by default
    redirectTo.searchParams.set('register', '1')
  }

  const res = NextResponse.redirect(redirectTo)
  if (normalized) {
    res.cookies.set(REFERRAL_COOKIE_NAME, normalized, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
      path: '/',
    })
  }
  return res
}
