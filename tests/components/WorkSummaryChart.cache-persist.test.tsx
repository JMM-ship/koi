/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import WorkSummaryChart from '@/components/dashboard/WorkSummaryChart'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

// Mock echarts to avoid DOM/canvas requirements
jest.mock('echarts', () => ({
  init: () => ({ setOption: jest.fn(), resize: jest.fn(), dispose: jest.fn() }),
  graphic: { LinearGradient: function() { return {} } }
}))

describe('WorkSummaryChart - consumption trends cache persisted SWR', () => {
  const storageKey = '__swr_cache_v1__'
  const key = '/api/dashboard/consumption-trends?days=7&type=points'

  beforeEach(() => {
    const now = Date.now()
    const cached = {
      data: [100, 100, 100, 100, 100, 100, 100],
      dateLabels: ['1/1','1/2','1/3','1/4','1/5','1/6','1/7'],
      unit: 'Points',
      total: 700,
      increase: 0,
      percentage: '+0%',
      color: '#794aff',
      glowColor: '#b084ff',
      max: 120
    }
    const blob = {
      v: 'v1',
      items: [ { k: key, t: now - 30_000, v: { data: cached } } ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.startsWith('/api/dashboard/consumption-trends')) {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ data: cached.data.map((v, i) => ({ value: v + 10, date: cached.dateLabels[i] })), stats: { unit: 'Points', total: 770, increase: 10, percentage: '+10%' } }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('renders cached summary first then updates', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <WorkSummaryChart />
      </SWRConfig>
    )

    // Weekly Average from cached: 700/7 = 100 Points/day
    expect(await screen.findByText(/100 Points\/day/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/110 Points\/day/)).toBeInTheDocument())
  })
})
