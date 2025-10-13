import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { getRecentTransactions } from '@/app/models/creditTransaction'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = (session as any)?.user
    const userId = user?.uuid || user?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }, { status: 401 })
    }

    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '10', 10) || 10, 1), 50)

    const txs = await getRecentTransactions(userId, limit)
    const data = txs.map(t => ({
      id: t.id,
      type: t.type,
      bucket: t.credit_type,
      points: t.amount,
      reason: t.description,
      createdAt: t.created_at,
    }))

    return NextResponse.json({ success: true, data: { transactions: data } }, { status: 200 })
  } catch (error) {
    console.error('Error in credits transactions API:', error)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get transactions' } }, { status: 500 })
  }
}

