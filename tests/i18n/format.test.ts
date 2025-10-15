import { formatCurrency } from '@/lib/i18n/server'

describe('i18n: formatting smoke tests', () => {
  test('formatCurrency shows locale and currency differences', () => {
    const amount = 1234.5
    const enUSD = formatCurrency(amount, 'en', 'USD')
    const zhCNY = formatCurrency(amount, 'zh', 'CNY')

    expect(typeof enUSD).toBe('string')
    expect(typeof zhCNY).toBe('string')

    // USD formatting usually contains $ and grouping comma in English
    expect(enUSD).toMatch(/\$/)
    expect(enUSD).toMatch(/1[,\s]?234/)

    // CNY formatting usually contains ￥/¥ symbol in Chinese
    expect(zhCNY).toMatch(/[¥￥]/)
  })
})

