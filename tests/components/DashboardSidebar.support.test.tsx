/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nProvider } from '@/contexts/I18nContext'

// Mocks for next-auth and navigation
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'user' } }, status: 'authenticated' }),
  signOut: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}))

describe('Dashboard Sidebar - Support entry', () => {
  test('renders 支持入口 and opens QR modal on click', () => {
    const Sidebar = require('@/components/dashboard/Sidebar').default
    const dictZh = {
      sidebar: {
        dashboard: '仪表盘',
        apiKeys: 'API 密钥',
        purchasePlans: '购买套餐',
        referralProgram: '推荐计划',
        profile: '个人资料',
        support: '客服援助',
      },
      common: {
        support: {
          modalTitle: '联系客服',
          modalSubtitle: '扫码加入我们的 Discord 客服频道',
          qrAlt: 'Discord 客服二维码',
        },
      },
      toasts: { logoutFailedRetry: '退出登录失败，请重试' },
    }

    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <Sidebar activeTab="referral" />
      </I18nProvider>
    )

    const supportItem = screen.getByText('客服援助')
    expect(supportItem).toBeInTheDocument()

    fireEvent.click(supportItem)
    expect(screen.getByText('联系客服')).toBeInTheDocument()
    expect(screen.getByAltText('Discord 客服二维码')).toBeInTheDocument()
  })
})

