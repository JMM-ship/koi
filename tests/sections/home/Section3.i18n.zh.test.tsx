/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Section3 from '@/components/sections/home/Section3'
import { I18nProvider } from '@/contexts/I18nContext'
import { PREBUNDLED_DICTIONARIES } from '@/locales'

describe('Home Section3 i18n (zh)', () => {
  test('renders Chinese titles and descriptions for advantages and guarantees', () => {
    render(
      <I18nProvider locale="zh" dict={PREBUNDLED_DICTIONARIES.zh as any}>
        <Section3 />
      </I18nProvider>
    )
    // Feature cards
    expect(screen.getByText('零限速切换')).toBeInTheDocument()
    expect(screen.getByText('触达限速即时切换，无需等待')).toBeInTheDocument()
    expect(screen.getByText('完全兼容')).toBeInTheDocument()
    expect(screen.getByText('与官方 API 响应格式一致，完美兼容')).toBeInTheDocument()

    // Service guarantee block
    expect(screen.getByText('服务保障')).toBeInTheDocument()
    expect(screen.getByText('响应速度')).toBeInTheDocument()
    expect(screen.getAllByText('与官方直连一致').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('数据格式')).toBeInTheDocument()
    expect(screen.getByText('模型能力')).toBeInTheDocument()
  })
})

