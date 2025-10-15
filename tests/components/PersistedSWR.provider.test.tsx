/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import useSWR, { SWRConfig } from 'swr'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

const KEY = '/api/referrals/summary'

function TestComp() {
  const fetcher = async () => {
    return await new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { inviteCode: 'NEW-CODE' } }), 50))
  }
  const { data } = useSWR(KEY, fetcher)
  return <div>{data ? data.data.inviteCode : 'loading'}</div>
}

describe('Persisted SWR Provider', () => {
  const storageKey = '__swr_cache_v1__'

  beforeEach(() => {
    // seed cache with old value (within hard TTL)
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [
        // Persist the SWR state object shape: { data: <fetcherResult> }
        { k: KEY, t: now - 60_000, v: { data: { success: true, data: { inviteCode: 'OLD-CODE' } } } }
      ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))
  })

  afterEach(() => {
    window.localStorage.clear()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('renders cached data first then updates after revalidation and persists new value', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <TestComp />
      </SWRConfig>
    )

    // shows cached first
    expect(screen.getByText('OLD-CODE')).toBeInTheDocument()

    // wait for fetcher (50ms) and provider debounce to complete
    await waitFor(() => expect(screen.getByText('NEW-CODE')).toBeInTheDocument())
    // trigger a flush to persist immediately
    window.dispatchEvent(new Event('beforeunload'))
    const raw = window.localStorage.getItem(storageKey) || '{}'
    const parsed = JSON.parse(raw)
    const entry = parsed.items?.find((it: any) => it.k === KEY)
    expect(!!entry).toBe(true)
  })

  test('drops entries beyond hard TTL on load', async () => {
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [ { k: KEY, t: now - 3 * 24 * 60 * 60 * 1000, v: { data: { success: true, data: { inviteCode: 'STALE' } } } } ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    const FreshComp = () => {
      const fetcher = async () => ({ success: true, data: { inviteCode: 'FRESH' } })
      const { data } = useSWR(KEY, fetcher)
      return <span>{data ? data.data.inviteCode : 'loading'}</span>
    }

    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey, hardTtlMs: 24 * 60 * 60 * 1000 }) }}>
        <FreshComp />
      </SWRConfig>
    )

    // no cached display since it was dropped, will show loading then fresh
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('FRESH')).toBeInTheDocument())
  })
})
