/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ApiKeysContent from '@/components/dashboard/ApiKeysContent'
import { I18nProvider } from '@/contexts/I18nContext'
import { PREBUNDLED_DICTIONARIES } from '@/locales'

describe('ApiKeysContent i18n (zh)', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/apikeys') {
        return {
          ok: true,
          json: async () => ({ apiKeys: [{ id: 'k1', title: '开发Key', apiKey: 'sk-****', status: 'active', createdAt: new Date().toISOString() }] })
        } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })
  })

  test('renders Chinese labels for steps and codex guide', async () => {
    render(
      <I18nProvider locale="zh" dict={PREBUNDLED_DICTIONARIES.zh as any}>
        <ApiKeysContent />
      </I18nProvider>
    )

    await waitFor(() => expect(screen.getByText('开发Key')).toBeInTheDocument())

    // Header title should be Chinese
    expect(screen.getAllByText('API 密钥')[0]).toBeInTheDocument()

    // Open Claude guide panel and assert Step 2 Chinese title
    fireEvent.click(screen.getByText('Claude Code'))
    expect(screen.getByText('步骤 2：安装 Claude Code CLI')).toBeInTheDocument()

    // Open Codex guide panel and assert Step 1 and Important
    fireEvent.click(screen.getByText('Codex'))
    expect(screen.getByText('步骤 1：创建 auth.json')).toBeInTheDocument()
    expect(screen.getAllByText('重要')[0]).toBeInTheDocument()
  })
})

