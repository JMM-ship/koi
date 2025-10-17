/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ApiKeysContent from '@/components/dashboard/ApiKeysContent'
import { I18nProvider } from '@/contexts/I18nContext'
import { PREBUNDLED_DICTIONARIES } from '@/locales'

describe('ApiKeysContent i18n (vi)', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/apikeys') {
        return {
          ok: true,
          json: async () => ({ apiKeys: [{ id: 'k1', title: 'Dev Key', apiKey: 'sk-****', status: 'active', createdAt: new Date().toISOString() }] })
        } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })
  })

  test('renders Vietnamese labels for steps and codex guide', async () => {
    render(
      <I18nProvider locale="vi" dict={PREBUNDLED_DICTIONARIES.vi as any}>
        <ApiKeysContent />
      </I18nProvider>
    )

    // waits for list rendering
    await waitFor(() => expect(screen.getByText('Dev Key')).toBeInTheDocument())

    // Page header uses translated label (sidebar.apiKeys -> Khóa API)
    expect(screen.getAllByText('Khóa API')[0]).toBeInTheDocument()

    // Open Claude guide panel
    fireEvent.click(screen.getByText('Claude Code'))
    // Windows tab default: Step 2 should be Vietnamese
    expect(screen.getByText('Bước 2: Cài Claude Code CLI')).toBeInTheDocument()

    // macOS options
    fireEvent.click(screen.getByText('macOS'))
    expect(screen.getByText('Cách 1 (Khuyến nghị): Dùng Homebrew.')).toBeInTheDocument()
    expect(screen.getByText('Cách 2: Tải trình cài đặt LTS (.pkg) từ https://nodejs.org và làm theo hướng dẫn.')).toBeInTheDocument()
    expect(screen.getAllByText('Xác minh cài đặt:')[0]).toBeInTheDocument()

    // Open Codex guide panel
    fireEvent.click(screen.getByText('Codex'))
    // Codex guide: Usage Note + Step 1 title should be Vietnamese
    expect(screen.getByText('Lưu ý sử dụng')).toBeInTheDocument()
    expect(screen.getByText('Bước 1: Tạo auth.json')).toBeInTheDocument()
    // Important label should be Vietnamese
    expect(screen.getAllByText('Quan trọng')[0]).toBeInTheDocument()
  })
})
