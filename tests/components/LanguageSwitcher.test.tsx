/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { I18nProvider } from '@/contexts/I18nContext'
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
let AUTHED = false
jest.mock('next-auth/react', () => ({
  useSession: () => (AUTHED ? { data: { user: { email: 'a@b.c' } }, status: 'authenticated' } : { data: null, status: 'unauthenticated' })
}))

describe('LanguageSwitcher (unauthenticated)', () => {
  test('sets LOCALE cookie when switching to zh without calling API', async () => {
    AUTHED = false
    const dict = { common: { language: 'Language' } }
    ;(global as any).fetch = jest.fn()
    render(
      <I18nProvider locale="en" dict={dict}>
        <LanguageSwitcher />
      </I18nProvider>
    )
    fireEvent.click(screen.getByText('中文'))
    await waitFor(() => {
      expect(document.cookie).toContain('LOCALE=zh')
    })
    expect((global as any).fetch).not.toHaveBeenCalled()
  })
})

describe('LanguageSwitcher (authenticated)', () => {
  beforeAll(() => {
    jest.resetModules()
  })
  test('calls /api/profile/locale when authenticated', async () => {
    AUTHED = true
    const dict = { common: { language: 'Language' } }
    ;(global as any).fetch = jest.fn(async () => ({ ok: true } as any))
    render(
      <I18nProvider locale="en" dict={dict}>
        <LanguageSwitcher />
      </I18nProvider>
    )
    fireEvent.click(screen.getByText('中文'))
    await waitFor(() => {
      expect(document.cookie).toContain('LOCALE=zh')
      expect((global as any).fetch).toHaveBeenCalledWith('/api/profile/locale', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ locale: 'zh' })
      }))
    })
    // no-op
  })
})
