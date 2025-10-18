import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { prisma } from '@/app/models/db'

export const dynamic = 'force-dynamic'

type OnboardingState = {
  done: boolean
  steps: Record<string, boolean>
  firstSeenAt: string | null
}

const DEFAULT_STATE: OnboardingState = { done: false, steps: {}, firstSeenAt: null }

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_meta (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  } catch {}
}

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    const userId = (session.user as any).id || (session.user as any).uuid
    if (!userId) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    // Admin exemption: admin 用户始终视为已完成，引导永不显示
    if ((session.user as any).role === 'admin') {
      const state: OnboardingState = { done: true, steps: {}, firstSeenAt: null }
      return NextResponse.json({ success: true, data: state })
    }

    await ensureTable()
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT data FROM user_meta WHERE user_id = $1`, userId)
    const data = rows?.[0]?.data || {}
    const ob = data.onboarding || {}
    const state: OnboardingState = {
      done: Boolean(ob.done) || false,
      steps: (ob.steps && typeof ob.steps === 'object') ? ob.steps : {},
      firstSeenAt: ob.firstSeenAt || null,
    }
    return NextResponse.json({ success: true, data: state })
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    const userId = (session.user as any).id || (session.user as any).uuid
    if (!userId) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    // Admin exemption: 忽略对 admin 用户的写入，始终返回 done=true
    if ((session.user as any).role === 'admin') {
      const state: OnboardingState = { done: true, steps: {}, firstSeenAt: null }
      return NextResponse.json({ success: true, data: state })
    }

    let body: any
    try { body = await req.json() } catch { body = {} }
    const next: OnboardingState = {
      done: Boolean(body.done),
      steps: (body.steps && typeof body.steps === 'object') ? body.steps : {},
      firstSeenAt: body.firstSeenAt || null,
    }

    await ensureTable()
    // Upsert using insert-on-conflict
    const wrapper = { onboarding: next }
    const inserted = await prisma.$executeRawUnsafe(
      `INSERT INTO user_meta (user_id, data) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = now()`,
      userId,
      wrapper as any,
    )
    return NextResponse.json({ success: true, data: next })
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 })
  }
}
