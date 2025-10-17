/** @jest-environment jsdom */
import React from 'react'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import SignInPage from '@/app/auth/signin/page'
import { I18nProvider } from '@/contexts/I18nContext'

// Mutable search params store for per-test overrides
const searchParamsStore: Record<string, string | null> = {
  callbackUrl: '/dashboard',
  register: '1',
}

// Router mocks to capture navigation
const pushMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => ({ get: (k: string) => (k in searchParamsStore ? (searchParamsStore[k] as any) : null) }),
}))

// Mock next-auth/react signIn
const signInMock = jest.fn()
jest.mock('next-auth/react', () => ({
  signIn: (...args: any[]) => signInMock(...args),
}))

// Avoid network/UI noise
jest.mock('@/components/auth/GoogleOneTap', () => () => null)
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn() }) }))

// Minimal i18n dict to render labels in English
const dictEn = { auth: { register: 'Register', verificationCode: 'Verification Code' } }

// Mock fetch for registration
beforeEach(() => {
  const mockFetch = jest.fn(async (url: string, init?: any) => {
    if (url.includes('/api/auth/register')) {
      return {
        ok: true,
        json: async () => ({ success: true, user: { uuid: 'u1', email: 'e@test.com', nickname: 'nick' } }),
      } as any
    }
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).fetch = mockFetch
  ;(window as any).fetch = mockFetch
  signInMock.mockResolvedValue({ ok: true })
  pushMock.mockReset()
  refreshMock.mockReset()
  searchParamsStore.callbackUrl = '/dashboard'
  searchParamsStore.register = '1'
})

describe('Signin redirect with welcome param after successful registration', () => {
  test('redirects to /dashboard?welcome=1 when callbackUrl is /dashboard', async () => {
    render(
      <I18nProvider locale="en" dict={dictEn as any}>
        <SignInPage />
      </I18nProvider>
    )

    // Locate the Register form via the Verification Code label, then submit
    const vc = await screen.findByText('Verification Code')
    const form = vc.closest('form') as HTMLFormElement
    expect(form).toBeTruthy()
    // Fill required fields
    const textboxes = within(form!).getAllByRole('textbox')
    if (textboxes[0]) fireEvent.change(textboxes[0], { target: { value: 'user123' } })
    if (textboxes[1]) fireEvent.change(textboxes[1], { target: { value: 'e@test.com' } })
    const pwd = form!.querySelector('input[type="password"]') as HTMLInputElement
    if (pwd) fireEvent.change(pwd, { target: { value: 'Passw0rd!' } })
    if (textboxes[textboxes.length - 1]) fireEvent.change(textboxes[textboxes.length - 1], { target: { value: '123456' } })
    // Submit the form programmatically to avoid any HTML validation edge cases
    fireEvent.submit(form!)

    await waitFor(() => expect(signInMock).toHaveBeenCalled())
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard?welcome=1'))
  })

  test('preserves original query and appends welcome=1 for /dashboard?a=1', async () => {
    searchParamsStore.callbackUrl = '/dashboard?a=1'

    render(
      <I18nProvider locale="en" dict={dictEn as any}>
        <SignInPage />
      </I18nProvider>
    )

    const vc = await screen.findByText('Verification Code')
    const form = vc.closest('form') as HTMLFormElement
    const textboxes = within(form!).getAllByRole('textbox')
    if (textboxes[0]) fireEvent.change(textboxes[0], { target: { value: 'user123' } })
    if (textboxes[1]) fireEvent.change(textboxes[1], { target: { value: 'e@test.com' } })
    const pwd = form!.querySelector('input[type="password"]') as HTMLInputElement
    if (pwd) fireEvent.change(pwd, { target: { value: 'Passw0rd!' } })
    if (textboxes[textboxes.length - 1]) fireEvent.change(textboxes[textboxes.length - 1], { target: { value: '123456' } })
    fireEvent.submit(form!)

    await waitFor(() => expect(signInMock).toHaveBeenCalled())
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard?a=1&welcome=1'))
  })

  test('keeps non-dashboard callbackUrl unchanged', async () => {
    searchParamsStore.callbackUrl = '/somewhere'

    render(
      <I18nProvider locale="en" dict={dictEn as any}>
        <SignInPage />
      </I18nProvider>
    )

    const vc = await screen.findByText('Verification Code')
    const form = vc.closest('form') as HTMLFormElement
    const textboxes = within(form!).getAllByRole('textbox')
    if (textboxes[0]) fireEvent.change(textboxes[0], { target: { value: 'user123' } })
    if (textboxes[1]) fireEvent.change(textboxes[1], { target: { value: 'e@test.com' } })
    const pwd = form!.querySelector('input[type="password"]') as HTMLInputElement
    if (pwd) fireEvent.change(pwd, { target: { value: 'Passw0rd!' } })
    if (textboxes[textboxes.length - 1]) fireEvent.change(textboxes[textboxes.length - 1], { target: { value: '123456' } })
    fireEvent.submit(form!)

    await waitFor(() => expect(signInMock).toHaveBeenCalled())
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/somewhere'))
  })
})
