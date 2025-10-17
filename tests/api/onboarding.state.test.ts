/** @jest-environment node */

// Mock next-auth session
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
import { getServerSession } from 'next-auth'

// In-memory store to mimic DB table user_meta
const store: Record<string, any> = {}

// Mock prisma raw methods used by the route
jest.mock('@/app/models/db', () => {
  return {
    prisma: {
      $executeRawUnsafe: jest.fn(async (sql: string, ...params: any[]) => {
        if (/CREATE TABLE IF NOT EXISTS user_meta/i.test(sql)) return 0
        if (/INSERT INTO user_meta/i.test(sql)) {
          const userId = params[0]
          const data = params[1]
          store[userId] = { data }
          return 1
        }
        if (/UPDATE user_meta/i.test(sql)) {
          const data = params[0]
          const userId = params[1]
          store[userId] = { data }
          return 1
        }
        return 0
      }),
      $queryRawUnsafe: jest.fn(async (sql: string, ...params: any[]) => {
        if (/SELECT data FROM user_meta/i.test(sql)) {
          const userId = params[0]
          const row = store[userId]
          return row ? [{ data: row.data }] : []
        }
        return []
      }),
    },
  }
})

describe('Onboarding state API', () => {
  beforeEach(() => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', uuid: 'u1', email: 'u@test.com' } })
    for (const k of Object.keys(store)) delete store[k]
  })

  test('GET returns default when no state present', async () => {
    const { GET } = await import('@/app/api/onboarding/state/route')
    const res = await GET({} as any)
    const body = await (res as any).json()
    expect(body.success).toBe(true)
    expect(body.data.done).toBe(false)
    expect(typeof body.data.steps).toBe('object')
  })

  test('POST upserts state and GET returns it', async () => {
    const { POST, GET } = await import('@/app/api/onboarding/state/route')
    const payload = { done: true, steps: { createKey: true, firstCall: true }, firstSeenAt: '2025-01-01T00:00:00.000Z' }
    const req: any = { json: async () => payload }
    const postRes = await POST(req as any)
    const postBody = await (postRes as any).json()
    expect(postBody.success).toBe(true)
    expect(store['u1']?.data?.onboarding?.done).toBe(true)
    const getRes = await GET({} as any)
    const getBody = await (getRes as any).json()
    expect(getBody.data.done).toBe(true)
    expect(getBody.data.steps.createKey).toBe(true)
    expect(getBody.data.firstSeenAt).toBe('2025-01-01T00:00:00.000Z')
  })
})

