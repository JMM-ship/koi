import { toTwdIntegerCeil } from '@/lib/payments'

export interface BuildPayParamsInput {
  country: string | null
  explicitMethod?: string | null
  orderCurrency: string
  orderAmount: number
  baseCurrency?: string // default currency if order currency missing
  settlementCurrencyEnv?: string | null
  enableTwAuto?: boolean
  usdTwdRate?: number
}

export interface BuildPayParamsOutput {
  paymentMethodType?: string
  payCurrency: string
  payAmount: number
  settlementCurrency?: string
  fxApplied?: { from?: string; to?: string; rate?: number; mode?: string }
}

export function buildPayParams(input: BuildPayParamsInput): BuildPayParamsOutput {
  const {
    country,
    explicitMethod,
    orderCurrency,
    orderAmount,
    baseCurrency,
    settlementCurrencyEnv,
    enableTwAuto,
    usdTwdRate,
  } = input

  const resolvedMethod = explicitMethod || 'CONNECT_WALLET'
  const initialCurrency = (orderCurrency || baseCurrency || 'USD').toUpperCase()

  // Explicit JKOPAY always forces TWD integer amount and no settlement currency
  if (resolvedMethod === 'JKOPAY') {
    const fx = toTwdIntegerCeil(orderAmount, initialCurrency, usdTwdRate)
    return {
      paymentMethodType: 'JKOPAY',
      payCurrency: 'TWD',
      payAmount: fx.amount,
      settlementCurrency: undefined,
      fxApplied: fx.fx,
    }
  }

  // Auto for TW users (no explicit method): move to TWD cashier with integer amount
  if (enableTwAuto && country === 'TW' && !explicitMethod) {
    const fx = toTwdIntegerCeil(orderAmount, initialCurrency, usdTwdRate)
    return {
      // For AMS environments that require an explicit aggregator indicator
      paymentMethodType: 'CONNECT_WALLET',
      payCurrency: 'TWD',
      payAmount: fx.amount,
      settlementCurrency: undefined,
      fxApplied: fx.fx,
    }
  }

  // Default path: keep original currency and settlement
  return {
    paymentMethodType: resolvedMethod,
    payCurrency: initialCurrency,
    payAmount: orderAmount,
    settlementCurrency: settlementCurrencyEnv || undefined,
  }
}
