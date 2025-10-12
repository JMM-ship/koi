import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { findOrderByOrderNo } from '@/app/models/order'
import { createStripeCheckoutSession, getBaseUrl } from '@/app/service/stripe'

// POST /api/orders/pay/stripe - Create Stripe Checkout Session and return checkout URL
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if ((!session?.user?.uuid && !session?.user?.id) || !session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      }, { status: 401 })
    }

    const body = await request.json()
    const { orderNo } = body || {}

    if (!orderNo) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'Order number is required' },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    const order = await findOrderByOrderNo(orderNo)
    if (!order) {
      return NextResponse.json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        timestamp: new Date().toISOString(),
      }, { status: 404 })
    }

    // Build callback URLs
    const requestOrigin = new URL(request.url).origin
    const referer = request.headers.get('referer') || ''
    let refererOrigin: string | null = null
    try {
      if (referer) refererOrigin = new URL(referer).origin
    } catch {}

    // Use configured base URL or fallback to request origin
    const appBase = getBaseUrl() || refererOrigin || requestOrigin

    const successUrl = `${appBase}/dashboard?payment=success&orderNo=${encodeURIComponent(orderNo)}`
    const cancelUrl = `${appBase}/dashboard?payment=cancel&orderNo=${encodeURIComponent(orderNo)}`

    // Create Stripe Checkout Session
    const checkoutResult = await createStripeCheckoutSession({
      orderNo,
      amount: order.amount,
      currency: order.currency || 'USD',
      productName: order.product_name || 'Order',
      userEmail: session.user.email,
      successUrl,
      cancelUrl,
    })

    if (!checkoutResult.ok) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'STRIPE_CREATE_FAILED',
          message: checkoutResult.message || 'Failed to create Stripe checkout session'
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNo,
        sessionId: checkoutResult.sessionId,
        checkoutUrl: checkoutResult.checkoutUrl,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create Stripe checkout session' },
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
