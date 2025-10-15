/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IndependentPackages from '@/components/dashboard/IndependentPackages'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock SWR packages
beforeEach(() => {
  ;(global as any).fetch = jest.fn(async (url: string) => {
    if (url.startsWith('/api/packages/credits')) {
      return { ok: true, json: async () => ({ data: { packages: [ { id: 'p1', name: 'Pack 1', credits: 1000, price: 9.99 } ] } }) } as any
    }
    if (url.startsWith('/api/orders/create')) {
      return { ok: true, json: async () => ({ success: false }) } as any
    }
    return { ok: true, json: async () => ({}) } as any
  })
})

// Intercept toasts
const calls: string[] = []
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ showError: (m: string) => calls.push(m), showLoading: (m: string) => (calls.push(m), 'tid'), dismiss: () => {} }) }))

describe('IndependentPackages toasts i18n', () => {
  beforeEach(() => { calls.length = 0 })
  test('failed create order uses zh toast', async () => {
    const dictZh = { toasts: { failedCreateOrder: '创建订单失败', selectCreditPackage: '请选择积分套餐', processingPurchaseRequest: '正在处理购买请求...' }, packages: { chooseYourPackage: '选择套餐', loadingPackages: '正在加载套餐...', credits: '积分', cardPayment: '银行卡支付', processing: '处理中...' } }
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <IndependentPackages onBack={() => {}} />
      </I18nProvider>
    )
    // wait packages load
    await waitFor(() => expect(screen.getByText('Pack 1')).toBeInTheDocument())
    // select package
    fireEvent.click(screen.getByText('Pack 1'))
    // click Card Payment
    fireEvent.click(screen.getByText('银行卡支付'))
    await waitFor(() => expect(calls.some(m => m.includes('创建订单失败'))).toBe(true))
  })
})

