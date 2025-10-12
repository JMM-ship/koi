import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/app/service/antom'
import { handlePaymentSuccess } from '@/app/service/orderProcessor'

// ============================================================================
// ANTOM WEBHOOK ROUTE (TEMPORARILY DISABLED)
// This route is commented out in favor of Stripe payment integration.
// Uncomment when you need to re-enable Antom payments.
// ============================================================================

// POST /api/orders/pay/antom/notify - Antom webhook callback
export async function POST(request: NextRequest) {
  try {
    const requestTime = request.headers.get('request-time') || request.headers.get('Request-Time') || ''
    const signature = request.headers.get('signature') || request.headers.get('Signature') || ''
    const clientIdHeader = request.headers.get('client-id') || ''
    const url = new URL(request.url)
    const path = url.pathname // domainless path
    const bodyText = await request.text()

    const skipVerify = process.env.ANTOM_SKIP_WEBHOOK_VERIFY === 'true'
    let verified = false
    if (!skipVerify) {
      try {
        verified = verifyWebhookSignature({
          method: 'POST',
          path,
          clientIdHeader,
          requestTimeHeader: requestTime,
          signatureHeader: signature,
          body: bodyText,
        })
      } catch (e) {
        verified = false
      }
      if (!verified) {
        return NextResponse.json({ success: false, error: { code: 'SIGN_VERIFY_FAILED', message: 'Signature verify failed' } }, { status: 401 })
      }
    }

    // Parse body
    let payload: any = {}
    try { payload = bodyText ? JSON.parse(bodyText) : {} } catch {}

    const resultStatus = payload?.result?.resultStatus || payload?.resultStatus || payload?.paymentStatus
    // Extract orderNo (paymentRequestId is what we sent)
    const orderNo = payload?.paymentRequestId || payload?.order?.referenceOrderId || payload?.orderNo

    if (!orderNo) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_ORDER', message: 'OrderNo not found in notify' } }, { status: 400 })
    }

    // Consider S | SUCCESS as paid
    const isPaid = resultStatus === 'S' || resultStatus === 'SUCCESS' || resultStatus === 'PAYMENT_SUCCESS'

    if (isPaid) {
      const details = {
        method: 'antom',
        transactionId: payload?.paymentId || payload?.transactionId,
        paidAt: payload?.paymentTime || new Date().toISOString(),
        email: undefined,
        metadata: { raw: payload },
      }
      const res = await handlePaymentSuccess(orderNo, details)
      if (!res.success) {
        return NextResponse.json({ success: false, error: { code: 'PROCESS_FAILED', message: res.error || 'Failed to process order' } }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Antom notify error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
