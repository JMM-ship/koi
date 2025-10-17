"use client"
import React, { useCallback } from 'react'
import { useT } from '@/contexts/I18nContext'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const { locale, setLocale: setLocaleCtx } = useT()
  const { status } = useSession()
  const router = useRouter()

  const setLocale = useCallback(async (target: 'en' | 'zh') => {
    if (target === locale) return
    try {
      document.cookie = `LOCALE=${target}; path=/; max-age=31536000`
    } catch {}
    if (status === 'authenticated') {
      try {
        await fetch('/api/profile/locale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: target })
        })
      } catch {}
    }
    try { setLocaleCtx(target) } catch {}
    try { router.refresh() } catch {}
  }, [status, locale])

  return (
    <div style={{ display: 'inline-flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setLocale('en')}
        style={{
          padding: '6px 12px',
          background: locale === 'en' ? '#2a2a2a' : 'transparent',
          color: '#fff', border: 'none', cursor: 'pointer'
        }}
        aria-pressed={locale === 'en'}
      >EN</button>
      <button
        onClick={() => setLocale('zh')}
        style={{
          padding: '6px 12px',
          background: locale === 'zh' ? '#2a2a2a' : 'transparent',
          color: '#fff', border: 'none', cursor: 'pointer'
        }}
        aria-pressed={locale === 'zh'}
      >中文</button>
    </div>
  )
}
