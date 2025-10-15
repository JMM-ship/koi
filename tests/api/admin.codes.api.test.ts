import { GET as AdminCodesGET } from '@/app/api/admin/codes/route'
import { POST as AdminCodesGenPOST } from '@/app/api/admin/codes/generate/route'
import { PUT as AdminCodePUT } from '@/app/api/admin/codes/[code]/route'

jest.mock('@/app/auth/helpers', () => ({
  auth: jest.fn(async () => ({ user: { id: 'admin1', role: 'admin' } }))
}))

jest.mock('@/app/models/db', () => {
  return {
    prisma: {
      redemptionCode: {
        findMany: jest.fn(async () => ([{ id: '1', code: 'KOI-XXXX', codeType: 'plan', codeValue: 'pro', validDays: 30, status: 'active', batchId: null, createdAt: new Date(), usedAt: null, usedBy: null, expiresAt: null, notes: null }])),
        count: jest.fn(async () => 1),
        create: jest.fn(async () => ({ id: 'new' })),
        findUnique: jest.fn(async ({ where }: any) => where.code === 'EXIST' ? ({ code: 'EXIST', status: 'active' }) : null),
        update: jest.fn(async ({ data }: any) => ({ ...data })),
        updateMany: jest.fn(async () => ({ count: 1 })),
      }
    }
  }
})

describe('Admin Codes APIs', () => {
  test('GET list returns data', async () => {
    const req = { nextUrl: { searchParams: new URLSearchParams('page=1&limit=10') } } as any
    const res = await AdminCodesGET(req)
    const data = await (res as any).json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  test('POST generate inserts codes', async () => {
    const res = await AdminCodesGenPOST({ json: async () => ({ codeType: 'plan', codeValue: 'pro', quantity: 2, validDays: 30, prefix: 'KOI' }) } as any)
    const data = await (res as any).json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.count).toBeGreaterThan(0)
  })

  test('PUT update status', async () => {
    const res = await AdminCodePUT({ json: async () => ({ status: 'cancelled' }) } as any, { params: { code: 'EXIST' } } as any)
    const data = await (res as any).json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

