/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RedeemCodeCard from '@/components/dashboard/RedeemCodeCard'

describe('RedeemCodeCard', () => {
  const originalFetch = global.fetch
  const mutateMock = jest.fn()
  const toast = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }

  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string, init?: any) => {
      if (url.includes('/api/codes/redeem')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { applied: true } }),
        } as any
      }
      throw new Error('Unexpected fetch url: ' + url)
    })
  })

  afterEach(() => {
    ;(global as any).fetch = originalFetch as any
    jest.clearAllMocks()
  })

  test('renders input and redeem button; successful redeem triggers mutate and success toast', async () => {
    render(<RedeemCodeCard mutatePackages={mutateMock} toast={toast as any} />)

    const input = screen.getByPlaceholderText(/Enter your redemption code/i)
    fireEvent.change(input, { target: { value: 'KOI-TEST-1234-ABCD' } })

    const btn = screen.getByRole('button', { name: /Redeem Code/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled()
      expect(toast.showSuccess).toHaveBeenCalled()
    })
  })

  test('failed redeem shows error toast', async () => {
    ;(global as any).fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ success: false, error: 'INVALID_CODE' }),
      status: 400,
    }))

    render(<RedeemCodeCard mutatePackages={mutateMock} toast={toast as any} />)

    const input = screen.getByPlaceholderText(/Enter your redemption code/i)
    fireEvent.change(input, { target: { value: 'BAD-CODE' } })

    const btn = screen.getByRole('button', { name: /Redeem Code/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(toast.showError).toHaveBeenCalled()
      expect(mutateMock).not.toHaveBeenCalled()
    })
  })
})

