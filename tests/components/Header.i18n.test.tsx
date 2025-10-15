/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Header from '@/components/layout/header/Header'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock next-auth session to unauthenticated so Sign in shows
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null, status: 'unauthenticated' }) }))

describe('Header i18n', () => {
  const dictEn = { header: { signIn: 'Sign in' } }
  const dictZh = { header: { signIn: '登录' } }

  test('renders sign in in English', () => {
    render(
      <I18nProvider locale="en" dict={dictEn}>
        <Header scroll={false} isMobileMenu={false} handleMobileMenu={() => {}} />
      </I18nProvider>
    )
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })

  test('renders sign in in Chinese', () => {
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <Header scroll={false} isMobileMenu={false} handleMobileMenu={() => {}} />
      </I18nProvider>
    )
    expect(screen.getByText('登录')).toBeInTheDocument()
  })
})

