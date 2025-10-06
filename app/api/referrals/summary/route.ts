import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { ensureUserInviteCode } from '@/app/service/referral'
import { prisma } from '@/app/models/db'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    // ensure invite code exists
    const inviteCode = await ensureUserInviteCode(userId)

    // count invited users
    const invitedCount = await prisma.user.count({ where: { invitedBy: userId } })

    // sum rewards
    const allTx = await prisma.creditTransaction.findMany({ where: { userId, type: 'income', bucket: 'independent' } })
    const totalRewardPoints = allTx
      .filter((t: any) => (t.meta as any)?.source === 'referral_reward')
      .reduce((acc, t) => acc + Number(t.points || 0), 0)

    const originFromEnv = process.env.NEXT_PUBLIC_SITE_URL || ''
    const origin = originFromEnv || new URL(req.url).origin
    const inviteUrl = `${origin}/r/${inviteCode}`

    return NextResponse.json({ success: true, data: { inviteCode, inviteUrl, invitedCount, totalRewardPoints } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: String(e?.message || 'Server error') } }, { status: 500 })
  }
}
