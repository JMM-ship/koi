import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { prisma } from '@/app/models/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const url = req.nextUrl
    const page = Number(url.searchParams.get('page') || '1')
    const pageSize = Number(url.searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize

    const [items, total] = await Promise.all([
      prisma.user.findMany({ where: { invitedBy: userId }, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where: { invitedBy: userId } })
    ])

    const mapped = await Promise.all(items.map(async (u) => {
      const paid = await prisma.order.count({ where: { userId: u.id, status: 'paid' } })
      // rewarded if inviter has a referral_reward tx with inviteeId == u.id
      const inviterTxs = await prisma.creditTransaction.findMany({ where: { userId, type: 'income', bucket: 'independent' } })
      const rewarded = inviterTxs.some((t: any) => (t.meta as any)?.source === 'referral_reward' && (t.meta as any)?.inviteeId === u.id)

      let rewardStatus: 'rewarded' | 'purchased_unrewarded' | 'not_purchased' | 'invalid' = 'not_purchased'
      if (paid > 0) rewardStatus = rewarded ? 'rewarded' : 'purchased_unrewarded'

      return {
        email: (u as any).email,
        name: (u as any).nickname || null,
        registeredAt: (u as any).createdAt?.toISOString?.() || (u as any).created_at || '',
        purchaseStatus: paid > 0 ? 'purchased' : 'not_purchased',
        rewardStatus,
      }
    }))

    return NextResponse.json({ success: true, data: { items: mapped, page, pageSize, total } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: String(e?.message || 'Server error') } }, { status: 500 })
  }
}

