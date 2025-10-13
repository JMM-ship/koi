import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth/config'
import { findOrderByOrderNo } from '@/app/models/order'
import { antomPay, getBaseUrl } from '@/app/service/antom'
import { getRequestCountry } from '@/lib/geo'
import { buildPayParams } from '@/app/service/antomParamBuilder'

// ============================================================================
// ANTOM PAYMENT ROUTE (TEMPORARILY DISABLED)
// This route is commented out in favor of Stripe payment integration.
// Uncomment when you need to re-enable Antom payments.
// ============================================================================

// POST /api/orders/pay/antom - Create Antom payment session and return redirect URL
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
    const { orderNo, paymentMethodType } = body || {}
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

    // Build URLs for notify (public webhook) and return (user app)
    const requestOrigin = new URL(request.url).origin
    const referer = request.headers.get('referer') || ''
    let refererOrigin: string | null = null
    try { if (referer) refererOrigin = new URL(referer).origin } catch {}

    // Notify should be publicly reachable (e.g., ngrok)
    const notifyBase = process.env.PUBLIC_NOTIFY_URL || process.env.PUBLIC_BASE_URL || requestOrigin
    const notifyUrl = `${notifyBase}/api/orders/pay/antom/notify`

    // Return should preserve the user's app origin to keep session cookies
    const appBase = process.env.PUBLIC_APP_URL || refererOrigin || requestOrigin
    const returnUrl = `${appBase}/dashboard?payment=return&orderNo=${encodeURIComponent(orderNo)}`

    const settleCurrencyEnv = process.env.ANTOM_SETTLEMENT_CURRENCY
    const enableTwAuto = process.env.ENABLE_TW_JKOPAY_AUTO === 'true'
    const usdTwdRate = Number(process.env.ANTOM_USD_TWD_RATE || '0')
    const requestCountry = getRequestCountry(request.headers)

    const params = buildPayParams({
      country: requestCountry,
      explicitMethod: paymentMethodType || process.env.ANTOM_PAYMENT_METHOD || undefined,
      orderCurrency: order.currency || process.env.ANTOM_PAYMENT_CURRENCY || 'USD',
      orderAmount: order.amount,
      baseCurrency: process.env.ANTOM_PAYMENT_CURRENCY || 'USD',
      settlementCurrencyEnv: settleCurrencyEnv || null,
      enableTwAuto,
      usdTwdRate,
    })

    // info-level operational log
    try {
      console.info('AntomPayInfo', {
        country: requestCountry,
        originalCurrency: order.currency || null,
        originalAmount: order.amount,
        payCurrency: params.payCurrency,
        payAmount: params.payAmount,
        paymentMethodType: params.paymentMethodType,
        settlementCurrency: params.settlementCurrency || null,
        fxApplied: params.fxApplied || null,
        enableTwAuto,
      })
    } catch {}

    const payResult = await antomPay({
      orderNo,
      amount: params.payAmount,
      currency: params.payCurrency,
      productName: order.product_name || 'Order',
      userEmail: session.user.email,
      notifyUrl,
      returnUrl,
      paymentMethodType: params.paymentMethodType,
      settlementCurrency: params.settlementCurrency,
    })

    if (!payResult.ok) {
      return NextResponse.json({
        success: false,
        error: { code: 'PAYMENT_CREATE_FAILED', message: payResult.message || 'Failed to create Antom payment' },
        data: { 
          raw: payResult.raw,
          debug: {
            payCurrency: params.payCurrency,
            settlementCurrency: params.settlementCurrency || null,
            gateway: process.env.ANTOM_GATEWAY_URL || 'https://open-na.alipay.com',
            paymentMethodType: params.paymentMethodType,
            fx: params.fxApplied || null,
            country: requestCountry || null,
          }
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNo,
        redirectUrl: payResult.paymentRedirectUrl,
        paymentId: payResult.paymentId,
        paymentRequestId: payResult.paymentRequestId,
        raw: payResult.raw,
        debug: { fx: params.fxApplied || null, currency: params.payCurrency, amount: params.payAmount, country: requestCountry || null }
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error creating Antom payment:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create Antom payment' },
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
