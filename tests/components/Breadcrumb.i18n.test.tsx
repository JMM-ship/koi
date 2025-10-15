/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { I18nProvider } from '@/contexts/I18nContext'

describe('Breadcrumb i18n', () => {
  test('renders zh Home label', () => {
    const dict = { common: { home: '首页' } }
    render(
      <I18nProvider locale="zh" dict={dict}>
        <Breadcrumb breadcrumbTitle="设置" />
      </I18nProvider>
    )
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })
})

