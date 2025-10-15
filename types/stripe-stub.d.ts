declare module 'stripe' {
  namespace Stripe {
    namespace Checkout {
      interface Session {
        id: string
        url?: string | null
        metadata?: Record<string, string>
        payment_status?: string
        customer_details?: { email?: string | null }
        customer_email?: string | null
        amount_total?: number | null
        currency?: string | null
        created: number
        [key: string]: any
      }
    }

    interface PaymentIntent {
      id: string
      metadata?: Record<string, string>
      created: number
      receipt_email?: string | null
      amount?: number
      currency?: string
      status?: string
      last_payment_error?: { message?: string }
      [key: string]: any
    }

    interface Event {
      type: string
      data: { object: any }
      [key: string]: any
    }
  }

  const Stripe: any
  export default Stripe
}

