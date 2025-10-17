/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock search params
const sp: Record<string, string | null> = { welcome: '1' }

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (k: string) => (k in sp ? sp[k] : null) }),
}))

// Stub heavy child components to keep test light
jest.mock('@/components/dashboard/Sidebar', () => () => <div data-testid="Sidebar" />)
jest.mock('@/components/dashboard/DashboardContent', () => (props: any) => <div data-testid="DashboardContent">DashboardContent</div>)
jest.mock('@/components/dashboard/ApiKeysContent', () => () => <div>ApiKeysContent</div>)
jest.mock('@/components/dashboard/PlansContent', () => () => <div>PlansContent</div>)
jest.mock('@/components/dashboard/ProfileContent', () => () => <div>ProfileContent</div>)
jest.mock('@/components/dashboard/ReferralContent', () => () => <div>ReferralContent</div>)

// Mock fetch for WelcomeGuide pre-marking; default: no keys, no usage
beforeEach(() => {
  localStorage.clear()
  const mockFetch = jest.fn(async (url: string) => {
    if (url.includes('/api/apikeys')) return { ok: true, json: async () => ({ apiKeys: [] }) } as any
    if (url.includes('/api/dashboard')) return { ok: true, json: async () => ({ creditStats: { month: { amount: 0 } }, modelUsages: [] }) } as any
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).fetch = mockFetch
  ;(window as any).fetch = mockFetch
  sp.welcome = '1'
})

const dictZh = {
  onboarding: {
    title: '欢迎使用', subtitle: '按照以下步骤快速开始', reward: '已发放 {points} 积分',
    step: { createKey: '创建 API Key', firstCall: '运行一次测试调用', choosePlan: '选择套餐/领取试用', setLocale: '设置语言' },
    cta: { createKey: '去创建', firstCall: '去试跑', choosePlan: '去选择', setLocale: '去设置', skip: '跳过', done: '我已完成' },
    tip: { inviteReward: '邀请好友可获得奖励' }, state: { done: '已完成' },
  },
}

function renderPage() {
  return render(
    <I18nProvider locale="zh" dict={dictZh as any}>
      <DashboardPage />
    </I18nProvider>
  )
}

describe('Dashboard integration - WelcomeGuide visibility and navigation', () => {
  test('shows WelcomeGuide when welcome=1 and navigates to api-keys on CTA', async () => {
    renderPage()
    expect(await screen.findByText('欢迎使用')).toBeInTheDocument()
    fireEvent.click(screen.getByText('去创建'))
    // 切换到 api-keys 后，页面内容中包含 ApiKeysContent 占位
    await waitFor(() => expect(screen.getByText('ApiKeysContent')).toBeInTheDocument())
  })

  test('does not show when onboard.v1.done=1 even if welcome=1', async () => {
    localStorage.setItem('onboard.v1.done', '1')
    renderPage()
    expect(screen.queryByText('欢迎使用')).toBeNull()
  })

  test('does not show when 7-day window has passed and no welcome param', async () => {
    sp.welcome = null
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem('onboard.v1.firstSeenAt', eightDaysAgo)
    renderPage()
    expect(screen.queryByText('欢迎使用')).toBeNull()
  })
})
