/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nProvider } from '@/contexts/I18nContext'
import NoUsageCallout from '@/components/dashboard/NoUsageCallout'

const dictZh = {
  onboarding: { callout: { noUsage: { title: '还没有使用记录', desc: '创建一个 API Key 并运行一次测试调用，开始记录你的使用情况。', cta: '去创建 API Key' } } }
}

function renderZh(ui: React.ReactNode) {
  return render(
    <I18nProvider locale="zh" dict={dictZh as any}>
      {ui}
    </I18nProvider>
  )
}

test('NoUsageCallout renders copy and triggers CTA', () => {
  const onCreate = jest.fn()
  renderZh(<NoUsageCallout onCreateApiKey={onCreate} />)
  expect(screen.getByText('还没有使用记录')).toBeInTheDocument()
  expect(screen.getByText('创建一个 API Key 并运行一次测试调用，开始记录你的使用情况。')).toBeInTheDocument()
  fireEvent.click(screen.getByText('去创建 API Key'))
  expect(onCreate).toHaveBeenCalled()
})

