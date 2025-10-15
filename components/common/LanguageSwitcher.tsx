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
    // instant client-side switch for all client components
    try { setLocaleCtx(target) } catch {}
    // light refresh to update server-rendered parts (e.g., html[lang])
    try { router.refresh() } catch {}
  }, [status])

  const currentLabel = locale === 'zh' ? '中文' : 'EN'

  return (
    <div className="dropdown koi-lang">
      <button
        className="btn btn-sm border-0 bg-transparent rounded-3 px-3 d-flex align-items-center gap-2 dropdown-toggle koi-lang__toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label="Language"
      >
        <span className="koi-lang__label" style={{ letterSpacing: '0.3px' }}>{currentLabel}</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end koi-lang__menu rounded-3">
        <li>
          <button className={`dropdown-item koi-lang__item ${locale === 'en' ? 'active' : ''}`} onClick={() => setLocale('en')}>
            <span className="koi-lang__item-text">EN</span>
          </button>
        </li>
        <li>
          <button className={`dropdown-item koi-lang__item ${locale === 'zh' ? 'active' : ''}`} onClick={() => setLocale('zh')}>
            <span className="koi-lang__item-text">中文</span>
          </button>
        </li>
      </ul>
    </div>
  )
}
