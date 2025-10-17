/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '@/contexts/I18nContext'
import { PREBUNDLED_DICTIONARIES } from '@/locales'
import WelcomeGuide from '@/components/dashboard/WelcomeGuide'

jest.mock('@/lib/track', () => ({ trackOnboardingEvent: jest.fn() }))

describe('Onboarding i18n keys', () => {
  test('renders zh strings from locales', async () => {
    render(
      <I18nProvider locale="zh" dict={PREBUNDLED_DICTIONARIES.zh as any}>
        <WelcomeGuide bonusPoints={123} />
      </I18nProvider>
    )
    expect(await screen.findByText('欢迎使用')).toBeInTheDocument()
    expect(screen.getByText('已发放 123 积分')).toBeInTheDocument()
  })

  test('renders en strings from locales', async () => {
    render(
      <I18nProvider locale="en" dict={PREBUNDLED_DICTIONARIES.en as any}>
        <WelcomeGuide bonusPoints={50} />
      </I18nProvider>
    )
    expect(await screen.findByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('50 credits granted')).toBeInTheDocument()
  })
})

