/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import TeamMembers from '@/components/dashboard/TeamMembers'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

describe('TeamMembers - Credits Details cache persisted SWR', () => {
  const storageKey = '__swr_cache_v1__'
  const key = '/api/dashboard/model-usage?limit=10'

  beforeEach(() => {
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [
        { k: key, t: now - 30_000, v: { data: [
          { id: 'c1', model: 'ModelCached', credits: 10, timestamp: '2024-01-01 00:00', type: 'call', status: 'ok' }
        ] } }
      ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.startsWith('/api/dashboard/model-usage')) {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ data: [
          { id: 'f1', modelName: 'ModelFresh', credits: 12, timestamp: new Date().toISOString(), usageType: 'call', status: 'ok' }
        ] }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('shows cached credits details first then fresh after revalidate', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <TeamMembers />
      </SWRConfig>
    )

    expect(await screen.findByText('ModelCached')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ModelFresh')).toBeInTheDocument())
  })
})

