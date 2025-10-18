import Stripe from 'stripe'

// Initialize Stripe with secret key
const getStripeClient = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in environment variables')
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  })
}

export interface StripeCheckoutParams {
  orderNo: string
  amount: number // in base currency units (e.g., 12.34 for $12.34)
  currency: string // e.g., 'usd', 'cny'
  productName: string
  userEmail?: string
  successUrl: string
  cancelUrl: string
}

export interface StripeCheckoutResult {
  ok: boolean
  sessionId?: string
  checkoutUrl?: string
  message?: string
}

/**
 * Create a Stripe Checkout Session
 */
export async function createStripeCheckoutSession(
  params: StripeCheckoutParams
): Promise<StripeCheckoutResult> {
  try {
    const stripe = getStripeClient()

    // Convert amount to cents (Stripe expects smallest currency unit)
    const amountInCents = Math.round(params.amount * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: params.productName,
              description: `Order #${params.orderNo}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.userEmail,
      metadata: {
        order_no: params.orderNo,
      },
      payment_intent_data: {
        metadata: {
          order_no: params.orderNo,
        },
      },
      // Enable automatic tax calculation if needed
      // automatic_tax: { enabled: true },
    })

    return {
      ok: true,
      sessionId: session.id,
      checkoutUrl: session.url || undefined,
    }
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error)
    return {
      ok: false,
      message: error?.message || 'Failed to create Stripe checkout session',
    }
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  try {
    const stripe = getStripeClient()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET in environment variables')
      return null
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )

    return event
  } catch (error: any) {
    console.error('Stripe webhook verification failed:', error)
    return null
  }
}

/**
 * Retrieve a Checkout Session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error)
    return null
  }
}

/**
 * Get base URL for callbacks
 */
export function getBaseUrl(): string {
  // Prefer explicit base URL from env
  const fromEnv =
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    ''
  if (fromEnv) {
    return fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`
  }
  return ''
}
