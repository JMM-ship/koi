/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/dashboard/Sidebar'
import { I18nProvider } from '@/contexts/I18nContext'

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'user' } }, status: 'authenticated' }), signOut: jest.fn() }))
jest.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))

describe('Sidebar i18n', () => {
  test('renders zh labels', () => {
    const dictZh = { sidebar: { dashboard: '仪表盘', apiKeys: 'API 密钥', purchasePlans: '购买套餐', referralProgram: '推荐计划', profile: '个人资料' }, toasts: { logoutFailedRetry: '退出登录失败，请重试' } }
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <Sidebar />
      </I18nProvider>
    )
    expect(screen.getByText('仪表盘')).toBeInTheDocument()
    expect(screen.getByText('API 密钥')).toBeInTheDocument()
    expect(screen.getByText('购买套餐')).toBeInTheDocument()
    expect(screen.getByText('推荐计划')).toBeInTheDocument()
    expect(screen.getByText('个人资料')).toBeInTheDocument()
  })
})

