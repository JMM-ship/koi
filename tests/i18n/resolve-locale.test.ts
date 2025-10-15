import { isSupportedLocale, resolveLocaleFrom } from '@/lib/i18n/server'

describe('i18n: resolve locale priority', () => {
  test('supported locales include en and zh', () => {
    expect(isSupportedLocale('en')).toBe(true)
    expect(isSupportedLocale('zh')).toBe(true)
    expect(isSupportedLocale('jp')).toBe(false)
  })

  test('priority: user.locale > cookie > accept-language > default', () => {
    // 1) user preferred
    expect(resolveLocaleFrom({ userLocale: 'zh', cookieLocale: 'en', acceptLanguage: 'en-US,en;q=0.9' })).toBe('zh')
    // 2) cookie when user unset
    expect(resolveLocaleFrom({ userLocale: undefined, cookieLocale: 'zh', acceptLanguage: 'en-US,en;q=0.9' })).toBe('zh')
    // 3) accept-language when cookie unset
    expect(resolveLocaleFrom({ userLocale: undefined, cookieLocale: undefined, acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8' })).toBe('zh')
    // 4) default when all unset/unsupported
    expect(resolveLocaleFrom({ userLocale: undefined, cookieLocale: undefined, acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en')
  })
})

