import { toTwdIntegerCeil } from '@/lib/payments'

describe('toTwdIntegerCeil', () => {
  test('USD to TWD uses env rate and ceils', () => {
    const r1 = toTwdIntegerCeil(9.10, 'USD', 32)
    expect(r1.currency).toBe('TWD')
    expect(r1.amount).toBe(292) // 9.10*32=291.2 -> 292

    const r2 = toTwdIntegerCeil(9.99, 'USD', 32)
    expect(r2.amount).toBe(320) // 319.68 -> 320
  })

  test('TWD input just ceils to integer', () => {
    const r = toTwdIntegerCeil(123.4, 'TWD')
    expect(r.amount).toBe(124)
  })

  test('missing rate falls back to default 32', () => {
    const r = toTwdIntegerCeil(1.1, 'USD')
    expect(r.amount).toBe(36) // 35.2 -> 36
  })
})

