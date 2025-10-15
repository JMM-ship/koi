/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReferralContent from '@/components/dashboard/ReferralContent'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock SWR fetches for summary and invites
beforeEach(() => {
  ;(global as any).fetch = jest.fn(async (url: string) => {
    if (url.startsWith('/api/referrals/summary')) {
      return { ok: true, json: async () => ({ success: true, data: { inviteCode: 'ABCD1', inviteUrl: 'https://koi/ref/ABCD1', invitedCount: 0, totalRewardPoints: 0 } }) } as any
    }
    if (url.startsWith('/api/referrals/invites')) {
      return { ok: true, json: async () => ({ success: true, data: { items: [], page: 1, pageSize: 20, total: 0 } }) } as any
    }
    if (url.startsWith('/api/referrals/code')) {
      return { ok: true, json: async () => ({ success: true }) } as any
    }
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).navigator = { clipboard: { writeText: jest.fn(async () => {}) } }
})

// Mock useToast to intercept messages
const showSuccess = jest.fn()
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ showSuccess, showError: jest.fn() }) }))

describe('ReferralContent toasts i18n', () => {
  beforeEach(() => { showSuccess.mockClear() })
  test('copy invite link shows zh toast', async () => {
    const dict = { toasts: { inviteLinkCopied: '邀请链接已复制' } }
    render(
      <I18nProvider locale="zh" dict={dict}>
        <ReferralContent />
      </I18nProvider>
    )
    // Click copy invite link button
    await waitFor(() => expect(screen.getByText('Copy Invite Link')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Copy Invite Link'))
    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith('邀请链接已复制')
    })
  })
})

