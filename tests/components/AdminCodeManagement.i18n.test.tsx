/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AdminCodeManagement from '@/components/dashboard/admin/AdminCodeManagement'
import { I18nProvider } from '@/contexts/I18nContext'

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'admin' } }, status: 'authenticated' }) }))
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))

beforeEach(() => {
  ;(global as any).fetch = jest.fn(async (url: string) => {
    if (url.startsWith('/api/admin/codes?')) {
      return { ok: true, json: async () => ({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }) } as any
    }
    return { ok: true, json: async () => ({}) } as any
  })
})

describe('AdminCodeManagement i18n', () => {
  test('renders zh labels', async () => {
    const dictZh = { admin: { codes: { title: '卡密管理', subtitle: '生成和管理兑换卡密', generate: '生成卡密', searchPlaceholder: '搜索卡密编码...', prev: '上一页', next: '下一页', table: { code: '卡密编码', value: '值', type: '类型', status: '状态', actions: '操作', batchId: '批次ID', createdAt: '创建时间', usedAt: '使用时间', usedBy: '使用者' } } } }
    render(
      <I18nProvider locale="zh" dict={dictZh}>
        <AdminCodeManagement />
      </I18nProvider>
    )
    await waitFor(() => expect(screen.getByText('卡密管理')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByText('生成卡密')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('搜索卡密编码...')).toBeInTheDocument()
    expect(screen.getByText('卡密编码')).toBeInTheDocument()
  })
})
