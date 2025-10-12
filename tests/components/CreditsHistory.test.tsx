/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import CreditsHistory from '@/components/dashboard/CreditsHistory'

describe('CreditsHistory component', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.startsWith('/api/credits/transactions')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { transactions: [
            { id: 't1', createdAt: new Date().toISOString(), type: 'income', bucket: 'independent', points: 500, reason: '新用户注册奖励' },
            { id: 't2', createdAt: new Date().toISOString(), type: 'expense', bucket: 'package', points: 100, reason: 'API Usage' },
          ] } }),
        } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    ;(global as any).fetch = undefined
  })

  test('renders new user bonus row', async () => {
    render(<CreditsHistory />)
    expect(await screen.findByText('新用户注册奖励')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('+500')).toBeInTheDocument())
  })
})

