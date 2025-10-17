/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Section3 from '@/components/sections/home/Section3'
import { I18nProvider } from '@/contexts/I18nContext'
import { PREBUNDLED_DICTIONARIES } from '@/locales'

describe('Home Section3 i18n (vi)', () => {
  test('renders Vietnamese titles and descriptions for advantages and guarantees', () => {
    render(
      <I18nProvider locale="vi" dict={PREBUNDLED_DICTIONARIES.vi as any}>
        <Section3 />
      </I18nProvider>
    )
    // Feature cards
    expect(screen.getByText('Không giới hạn tốc độ')).toBeInTheDocument()
    expect(screen.getByText('Chuyển ngay khi chạm giới hạn, không cần chờ')).toBeInTheDocument()
    expect(screen.getByText('Tương thích hoàn toàn')).toBeInTheDocument()
    expect(screen.getByText('Định dạng phản hồi giống hệt API chính thức, tương thích hoàn hảo')).toBeInTheDocument()

    // Service guarantee block
    expect(screen.getByText('Cam kết dịch vụ')).toBeInTheDocument()
    expect(screen.getByText('Tốc độ phản hồi')).toBeInTheDocument()
    expect(screen.getAllByText('Tương đương khi dùng dịch vụ chính thức').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Định dạng dữ liệu')).toBeInTheDocument()
    expect(screen.getByText('Năng lực mô hình')).toBeInTheDocument()
  })
})

