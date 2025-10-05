/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import SignInPage from '@/app/auth/signin/page'

// Mock next/navigation useSearchParams
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === 'callbackUrl' ? '/dashboard' : k === 'ref' ? 'AB2CD' : null) }),
}))

// Mock next-auth/react signIn and GoogleOneTap to avoid network
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

jest.mock('@/components/auth/GoogleOneTap', () => () => null)
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn() }) }))

describe('SignIn page - invite code input', () => {
  test('prefills invite code from URL and stores in localStorage on mount', async () => {
    render(<SignInPage />)

    // Invite code should be stored
    await waitFor(() => {
      expect(window.localStorage.getItem('inviteCode')).toBe('AB2CD')
    })

    // Invite code input should be visible in Register tab area once rendered (we default to Login tab; just ensure component renders)
    // We verify that the state has been applied by the side effect; exact input will be asserted after implementation hooks in Register form.
  })
})

