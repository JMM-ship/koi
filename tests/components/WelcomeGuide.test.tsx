/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nProvider } from '@/contexts/I18nContext'
import WelcomeGuide from '@/components/dashboard/WelcomeGuide'

jest.mock('@/lib/track', () => ({ trackOnboardingEvent: jest.fn() }))

const dictZh = {
  onboarding: {
    title: '欢迎使用',
    subtitle: '按照以下步骤快速开始',
    reward: '已发放 {points} 积分',
    step: {
      createKey: '创建 API Key',
      firstCall: '运行一次测试调用',
      choosePlan: '选择套餐/领取试用',
      setLocale: '设置语言',
    },
    cta: {
      createKey: '去创建',
      firstCall: '去试跑',
      choosePlan: '去选择',
      setLocale: '去设置',
      skip: '跳过',
      done: '我已完成',
    },
    tip: {
      inviteReward: '邀请好友可获得奖励',
    },
    state: {
      done: '已完成',
    },
  },
}

function renderZh(ui: React.ReactNode) {
  return render(
    <I18nProvider locale="zh" dict={dictZh as any}>
      {ui}
    </I18nProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  const mockFetch = jest.fn(async (url: string) => {
    if (url.includes('/api/apikeys')) {
      return { ok: true, json: async () => ({ apiKeys: [] }) } as any
    }
    if (url.includes('/api/dashboard')) {
      return { ok: true, json: async () => ({ creditStats: { month: { amount: 0 } }, modelUsages: [] }) } as any
    }
    return { ok: true, json: async () => ({}) } as any
  })
  ;(global as any).fetch = mockFetch
  ;(window as any).fetch = mockFetch
})

describe('WelcomeGuide component', () => {
  test('renders checklist with reward and i18n strings', async () => {
    renderZh(
      <WelcomeGuide
        bonusPoints={100}
        onGotoApiKeys={jest.fn()}
        onGotoPlans={jest.fn()}
        onGotoSetLocale={jest.fn()}
        onGotoProfile={jest.fn()}
        onDismiss={jest.fn()}
      />
    )
    expect(await screen.findByText('欢迎使用')).toBeInTheDocument()
    expect(screen.getByText('已发放 100 积分')).toBeInTheDocument()
    expect(screen.getByText('创建 API Key')).toBeInTheDocument()
    expect(screen.getByText('运行一次测试调用')).toBeInTheDocument()
    expect(screen.getByText('选择套餐/领取试用')).toBeInTheDocument()
    expect(screen.getByText('设置语言')).toBeInTheDocument()
    expect(screen.getByText('邀请好友可获得奖励')).toBeInTheDocument()
  })

  test('skip marks done and calls onDismiss', async () => {
    const onDismiss = jest.fn()
    renderZh(
      <WelcomeGuide
        bonusPoints={50}
        onGotoApiKeys={jest.fn()}
        onGotoPlans={jest.fn()}
        onGotoSetLocale={jest.fn()}
        onGotoProfile={jest.fn()}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(await screen.findByText('跳过'))
    expect(localStorage.getItem('onboard.v1.done')).toBe('1')
    expect(onDismiss).toHaveBeenCalled()
  })

  test('CTA callbacks fire', async () => {
    const onGotoApiKeys = jest.fn()
    const onGotoPlans = jest.fn()
    const onGotoSetLocale = jest.fn()
    renderZh(
      <WelcomeGuide
        bonusPoints={10}
        onGotoApiKeys={onGotoApiKeys}
        onGotoPlans={onGotoPlans}
        onGotoSetLocale={onGotoSetLocale}
        onGotoProfile={jest.fn()}
        onDismiss={jest.fn()}
      />
    )
    fireEvent.click(await screen.findByText('去创建'))
    fireEvent.click(screen.getByText('去选择'))
    fireEvent.click(screen.getByText('去设置'))
    expect(onGotoApiKeys).toHaveBeenCalled()
    expect(onGotoPlans).toHaveBeenCalled()
    expect(onGotoSetLocale).toHaveBeenCalled()
  })

  test('pre-marks steps when user has api key and usage', async () => {
    const mockFetch = jest.fn(async (url: string) => {
      if (url.includes('/api/apikeys')) {
        return { ok: true, json: async () => ({ apiKeys: [{ id: 'k1', status: 'active' }] }) } as any
      }
      if (url.includes('/api/dashboard')) {
        return { ok: true, json: async () => ({ creditStats: { month: { amount: 10 } }, modelUsages: [{ id: 'u1' }] }) } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })
    ;(global as any).fetch = mockFetch
    ;(window as any).fetch = mockFetch

    renderZh(
      <WelcomeGuide
        bonusPoints={10}
        onGotoApiKeys={jest.fn()}
        onGotoPlans={jest.fn()}
        onGotoSetLocale={jest.fn()}
        onGotoProfile={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(2)
    })
  })

  test('admin users do not see the component', async () => {
    renderZh(
      <WelcomeGuide
        isAdmin
        bonusPoints={10}
        onGotoApiKeys={jest.fn()}
        onGotoPlans={jest.fn()}
        onGotoSetLocale={jest.fn()}
        onGotoProfile={jest.fn()}
        onDismiss={jest.fn()}
      />
    )

    expect(screen.queryByText('欢迎使用')).toBeNull()
  })
})
