/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileContent from '@/components/dashboard/ProfileContent'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock next-auth session
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { email: 'u@e' } }, status: 'authenticated' }) }))

// Mock useUserData hook to provide user and updateProfile
jest.mock('@/hooks/useUserData', () => ({
  useUserData: () => ({
    user: { email: 'u@e', nickname: 'Nick', avatarUrl: 'https://img/av.png' },
    isLoading: false,
    updateProfile: jest.fn(async () => {}),
    refreshUserData: jest.fn(),
  })
}))

// Intercept toasts
const showSuccess = jest.fn()
const showError = jest.fn()
const showInfo = jest.fn()
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ showSuccess, showError, showInfo }) }))

describe('ProfileContent toasts i18n', () => {
  beforeEach(() => { showSuccess.mockClear(); showError.mockClear(); showInfo.mockClear() })

  test('copy avatar url shows zh toast', async () => {
    const dict = { toasts: { avatarUrlCopied: '头像链接已复制' } }
    // stub clipboard
    ;(global as any).navigator = (global as any).navigator || {}
    ;(global as any).navigator.clipboard = { writeText: jest.fn(async () => {}) }
    const { container } = render(
      <I18nProvider locale="zh" dict={dict}>
        <ProfileContent />
      </I18nProvider>
    )
    // Click copy button
    await waitFor(() => expect(container.querySelector('.profile-copy-btn')).toBeTruthy())
    const copyBtn = container.querySelector('.profile-copy-btn') as HTMLButtonElement
    fireEvent.click(copyBtn)
    await waitFor(() => expect(showInfo).toHaveBeenCalledWith('头像链接已复制'))
  })

  test('save profile success uses zh toast', async () => {
    const dict = { toasts: { profileUpdatedSuccess: '资料已更新' } }
    render(
      <I18nProvider locale="zh" dict={dict}>
        <ProfileContent />
      </I18nProvider>
    )
    const saveBtn = await screen.findByRole('button', { name: /Save Profile/i })
    fireEvent.click(saveBtn)
    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('资料已更新'))
  })
})
