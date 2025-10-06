/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import ReferralContent from '@/components/dashboard/ReferralContent'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn(), showLoading: jest.fn(), dismiss: jest.fn() })
}))

describe('ReferralContent - cache persisted SWR', () => {
  const storageKey = '__swr_cache_v1__'
  const summaryKey = '/api/referrals/summary'
  const invitesKey = '/api/referrals/invites?page=1&pageSize=20'

  beforeEach(() => {
    const now = Date.now()
    const blob = {
      v: 'v1',
      items: [
        { k: summaryKey, t: now - 30_000, v: { data: { success: true, data: { inviteCode: 'CACHED-CODE', inviteUrl: 'http://x/y', invitedCount: 2, totalRewardPoints: 100 } } } },
        { k: invitesKey, t: now - 30_000, v: { data: { success: true, data: { items: [ { email: 'a@a.com', name: 'A', registeredAt: '2024-01-01', purchaseStatus: 'not_purchased', rewardStatus: 'not_purchased' } ], page: 1, pageSize: 20, total: 1 } } } },
      ]
    }
    window.localStorage.setItem(storageKey, JSON.stringify(blob))

    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.includes('/api/referrals/summary')) {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ success: true, data: { inviteCode: 'FRESH-CODE', inviteUrl: 'http://x/y', invitedCount: 3, totalRewardPoints: 200 } }) } as any
      }
      if (url.includes('/api/referrals/invites')) {
        await new Promise(r => setTimeout(r, 30))
        return { ok: true, json: async () => ({ success: true, data: { items: [ { email: 'b@b.com', name: 'B', registeredAt: '2024-02-02', purchaseStatus: 'purchased', rewardStatus: 'rewarded' } ], page: 1, pageSize: 20, total: 1 } }) } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    window.localStorage.clear()
    ;(global as any).fetch = undefined
  })

  test('renders cached referral summary and invites first, then updates', async () => {
    render(
      <SWRConfig value={{ provider: createPersistedSWRProvider({ storageKey }) }}>
        <ReferralContent />
      </SWRConfig>
    )

    // cached first
    expect(await screen.findByText('CACHED-CODE')).toBeInTheDocument()
    expect(screen.getByText('a@a.com')).toBeInTheDocument()

    // then fresh
    await waitFor(() => expect(screen.getByText('FRESH-CODE')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('b@b.com')).toBeInTheDocument())
  })
})
