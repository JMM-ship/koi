import { buildPayParams } from '@/app/service/antomParamBuilder'

describe('buildPayParams', () => {
  test('TW + no method -> TWD CONNECT_WALLET with integer amount', () => {
    const out = buildPayParams({
      country: 'TW',
      explicitMethod: undefined,
      orderCurrency: 'USD',
      orderAmount: 9.10,
      enableTwAuto: true,
      usdTwdRate: 32,
    })
    expect(out.paymentMethodType).toBe('CONNECT_WALLET')
    expect(out.payCurrency).toBe('TWD')
    expect(out.payAmount).toBe(292)
    expect(out.settlementCurrency).toBeUndefined()
  })

  test('TW + JKOPAY explicit -> TWD and integer amount', () => {
    const out = buildPayParams({
      country: 'TW',
      explicitMethod: 'JKOPAY',
      orderCurrency: 'USD',
      orderAmount: 9.99,
      enableTwAuto: true,
      usdTwdRate: 32,
    })
    expect(out.paymentMethodType).toBe('JKOPAY')
    expect(out.payCurrency).toBe('TWD')
    expect(out.payAmount).toBe(320)
    expect(out.settlementCurrency).toBeUndefined()
  })

  test('US + no method -> keep USD and amount', () => {
    const out = buildPayParams({
      country: 'US',
      explicitMethod: undefined,
      orderCurrency: 'USD',
      orderAmount: 12.34,
      enableTwAuto: true,
      usdTwdRate: 32,
      settlementCurrencyEnv: 'USD',
    })
    expect(out.paymentMethodType).toBe('CONNECT_WALLET')
    expect(out.payCurrency).toBe('USD')
    expect(out.payAmount).toBe(12.34)
    expect(out.settlementCurrency).toBe('USD')
  })

  test('Auto disabled -> keep USD and amount', () => {
    const out = buildPayParams({
      country: 'TW',
      explicitMethod: undefined,
      orderCurrency: 'USD',
      orderAmount: 9.10,
      enableTwAuto: false,
      usdTwdRate: 32,
      settlementCurrencyEnv: 'USD',
    })
    expect(out.paymentMethodType).toBe('CONNECT_WALLET')
    expect(out.payCurrency).toBe('USD')
    expect(out.payAmount).toBe(9.10)
    expect(out.settlementCurrency).toBe('USD')
  })
})
