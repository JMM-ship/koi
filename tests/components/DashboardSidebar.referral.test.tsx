/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'user' } }, status: 'authenticated' }),
  signOut: jest.fn(),
}))

// Mock next/navigation to avoid app router dependency in tests
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}))

describe('Dashboard Sidebar - Referral menu', () => {
  test('shows Referral Program item and triggers tab change', () => {
    const onTabChange = jest.fn()
    const Sidebar = require('@/components/dashboard/Sidebar').default
    render(<Sidebar activeTab="referral" onTabChange={onTabChange} />)

    const item = screen.getByText('Referral Program')
    expect(item).toBeInTheDocument()

    // Click item
    fireEvent.click(item)
    expect(onTabChange).toHaveBeenCalled()
  })
})
