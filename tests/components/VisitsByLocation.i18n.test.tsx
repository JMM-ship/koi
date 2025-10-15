/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import CurrentPlan from '@/components/dashboard/VisitsByLocation'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock dashboard contexts to provide plan data
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ data: { creditBalance: { packageCredits: 1000 } }, isLoading: false }),
  useUserInfo: () => ({ planExpiredAt: new Date(Date.now() + 7*24*60*60*1000).toISOString() }),
  useUserPackage: () => ({
    endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    startDate: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
    packageName: 'Plus',
    dailyCredits: 100,
    features: { creditCap: 100, recoveryRate: 10, dailyUsageLimit: 100, manualResetPerDay: 1 },
    price: 9.99
  })
}))

describe('CurrentPlan i18n (zh)', () => {
  test('渲染中文标题与按钮', () => {
    const dictZh = {
      dashboard: {
        planCard: {
          currentPlan: '当前套餐',
          credit: '积分',
          dailyCredit: '每日积分',
          subscriptionPeriod: '订阅周期',
          startDate: '开始日期',
          endDate: '结束日期',
          features: '功能',
          upgrade: '升级',
          renew: '续费',
          month: '月'
        }
      }
    }
    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <CurrentPlan />
      </I18nProvider>
    )
    expect(screen.getByText('当前套餐')).toBeInTheDocument()
    expect(screen.getByText('升级')).toBeInTheDocument()
    expect(screen.getByText('续费')).toBeInTheDocument()
  })
})
