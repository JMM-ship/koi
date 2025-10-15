"use client"
import React, { useMemo, useState } from 'react'
import { I18nProvider } from '@/contexts/I18nContext'

type Dicts = Record<string, Record<string, any>>

export default function I18nClientProvider({ locale, dicts, children }: { locale: string; dicts: Dicts; children: React.ReactNode }) {
  const [curLocale, setCurLocale] = useState(locale)
  const [curDict, setCurDict] = useState(dicts[locale] || dicts['en'] || {})

  const switchLocale = useMemo(() => (l: string) => {
    setCurLocale(l)
    setCurDict(dicts[l] || dicts['en'] || {})
  }, [dicts])

  return <I18nProvider locale={curLocale} dict={curDict} setLocale={switchLocale}>{children}</I18nProvider>
}
