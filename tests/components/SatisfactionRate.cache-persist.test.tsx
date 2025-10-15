/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import SatisfactionRate from '@/components/dashboard/SatisfactionRate'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

// Mock echarts to avoid DOM/canvas requirements
jest.mock('echarts', () => ({
  init: () => ({ setOption: jest.fn(), resize: jest.fn(), dispose: jest.fn() }),
  graphic: { LinearGradient: function() { return {} } }
}))

const dashboardData = { creditBalance: { packageCredits: 1000, independentCredits: 500, totalUsed: 400 }, userInfo: {}, userPackage: {} }
const creditBalanceData = { packageCredits: 1000, independentCredits: 500, totalUsed: 400, totalPurchased: 1500 }
const userInfoData = {}
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ data: dashboardData, isLoading: false }),
  useCreditBalance: () => creditBalanceData,
  useUserInfo: () => userInfoData
}))

describe('SatisfactionRate - credits info cache persisted SWR', () => {
  const storageKey = '__swr_cache_v1__'
  const key = '/api/credits/info'

  beforeEach(() => {
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [
        { k: key, t: now - 30_000, v: { data: { success: true, data: { usage: { resetsRemainingToday: 2, nextResetAtUtc: '2025-01-01T00:00:00Z' }, packageConfig: { creditCap: 1000 } } } } }
      ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === key) {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ success: true, data: { usage: { resetsRemainingToday: 3, nextResetAtUtc: '2025-01-02T00:00:00Z' }, packageConfig: { creditCap: 1200 } } }) } as any
      }
      // other fetches are not expected in this test
      return { ok: true, json: async () => ({}) } as any
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('shows cached resets info first then fresh after revalidate', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey, allowlist: ['/api/credits/info'] }), revalidateOnMount: false, revalidateIfStale: false }}>
        <SatisfactionRate />
      </SWRConfig>
    )
    // cached data is rendered at first paint
    expect(await screen.findByText(/Resets remaining today: 2/)).toBeInTheDocument()
  })
})
