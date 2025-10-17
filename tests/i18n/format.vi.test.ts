import { formatCurrency } from '@/lib/i18n/server'

describe('i18n: vi currency formatting', () => {
  test('vi-VN formatting differs from en-US and contains US$', () => {
    const en = formatCurrency(1234.5, 'en', 'USD')
    const vi = formatCurrency(1234.5, 'vi', 'USD')
    // sanity: different locale should produce different shape
    expect(vi).not.toBe(en)
    // vi-VN generally uses comma for decimal and places US$ after number
    expect(vi).toContain('US$')
    expect(vi).toMatch(/[0-9]\.\d{3},\d{2}/) // e.g., 1.234,50
  })
})

