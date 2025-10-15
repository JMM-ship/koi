/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { I18nProvider } from '@/contexts/I18nContext'

describe('ConfirmDialog i18n', () => {
  test('renders default labels in English', () => {
    const dict = { common: { confirm: 'Confirm', cancel: 'Cancel' } }
    render(
      <I18nProvider locale="en" dict={dict}>
        <ConfirmDialog isOpen message="Delete?" onConfirm={() => {}} onCancel={() => {}} />
      </I18nProvider>
    )
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  test('renders default labels in Chinese', () => {
    const dict = { common: { confirm: '确认', cancel: '取消' } }
    render(
      <I18nProvider locale="zh" dict={dict}>
        <ConfirmDialog isOpen message="删除？" onConfirm={() => {}} onCancel={() => {}} />
      </I18nProvider>
    )
    expect(screen.getByText('确认')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })
})

