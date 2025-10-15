import { NextResponse } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/app/models/db', () => ({ prisma: { user: { update: jest.fn() } } }))

describe('POST /api/profile/locale', () => {
  test('401 when unauthenticated', async () => {
    const { getServerSession } = await import('next-auth') as any
    getServerSession.mockResolvedValue(null)
    const mod = await import('@/app/api/profile/locale/route')
    const req = new Request('http://localhost/api/profile/locale', { method: 'POST', body: JSON.stringify({ locale: 'zh' }) })
    const res: any = await mod.POST(req as any)
    expect(res).toBeInstanceOf(NextResponse as any)
    expect(res.status).toBe(401)
  })

  test('422 when invalid locale', async () => {
    const { getServerSession } = await import('next-auth') as any
    getServerSession.mockResolvedValue({ user: { email: 'u@e' } })
    const mod = await import('@/app/api/profile/locale/route')
    const req = new Request('http://localhost/api/profile/locale', { method: 'POST', body: JSON.stringify({ locale: 'jp' }) })
    const res: any = await mod.POST(req as any)
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.error?.code).toBe('INVALID_LOCALE')
  })

  test('200 and updates user.locale when valid', async () => {
    const { getServerSession } = await import('next-auth') as any
    getServerSession.mockResolvedValue({ user: { email: 'u@e' } })
    const { prisma } = await import('@/app/models/db') as any
    prisma.user.update.mockResolvedValue({ id: 'uid', email: 'u@e', locale: 'zh' })
    const mod = await import('@/app/api/profile/locale/route')
    const req = new Request('http://localhost/api/profile/locale', { method: 'POST', body: JSON.stringify({ locale: 'zh' }) })
    const res: any = await mod.POST(req as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(prisma.user.update).toHaveBeenCalled()
  })
})

