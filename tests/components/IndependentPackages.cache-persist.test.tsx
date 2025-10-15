/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import IndependentPackages from '@/components/dashboard/IndependentPackages'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

describe('IndependentPackages - cache persisted SWR', () => {
  const storageKey = '__swr_cache_v1__'
  const key = '/api/packages/credits'

  beforeEach(() => {
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [
        {
          k: key,
          t: now - 30_000,
          v: {
            data: {
              success: true,
              data: {
                packages: [
                  { id: 'c1', name: 'Cached Basic', credits: 1000, price: 10, description: 'cached', currency: 'USD' },
                  { id: 'c2', name: 'Cached Pro', credits: 5000, price: 40, description: 'cached', currency: 'USD' },
                ]
              }
            }
          }
        }
      ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/packages/credits') {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ success: true, data: { packages: [
          { id: 'f1', name: 'Fresh Basic', credits: 1200, price: 12, description: 'fresh', currency: 'USD' },
          { id: 'f2', name: 'Fresh Pro', credits: 6000, price: 48, description: 'fresh', currency: 'USD' },
        ] } }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('shows cached packages first then fresh after revalidate', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <IndependentPackages onBack={() => {}} />
      </SWRConfig>
    )

    // cached visible first
    expect(await screen.findByText('Cached Basic')).toBeInTheDocument()

    // then fresh replaces
    await waitFor(() => expect(screen.getByText('Fresh Basic')).toBeInTheDocument())
  })
})
