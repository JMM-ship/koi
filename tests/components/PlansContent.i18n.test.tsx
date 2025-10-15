/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import PlansContent from '@/components/dashboard/PlansContent'
import { I18nProvider } from '@/contexts/I18nContext'

// Minimal mocks for external deps
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }))
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))

// Mock SWR data for /api/packages
beforeEach(() => {
  ;(global as any).fetch = jest.fn(async (url: string) => {
    if (url.startsWith('/api/packages')) {
      return {
        ok: true,
        json: async () => ({ data: { packages: [
          { id: 'p_plus', name: 'Plus', planType: 'basic', priceCents: 9900, dailyPoints: 100, validDays: 30, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' },
          { id: 'p_max', name: 'Max', planType: 'enterprise', priceCents: 19900, dailyPoints: 300, validDays: 30, isActive: true, sortOrder: 2, features: { isRecommended: true }, createdAt: '', updatedAt: '' },
        ] } })
      } as any
    }
    return { ok: true, json: async () => ({}) } as any
  })
})

describe('PlansContent i18n', () => {
  test('renders header and labels in English', async () => {
    const dictEn = {
      packages: {
        pricingTitle: 'Pricing Plans',
        pricingSubtitle: "Base plan $200 Max account, monthly pricing is 28% of base, best value",
        important: 'Important:',
        pricingFollowClaude: "During subscription period, the pricing will follow Claude's official adjustments (non-member, non-platform pricing)",
        perMonth: '/month',
        mostPopular: 'Most Popular',
        choosePlan: 'Choose Plan',
        renew: 'Renew',
        upgrade: 'Upgrade',
      }
    }
    render(
      <I18nProvider locale="en" dict={dictEn}>
        <PlansContent />
      </I18nProvider>
    )
    await waitFor(() => expect(screen.getByText('Pricing Plans')).toBeInTheDocument())
    expect(screen.getByText('Important:')).toBeInTheDocument()
  })

  test('renders header and labels in Chinese', async () => {
    const dictZh = {
      packages: {
        pricingTitle: '定价方案',
        pricingSubtitle: '基础档 Max 账户为 $200，月付为基础价的 28%，性价比更高',
        important: '重要提示：',
        pricingFollowClaude: '订阅期间，价格将跟随 Claude 官方（非会员、非平台价）调整',
        perMonth: '／月',
        mostPopular: '最受欢迎',
        choosePlan: '选择套餐',
        renew: '续费',
        upgrade: '升级',
      }
    }
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <PlansContent />
      </I18nProvider>
    )
    await waitFor(() => expect(screen.getByText('定价方案')).toBeInTheDocument())
    expect(screen.getByText('重要提示：')).toBeInTheDocument()
  })
})

