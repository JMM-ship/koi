export const SUPPORTED_LOCALES = ['en', 'zh', 'vi'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'
export const LOCALE_COOKIE = 'LOCALE'

export function isSupportedLocale(locale?: string | null): locale is SupportedLocale {
  if (!locale) return false as any
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
}

/**
 * Parse Accept-Language to a supported locale (very small, dependency-free).
 * Example: "zh-CN,zh;q=0.9,en;q=0.8" -> "zh"
 */
export function parseAcceptLanguage(header?: string | null): SupportedLocale | undefined {
  if (!header || typeof header !== 'string') return undefined
  const lower = header.toLowerCase()
  // quick contains checks
  if (/(^|,|\s)zh(\b|-)/.test(lower)) return 'zh'
  if (/(^|,|\s)vi(\b|-)/.test(lower)) return 'vi'
  if (/(^|,|\s)en(\b|-)/.test(lower)) return 'en'
  return undefined
}
