import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { prisma } from '@/app/models/db'
import { isSupportedLocale } from '@/config/i18n'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
    }

    let body: any
    try { body = await request.json() } catch { body = {} }
    const locale = body?.locale
    if (!isSupportedLocale(locale)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_LOCALE', message: 'Unsupported locale' } }, { status: 422 })
    }

    await prisma.user.update({ where: { email: session.user.email }, data: { locale } })
    return NextResponse.json({ success: true, data: { locale } }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 })
  }
}

