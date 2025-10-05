/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ReferralContent from '@/components/dashboard/ReferralContent'

describe('ReferralContent component', () => {
  const originalFetch = global.fetch
  const originalClipboard = (global as any).navigator?.clipboard

  beforeEach(() => {
    // Mock fetch for summary and invites
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.includes('/api/referrals/summary')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { inviteCode: 'AB2CDE', inviteUrl: 'https://example.com/r/AB2CDE', invitedCount: 2, totalRewardPoints: 4000 } }),
        } as any
      }
      if (url.includes('/api/referrals/invites')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { items: [
            { email: 'u1@example.com', name: 'User 1', registeredAt: '2025-09-01T10:20:30Z', purchaseStatus: 'purchased', rewardStatus: 'rewarded' },
            { email: 'u2@example.com', name: 'User 2', registeredAt: '2025-09-02T10:20:30Z', purchaseStatus: 'not_purchased', rewardStatus: 'not_purchased' },
          ], page: 1, pageSize: 20, total: 2 } }),
        } as any
      }
      throw new Error('Unexpected fetch url: ' + url)
    })

    // Mock clipboard
    ;(global as any).navigator = (global as any).navigator || {}
    ;(global as any).navigator.clipboard = {
      writeText: jest.fn(async () => {}),
    }
  })

  afterEach(() => {
    ;(global as any).fetch = originalFetch
    if (originalClipboard) {
      ;(global as any).navigator.clipboard = originalClipboard
    }
  })

  test('renders summary info and invites list; supports copy invite link', async () => {
    render(<ReferralContent />)

    // Summary content
    await waitFor(() => {
      // Invite code or link both contain AB2CDE; assert at least one match
      expect(screen.getAllByText(/AB2CDE/).length).toBeGreaterThan(0)
      expect(screen.getByText(/Invited:/)).toBeInTheDocument()
      expect(screen.getByText(/Total Rewards:/)).toBeInTheDocument()
    })

    // Invites list loaded
    expect(await screen.findByText('u1@example.com')).toBeInTheDocument()
    expect(await screen.findByText('u2@example.com')).toBeInTheDocument()

    // Copy link
    const copyBtn = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyBtn)
    await waitFor(() => {
      expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('https://example.com/r/AB2CDE')
    })
  })
})
