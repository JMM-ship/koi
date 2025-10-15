/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RedeemCodeCard from '@/components/dashboard/RedeemCodeCard'
import { I18nProvider } from '@/contexts/I18nContext'

// 捕获通过 props 传入的 toast 文案
const calls: string[] = []
const toastProxy = {
  showSuccess: (m: string) => calls.push(m),
  showError: (m: string) => calls.push(m),
  showWarning: (m: string) => calls.push(m),
  showInfo: (m: string) => calls.push(m),
}

// 复位 fetch 和 calls
beforeEach(() => {
  ;(global as any).fetch = jest.fn(async (url: string) => ({ ok: true, json: async () => ({}) }))
  calls.length = 0
})

const dictZh = {
  dashboard: {
    redeem: {
      title: '兑换码',
      format: '格式：KOI-ABCD-EFGH-IJKL',
      placeholder: '请输入兑换码',
      paste: '粘贴',
      clear: '清除',
      redeem: '兑换',
      redeeming: '兑换中...',
      tipEmpty: '提示：粘贴兑换码或直接输入（自动转大写）',
      tipLooksGood: '格式良好，可以兑换',
      tipInvalid: '格式不正确，例如：KOI-ABCD-EFGH-IJKL',
    }
  },
  toasts: {
    clipboardNotAvailable: '剪贴板不可用',
    failedReadClipboard: '读取剪贴板失败',
    invalidRedeemCodeFormat: '请输入有效的卡密格式',
    redeemedSuccessfullyPlanUpdated: '兑换成功，套餐已更新',
    failedRedeemCode: '兑换失败',
    redeemFailedTryLater: '兑换失败，请稍后再试'
  }
}

describe('RedeemCodeCard i18n (zh)', () => {
  test('渲染中文 UI 文案', async () => {
    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <RedeemCodeCard mutatePackages={() => {}} toast={toastProxy} />
      </I18nProvider>
    )

    expect(screen.getByText('兑换码')).toBeInTheDocument()
    expect(screen.getByText('格式：KOI-ABCD-EFGH-IJKL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入兑换码')).toBeInTheDocument()
    expect(screen.getByTitle('粘贴')).toBeInTheDocument()
    // 清除按钮只有有输入时出现，这里不强制断言
  })

  test('无效格式触发中文提示 toast', async () => {
    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <RedeemCodeCard mutatePackages={() => {}} toast={toastProxy} />
      </I18nProvider>
    )
    const input = screen.getByPlaceholderText('请输入兑换码') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ABC' } })
    fireEvent.click(screen.getByText('兑换'))
    await waitFor(() => expect(calls.some(m => m.includes('请输入有效的卡密格式'))).toBe(true))
  })

  test('兑换成功触发中文成功 toast 并清空输入', async () => {
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/codes/redeem') {
        return { ok: true, json: async () => ({ success: true }) } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })

    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <RedeemCodeCard mutatePackages={() => {}} toast={toastProxy} />
      </I18nProvider>
    )

    const input = screen.getByPlaceholderText('请输入兑换码') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'KOI-ABCD-EFGH-IJKL' } })
    fireEvent.click(screen.getByText('兑换'))

    await waitFor(() => expect(calls.some(m => m.includes('兑换成功，套餐已更新'))).toBe(true))
    expect(input.value).toBe('')
  })
})
