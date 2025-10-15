import fs from 'fs/promises'
import path from 'path'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale, isSupportedLocale as _isSupportedLocale, parseAcceptLanguage } from '@/config/i18n'
import { PREBUNDLED_DICTIONARIES } from '@/locales/index'

export function isSupportedLocale(locale?: string | null) {
  return _isSupportedLocale(locale)
}

/**
 * A pure resolver used by tests and middleware to determine final locale.
 */
export function resolveLocaleFrom(input: {
  userLocale?: string | null
  cookieLocale?: string | null
  acceptLanguage?: string | null
}): SupportedLocale {
  const { userLocale, cookieLocale, acceptLanguage } = input
  if (isSupportedLocale(userLocale)) return userLocale
  if (isSupportedLocale(cookieLocale)) return cookieLocale
  const fromHeader = parseAcceptLanguage(acceptLanguage)
  if (fromHeader && isSupportedLocale(fromHeader)) return fromHeader
  return DEFAULT_LOCALE
}

/**
 * Node-only helper to load dictionaries. Returns a merged object keyed by namespace.
 */
export async function getDictionary(locale: SupportedLocale | string, namespaces: string[]) {
  const lang: SupportedLocale = isSupportedLocale(locale) ? (locale as SupportedLocale) : DEFAULT_LOCALE
  const out: Record<string, any> = {}
  // Prefer prebundled dictionaries to ensure availability on serverless platforms (e.g., Vercel)
  const pre = (PREBUNDLED_DICTIONARIES as any)[lang] || {}
  for (const ns of namespaces) {
    if (pre[ns]) {
      out[ns] = pre[ns]
      continue
    }
    // Fallback to filesystem for environments where files are present
    try {
      const baseDir = path.join(process.cwd(), 'locales', lang)
      const file = path.join(baseDir, `${ns}.json`)
      const content = await fs.readFile(file, 'utf-8')
      out[ns] = JSON.parse(content)
    } catch {
      out[ns] = {}
    }
  }
  return out
}

/**
 * Minimal currency formatter to show differences between locales in tests.
 */
export function formatCurrency(value: number, locale: SupportedLocale | string, currency: string) {
  const full = locale === 'zh' ? 'zh-CN' : 'en-US'
  return new Intl.NumberFormat(full, { style: 'currency', currency }).format(value)
}

// Placeholder for future Next.js integration (not used by current tests):
// export function resolveLocaleFromRequest(req: NextRequest): SupportedLocale { ... }
