/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SignInPage from '@/app/auth/signin/page'
import { I18nProvider } from '@/contexts/I18nContext'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === 'callbackUrl' ? '/dashboard' : null) }),
}))
jest.mock('next-auth/react', () => ({ signIn: jest.fn() }))
jest.mock('@/components/auth/GoogleOneTap', () => () => null)
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn(), showInfo: jest.fn() }) }))

describe('Signin page i18n', () => {
  const dictEn = { auth: {
    login: 'Login', register: 'Register', email: 'Email', password: 'Password', verificationCode: 'Verification Code',
    sendCode: 'Send Code', or: 'or', signInWithGoogle: 'Sign in with Google'
  }}
  const dictZh = { auth: {
    login: '登录', register: '注册', email: '邮箱', password: '密码', verificationCode: '验证码',
    sendCode: '发送验证码', or: '或', signInWithGoogle: '使用 Google 登录'
  }}

  test('renders key labels in English', async () => {
    render(
      <I18nProvider locale="en" dict={dictEn}>
        <SignInPage />
      </I18nProvider>
    )
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Register').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Password').length).toBeGreaterThan(0)
    // Switch to Register tab to expose verification section
    fireEvent.click(screen.getByText('Register'))
    expect(await screen.findByText('Send Code')).toBeInTheDocument()
    expect(screen.getByText('or')).toBeInTheDocument()
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  test('renders key labels in Chinese', async () => {
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <SignInPage />
      </I18nProvider>
    )
    expect(screen.getByText('登录')).toBeInTheDocument()
    expect(screen.getByText('注册')).toBeInTheDocument()
    expect(screen.getAllByText('邮箱').length).toBeGreaterThan(0)
    expect(screen.getAllByText('密码').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('注册'))
    expect(await screen.findByText('发送验证码')).toBeInTheDocument()
    expect(screen.getByText('或')).toBeInTheDocument()
    expect(screen.getByText('使用 Google 登录')).toBeInTheDocument()
  })
})
