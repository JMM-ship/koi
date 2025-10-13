import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeWebhook } from '@/app/service/stripe'
import { handlePaymentSuccess, handlePaymentFailed } from '@/app/service/orderProcessor'
import Stripe from 'stripe'

// Disable body parsing for webhook to get raw body
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/orders/pay/stripe/webhook - Stripe webhook callback
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_SIGNATURE', message: 'Missing signature header' } },
        { status: 400 }
      )
    }

    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify webhook signature
    const event = verifyStripeWebhook(rawBody, signature)

    if (!event) {
      console.error('Webhook signature verification failed')
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } },
        { status: 401 }
      )
    }

    console.log('Stripe webhook event received:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Extract order number from metadata
        const orderNo = session.metadata?.order_no

        if (!orderNo) {
          console.error('Order number not found in session metadata')
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_ORDER', message: 'Order number not found' } },
            { status: 400 }
          )
        }

        // Check payment status
        if (session.payment_status === 'paid') {
          const paymentDetails = {
            method: 'stripe',
            transactionId: session.payment_intent as string || session.id,
            paidAt: new Date(session.created * 1000).toISOString(),
            email: session.customer_details?.email || session.customer_email,
            metadata: {
              sessionId: session.id,
              amountTotal: session.amount_total,
              currency: session.currency,
              raw: session,
            },
          }

          const result = await handlePaymentSuccess(orderNo, paymentDetails)

          if (!result.success) {
            console.error('Failed to process payment success:', result.error)
            return NextResponse.json(
              { success: false, error: { code: 'PROCESS_FAILED', message: result.error || 'Failed to process order' } },
              { status: 500 }
            )
          }

          console.log('Payment processed successfully for order:', orderNo)
        } else {
          console.log('Payment not completed, status:', session.payment_status)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderNo = paymentIntent.metadata?.order_no

        if (!orderNo) {
          console.error('Order number not found in payment intent metadata')
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_ORDER', message: 'Order number not found' } },
            { status: 400 }
          )
        }

        const paymentDetails = {
          method: 'stripe',
          transactionId: paymentIntent.id,
          paidAt: new Date(paymentIntent.created * 1000).toISOString(),
          email: paymentIntent.receipt_email || undefined,
          metadata: {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            raw: paymentIntent,
          },
        }

        const result = await handlePaymentSuccess(orderNo, paymentDetails)

        if (!result.success) {
          console.error('Failed to process payment success:', result.error)
          return NextResponse.json(
            { success: false, error: { code: 'PROCESS_FAILED', message: result.error || 'Failed to process order' } },
            { status: 500 }
          )
        }

        console.log('Payment intent succeeded for order:', orderNo)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderNo = paymentIntent.metadata?.order_no

        if (orderNo) {
          await handlePaymentFailed(
            orderNo,
            paymentIntent.last_payment_error?.message || 'Payment failed'
          )
          console.log('Payment failed for order:', orderNo)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderNo = session.metadata?.order_no

        if (orderNo) {
          await handlePaymentFailed(orderNo, 'Checkout session expired')
          console.log('Checkout session expired for order:', orderNo)
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'WEBHOOK_ERROR', message: error?.message || 'Webhook processing failed' } },
      { status: 500 }
    )
  }
}
