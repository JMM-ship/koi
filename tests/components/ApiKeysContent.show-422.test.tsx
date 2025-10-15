/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import ApiKeysContent from '@/components/dashboard/ApiKeysContent'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

const showErrorMock = jest.fn()

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: showErrorMock, showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

jest.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({ confirmState: { open: false }, showConfirm: (_msg: string, onOk: () => void) => onOk() })
}))

describe('ApiKeysContent - reveal 422 NO_ENCRYPTED_KEY UX', () => {
  const storageKey = '__swr_cache_v1__'

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
    showErrorMock.mockClear()
  })

  test('shows toast and keeps masked value when 422 returned', async () => {
    const nowIso = new Date().toISOString()
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/apikeys') {
        return { ok: true, json: async () => ({ apiKeys: [ { id: 'k1', title: 'K', apiKey: 'sk-mask...****', status: 'active', createdAt: nowIso } ] }) } as any
      }
      if (url === '/api/apikeys/k1/show') {
        return { ok: false, json: async () => ({ code: 'NO_ENCRYPTED_KEY', error: 'This API key cannot be revealed.' }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })

    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <ApiKeysContent />
      </SWRConfig>
    )

    expect(await screen.findByText('K')).toBeInTheDocument()
    const btn = await screen.findByLabelText('Reveal API key')
    fireEvent.click(btn)

    await waitFor(() => expect(showErrorMock).toHaveBeenCalled())
    // masked value should remain (no toggle to full)
    expect(screen.getByText('sk-mask...****')).toBeInTheDocument()
  })
})

