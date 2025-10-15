export interface FxDebug {
  from: string
  to: string
  rate?: number
  mode: 'ceil_to_integer'
}

export function toTwdIntegerCeil(amount: number, fromCurrency: string, rateInput?: number): { currency: 'TWD', amount: number, fx: FxDebug } {
  const cur = (fromCurrency || 'USD').toUpperCase()
  let rate = rateInput
  if (!Number.isFinite(rate) || (rate as number) <= 0) {
    // Default fallback; can be overridden by env
    rate = 32
  }
  let twdAmount: number
  if (cur === 'TWD') {
    twdAmount = Math.ceil(amount)
    return { currency: 'TWD', amount: twdAmount, fx: { from: 'TWD', to: 'TWD', mode: 'ceil_to_integer' } }
  }
  twdAmount = Math.ceil(amount * (rate as number))
  return { currency: 'TWD', amount: twdAmount, fx: { from: cur, to: 'TWD', rate: rate as number, mode: 'ceil_to_integer' } }
}

