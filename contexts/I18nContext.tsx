"use client"

import React, { createContext, useContext, useMemo } from 'react'

type Dict = Record<string, any>

type I18nContextValue = {
  locale: string
  t: (key: string, params?: Record<string, string | number>) => string
  setLocale: (locale: string) => void
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ locale, dict, setLocale: _setLocale, children }: { locale: string; dict: Dict; setLocale?: (locale: string) => void; children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    t: (key: string, params?: Record<string, string | number>) => {
      const val = getByPath(dict, key) ?? key
      if (typeof val !== 'string') return key
      if (!params) return val
      return Object.keys(params).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]!)), val)
    },
    setLocale: (next: string) => { try { _setLocale?.(next) } catch {} },
  }), [locale, dict, _setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used within I18nProvider')
  return ctx
}

function getByPath(obj: any, path: string) {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p]
    else return undefined
  }
  return cur
}
