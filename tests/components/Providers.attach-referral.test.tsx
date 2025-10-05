/** @jest-environment jsdom */
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Providers } from '@/app/providers'

// Mock next-auth/react to simulate authenticated session
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: any) => <>{children}</>,
  useSession: () => ({ status: 'authenticated', data: { user: { id: 'u1', email: 'a@b.com' } } }),
}))

describe('Providers - auto attach referral on login', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string, init?: any) => {
      if (url.includes('/api/referrals/attach')) {
        return { ok: true, json: async () => ({ success: true, data: { attached: true } }) } as any
      }
      throw new Error('Unexpected fetch url')
    })
    window.localStorage.setItem('inviteCode', 'CODEX')
  })

  afterEach(() => {
    ;(global as any).fetch = originalFetch
    window.localStorage.clear()
  })

  test('posts to /api/referrals/attach with inviteCode from localStorage and clears it', async () => {
    render(<Providers><div>child</div></Providers>)

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalled()
    })

    const call = ((global as any).fetch as jest.Mock).mock.calls.find((c: any[]) => c[0].includes('/api/referrals/attach'))
    expect(call).toBeTruthy()
    const body = call[1]?.body
    expect(typeof body).toBe('string')
    const parsed = JSON.parse(body)
    expect(parsed.code).toBe('CODEX')
    expect(window.localStorage.getItem('inviteCode')).toBeNull()
  })
})

