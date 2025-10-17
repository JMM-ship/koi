/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { I18nProvider } from '@/contexts/I18nContext'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (_k: string) => '1' }),
}))

jest.mock('@/components/dashboard/Sidebar', () => () => <div data-testid="Sidebar" />)
jest.mock('@/components/dashboard/DashboardContent', () => (props: any) => <div data-testid="DashboardContent">DashboardContent</div>)

const dictZh = { onboarding: { title: '欢迎使用', subtitle: '按照以下步骤快速开始', reward: '已发放 {points} 积分', cta: { skip: '跳过', done: '我已完成', createKey: '去创建', firstCall: '去试跑', choosePlan: '去选择', setLocale: '去设置' }, step: { createKey: '创建 API Key', firstCall: '运行一次测试调用', choosePlan: '选择套餐/领取试用', setLocale: '设置语言' }, tip: { inviteReward: '邀请好友可获得奖励' }, state: { done: '已完成' } } }

beforeEach(() => {
  localStorage.clear()
})

test('hides guide when server reports done=true', async () => {
  const mockFetch = jest.fn(async (url: string) => {
    if (url.endsWith('/api/onboarding/state')) return { ok: true, json: async () => ({ success: true, data: { done: true, steps: {}, firstSeenAt: null } }) } as any
    if (url.includes('/api/apikeys')) return { ok: true, json: async () => ({ apiKeys: [] }) } as any
    if (url.includes('/api/dashboard')) return { ok: true, json: async () => ({ creditStats: { month: { amount: 0 } }, modelUsages: [] }) } as any
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).fetch = mockFetch
  ;(window as any).fetch = mockFetch

  render(
    <I18nProvider locale="zh" dict={dictZh as any}>
      <DashboardPage />
    </I18nProvider>
  )

  await waitFor(() => {
    expect(screen.queryByText('欢迎使用')).toBeNull()
  })
})

test('skip posts server state', async () => {
  const postCalls: any[] = []
  const mockFetch = jest.fn(async (url: string, init?: any) => {
    if (url.endsWith('/api/onboarding/state') && (!init || init.method === undefined)) return { ok: true, json: async () => ({ success: true, data: { done: false, steps: {}, firstSeenAt: null } }) } as any
    if (url.endsWith('/api/onboarding/state') && init?.method === 'POST') { postCalls.push(JSON.parse(init.body)); return { ok: true, json: async () => ({ success: true }) } as any }
    if (url.includes('/api/apikeys')) return { ok: true, json: async () => ({ apiKeys: [] }) } as any
    if (url.includes('/api/dashboard')) return { ok: true, json: async () => ({ creditStats: { month: { amount: 0 } }, modelUsages: [] }) } as any
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).fetch = mockFetch
  ;(window as any).fetch = mockFetch

  render(
    <I18nProvider locale="zh" dict={dictZh as any}>
      <DashboardPage />
    </I18nProvider>
  )

  const title = await screen.findByText('欢迎使用')
  expect(title).toBeInTheDocument()
  // 点击跳过
  fireEvent.click(screen.getByText('跳过'))
  await waitFor(() => expect(postCalls.length).toBeGreaterThan(0))
  expect(postCalls[0]).toMatchObject({ done: true })
})
