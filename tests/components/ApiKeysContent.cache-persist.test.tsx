/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import ApiKeysContent from '@/components/dashboard/ApiKeysContent'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

describe('ApiKeysContent - cache persisted SWR', () => {
  const storageKey = '__swr_cache_v1__'
  const key = '/api/apikeys'

  beforeEach(() => {
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [
        { k: key, t: now - 30_000, v: { data: { apiKeys: [ { id: '1', title: 'Cached Key', status: 'active', fullKey: 'sk-full', apiKey: 'sk-****', createdAt: new Date().toISOString() } ] } } }
      ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/apikeys') {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ apiKeys: [ { id: '2', title: 'Fresh Key', status: 'active', fullKey: 'sk-fresh', apiKey: 'sk-****', createdAt: new Date().toISOString() } ] }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('shows cached API key first then fresh after revalidate', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <ApiKeysContent />
      </SWRConfig>
    )

    expect(await screen.findByText('Cached Key')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Fresh Key')).toBeInTheDocument())
  })
})

