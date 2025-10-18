/** @jest-environment jsdom */
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { I18nProvider } from '@/contexts/I18nContext'

const replace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (_k: string) => null }),
}))

jest.mock('@/components/dashboard/Sidebar', () => () => <div data-testid=\"Sidebar\" />)
jest.mock('@/components/dashboard/DashboardContent', () => () => <div data-testid=\"DashboardContent\">DashboardContent</div>)
jest.mock('@/components/dashboard/ApiKeysContent', () => () => <div>ApiKeysContent</div>)
jest.mock('@/components/dashboard/PlansContent', () => () => <div>PlansContent</div>)
jest.mock('@/components/dashboard/ProfileContent', () => () => <div>ProfileContent</div>)
jest.mock('@/components/dashboard/ReferralContent', () => () => <div>ReferralContent</div>)

const dictZh = { onboarding: { title: '欢迎使用' } }

describe('Dashboard onboarding redirect (updated)', () => {
  beforeEach(() => {
    localStorage.clear()
    replace.mockReset()
  })

  test('redirects to /onboarding when not done', async () => {
    const mockFetch = jest.fn(async (url: string) => {
      if (url.endsWith('/api/onboarding/state')) return { ok: true, json: async () => ({ success: true, data: { done: false, steps: {}, firstSeenAt: null } }) } as any
      return { ok: true, json: async () => ({}) } as any
    })
    ;(global as any).fetch = mockFetch
    ;(window as any).fetch = mockFetch
    render(
      <I18nProvider locale=\"zh\" dict={dictZh as any}>
        <DashboardPage />
      </I18nProvider>
    )
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/onboarding'))
  })
})
