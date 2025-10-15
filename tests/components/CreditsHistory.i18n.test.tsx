/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import CreditsHistory from '@/components/dashboard/CreditsHistory'
import { I18nProvider } from '@/contexts/I18nContext'

describe('CreditsHistory i18n', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.startsWith('/api/credits/transactions')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { transactions: [
            { id: 't1', createdAt: new Date().toISOString(), type: 'income', bucket: 'independent', points: 500, reason: '新用户注册奖励' },
          ] } }),
        } as any
      }
      throw new Error('unexpected fetch ' + url)
    })
  })

  afterEach(() => {
    ;(global as any).fetch = undefined
  })

  test('renders row in English (mapped via dictionary)', async () => {
    const dictEn = { dashboard: { creditsHistory: { title: 'Credits History', loading: 'Loading...', empty: 'No records' } }, reasons: { newUserBonus: 'New user signup bonus' }, buckets: { independent: 'Independent', package: 'Package' } }
    render(
      <I18nProvider locale="en" dict={dictEn}>
        <CreditsHistory />
      </I18nProvider>
    )
    await waitFor(() => expect(screen.getByText('New user signup bonus')).toBeInTheDocument())
  })

  test('renders row in Chinese (mapped via dictionary)', async () => {
    const dictZh = { dashboard: { creditsHistory: { title: '积分流水', loading: '加载中...', empty: '暂无记录' } }, reasons: { newUserBonus: '新用户注册奖励' }, buckets: { independent: '独立', package: '套餐' } }
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <CreditsHistory />
      </I18nProvider>
    )
    await waitFor(() => expect(screen.getByText('新用户注册奖励')).toBeInTheDocument())
  })
})

