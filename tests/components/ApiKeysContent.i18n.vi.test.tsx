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

    // Switch to macOS and expect same Vietnamese step 2
    fireEvent.click(screen.getByText('macOS'))
    expect(await screen.findByText('Bước 2: Cài Claude Code CLI')).toBeInTheDocument()

    // Open Codex guide panel
    fireEvent.click(screen.getByText('Codex'))
    // Codex guide: Step 1 title should be Vietnamese
    expect(screen.getByText('Bước 1: Tạo auth.json')).toBeInTheDocument()
    // Important label should be Vietnamese
    expect(screen.getAllByText('Quan trọng')[0]).toBeInTheDocument()
  })
})
