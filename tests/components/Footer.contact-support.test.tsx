/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Footer from '@/components/layout/footer/Footer'
import { I18nProvider } from '@/contexts/I18nContext'

describe('Footer contact support trigger', () => {
  test('renders link and opens modal on click', () => {
    const dictZh = {
      common: {
        support: {
          actionLink: '联系客服（扫码）',
          modalTitle: '联系客服',
          modalSubtitle: '扫码加入我们的 Discord 客服频道',
          qrAlt: 'Discord 客服二维码',
        },
      },
    }

    render(
      <I18nProvider locale="zh" dict={dictZh as any}>
        <Footer />
      </I18nProvider>
    )

    const link = screen.getByText('联系客服（扫码）')
    expect(link).toBeInTheDocument()
    fireEvent.click(link)
    expect(screen.getByText('联系客服')).toBeInTheDocument()
    expect(screen.getByAltText('Discord 客服二维码')).toBeInTheDocument()
  })
})

