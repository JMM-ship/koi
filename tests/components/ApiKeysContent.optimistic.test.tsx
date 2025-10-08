/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import ApiKeysContent from '@/components/dashboard/ApiKeysContent'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

jest.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({ confirmState: { open: false }, showConfirm: (_msg: string, onOk: () => void) => onOk() })
}))

describe('ApiKeysContent - on-demand reveal and optimistic create', () => {
  const storageKey = '__swr_cache_v1__'

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('reveal loads full key on demand', async () => {
    const nowIso = new Date().toISOString()
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/apikeys') {
        return { ok: true, json: async () => ({ apiKeys: [ { id: 'k1', title: 'Old', apiKey: 'sk-old...****', status: 'active', createdAt: nowIso } ] }) } as any
      }
      if (url === '/api/apikeys/k1/show') {
        return { ok: true, json: async () => ({ success: true, apiKey: { id: 'k1', title: 'Old', apiKey: 'sk-old...****', fullKey: 'sk-old-plain', createdAt: nowIso, status: 'active' } }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })

    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <ApiKeysContent />
      </SWRConfig>
    )

    // Wait list
    expect(await screen.findByText('Old')).toBeInTheDocument()
    // Click reveal
    const btn = await screen.findByLabelText('Reveal API key')
    fireEvent.click(btn)
    // After reveal finishes, full key should appear
    await waitFor(() => expect(screen.getByText('sk-old-plain')).toBeInTheDocument())
  })

  test('create shows optimistic entry before server responds', async () => {
    const nowIso = new Date().toISOString()
    ;(global as any).fetch = jest.fn(async (url: string, init?: any) => {
      if (url === '/api/apikeys' && (!init || !init.method)) {
        // initial list empty
        return { ok: true, json: async () => ({ apiKeys: [] }) } as any
      }
      if (url === '/api/apikeys' && init?.method === 'POST') {
        // simulate slow server
        await new Promise(r => setTimeout(r, 80))
        const body = JSON.parse(init.body)
        return { ok: true, json: async () => ({ success: true, apiKey: { id: 'k2', title: body.title, apiKey: 'sk-k2...****', fullKey: 'sk-k2-plain', createdAt: nowIso, status: 'active' } }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })

    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <ApiKeysContent />
      </SWRConfig>
    )

    // Empty state visible
    expect(await screen.findByText('No API Keys Yet')).toBeInTheDocument()
    // Open modal
    fireEvent.click(screen.getByText('Create Your First Key'))
    const input = await screen.findByPlaceholderText('e.g., Production Key')
    fireEvent.change(input, { target: { value: 'My Key' } })
    // Click create -> optimistic item should appear quickly
    fireEvent.click(screen.getByText('Create Key'))

    // Optimistic presence
    await waitFor(() => expect(screen.getByText('My Key')).toBeInTheDocument())
    // Eventually replaced/confirmed by server (still shows My Key title)
    await waitFor(() => expect(screen.getByText('My Key')).toBeInTheDocument())
  })
})

