import { isSupportedLocale, resolveLocaleFrom } from '@/lib/i18n/server'

describe('i18n: vi locale resolution', () => {
  test('vi is a supported locale', () => {
    expect(isSupportedLocale('vi')).toBe(true)
  })

  test('Accept-Language vi-VN resolves to vi', () => {
    expect(
      resolveLocaleFrom({ userLocale: undefined, cookieLocale: undefined, acceptLanguage: 'vi-VN,vi;q=0.9,en;q=0.8' })
    ).toBe('vi')
  })
})

