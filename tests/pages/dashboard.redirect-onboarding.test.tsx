/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { I18nProvider } from '@/contexts/I18nContext'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (_k: string) => null }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

// Stub heavy children
jest.mock('@/components/dashboard/Sidebar', () => ({ onTabChange }: any) => <div data-testid="Sidebar" onClick={() => onTabChange?.('dashboard')}>Sidebar</div>)
jest.mock('@/components/dashboard/DashboardContent', () => () => <div data-testid="DashboardContent">DashboardContent</div>)
jest.mock('@/components/dashboard/ApiKeysContent', () => () => <div>ApiKeysContent</div>)
jest.mock('@/components/dashboard/PlansContent', () => () => <div>PlansContent</div>)
jest.mock('@/components/dashboard/ProfileContent', () => () => <div>ProfileContent</div>)
jest.mock('@/components/dashboard/ReferralContent', () => () => <div>ReferralContent</div>)

const dictZh = {
  onboarding: {
    title: '欢迎使用',
    subtitle: '按照以下步骤快速开始',
    reward: '已发放 {points} 积分',
    step: { createKey: '创建 API Key', firstCall: '运行一次测试调用', choosePlan: '选择套餐', setLocale: '设置语言' },
    stepDesc: { createKey: '', firstCall: '', choosePlan: '', setLocale: '' },
    cta: { createKey: '去创建', firstCall: '去试跑', choosePlan: '去选择', setLocale: '去设置', done: '我已完成' },
    tip: { inviteReward: '邀请好友可获得奖励' },
    state: { done: '已完成' }
  }
}

describe('Dashboard inline onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('shows WelcomeGuide when done=false and CTA navigates to api-keys', async () => {
    const mockFetch = jest.fn(async (url: string) => {
      if (url.endsWith('/api/onboarding/state')) return { ok: true, json: async () => ({ success: true, data: { done: false, steps: {}, firstSeenAt: null } }) } as any
      return { ok: true, json: async () => ({}) } as any
    })
    ;(global as any).fetch = mockFetch
    ;(window as any).fetch = mockFetch

    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <DashboardPage />
      </I18nProvider>
    )

    expect(await screen.findByText('欢迎使用')).toBeInTheDocument()
    fireEvent.click(screen.getByText('去创建'))
    await waitFor(() => expect(screen.getByText('ApiKeysContent')).toBeInTheDocument())
  })

  test('renders DashboardContent when done=true', async () => {
    const mockFetch = jest.fn(async (url: string) => {
      if (url.endsWith('/api/onboarding/state')) return { ok: true, json: async () => ({ success: true, data: { done: true, steps: {}, firstSeenAt: null } }) } as any
      return { ok: true, json: async () => ({}) } as any
    })
    ;(global as any).fetch = mockFetch
    ;(window as any).fetch = mockFetch

    const { findByTestId } = render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <DashboardPage />
      </I18nProvider>
    )
    expect(await findByTestId('DashboardContent')).toBeInTheDocument()
  })
})
