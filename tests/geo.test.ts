import { getRequestCountry } from '@/lib/geo'

function headersFrom(obj: Record<string, string>) {
  return {
    get: (name: string) => obj[name.toLowerCase()] || obj[name] || null,
  }
}

describe('getRequestCountry', () => {
  test('returns TW from x-vercel-ip-country', () => {
    const h = headersFrom({ 'x-vercel-ip-country': 'tw' })
    expect(getRequestCountry(h)).toBe('TW')
  })

  test('returns TW from cf-ipcountry', () => {
    const h = headersFrom({ 'cf-ipcountry': 'TW' })
    expect(getRequestCountry(h)).toBe('TW')
  })

  test('returns null when missing', () => {
    const h = headersFrom({})
    expect(getRequestCountry(h)).toBeNull()
  })
})

