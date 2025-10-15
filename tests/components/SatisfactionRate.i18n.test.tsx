/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import SatisfactionRate from '@/components/dashboard/SatisfactionRate'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock echarts
jest.mock('echarts', () => ({
  init: () => ({ setOption: jest.fn(), resize: jest.fn(), dispose: jest.fn() })
}))

// Mock dashboard contexts
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ data: { creditBalance: { packageCredits: 1000, independentCredits: 0, totalUsed: 100 } }, isLoading: false, refreshData: jest.fn() }),
  useCreditBalance: () => ({ packageCredits: 1000, independentCredits: 0, totalUsed: 100 }),
  useUserInfo: () => ({})
}))

describe('SatisfactionRate i18n (zh)', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string) => ({ ok: true, json: async () => ({}) }))
  })
  test('渲染中文标题与按钮', () => {
    const dictZh = {
      dashboard: {
        creditsBalance: {
          title: '积分余额',
          resetToCap: '手动重置到上限',
          resetting: '重置中...'
        }
      }
    }
    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <SatisfactionRate />
      </I18nProvider>
    )
    expect(screen.getByText('积分余额')).toBeInTheDocument()
    expect(screen.getByText('手动重置到上限')).toBeInTheDocument()
  })
})
