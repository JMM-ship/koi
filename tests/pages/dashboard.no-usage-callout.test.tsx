/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock search params: no welcome param
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (_k: string) => null }),
  useRouter: () => ({ replace: jest.fn() }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

// Stub heavy components
jest.mock('@/components/dashboard/Sidebar', () => () => <div data-testid="Sidebar" />)
jest.mock('@/components/dashboard/DashboardContent', () => jest.requireActual('@/components/dashboard/DashboardContent'))
jest.mock('@/components/dashboard/VisitsByLocation', () => () => <div>VisitsByLocation</div>)
jest.mock('@/components/dashboard/WorkSummaryChart', () => () => <div>WorkSummaryChart</div>)
jest.mock('@/components/dashboard/SatisfactionRate', () => () => <div>SatisfactionRate</div>)
jest.mock('@/components/dashboard/ApiKeysContent', () => () => <div>ApiKeysContent</div>)
jest.mock('@/components/dashboard/PlansContent', () => () => <div>PlansContent</div>)
jest.mock('@/components/dashboard/ProfileContent', () => () => <div>ProfileContent</div>)
jest.mock('@/components/dashboard/ReferralContent', () => () => <div>ReferralContent</div>)

beforeEach(() => {
  localStorage.clear()
  // within 7 days window so WelcomeGuide could show but we won't have welcome param
  localStorage.setItem('onboard.v1.firstSeenAt', new Date().toISOString())
  // No usage
  const mockFetch = jest.fn(async (url: string) => {
    if (url.endsWith('/api/onboarding/state')) return { ok: true, json: async () => ({ success: true, data: { done: true, steps: {}, firstSeenAt: null } }) } as any
    if (url.includes('/api/apikeys')) return { ok: true, json: async () => ({ apiKeys: [] }) } as any
    if (url.includes('/api/dashboard')) return { ok: true, json: async () => ({ creditStats: { month: { amount: 0 } }, modelUsages: [] }) } as any
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).fetch = mockFetch
  ;(window as any).fetch = mockFetch
})

const dictZh = {
  onboarding: {
    title: '欢迎使用', subtitle: '按照以下步骤快速开始', reward: '已发放 {points} 积分',
    callout: { noUsage: { title: '还没有使用记录', desc: '创建一个 API Key 并运行一次测试调用，开始记录你的使用情况。', cta: '去创建 API Key' } },
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

test('No-usage callout is hidden by default', async () => {
  renderPage()
  // 由于默认隐藏空状态引导，不应渲染该提示
  await waitFor(() => {
    expect(screen.queryByText('还没有使用记录')).toBeNull()
  })
})
