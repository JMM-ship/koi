import { prisma } from '@/app/models/db'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

import { v4 as uuidv4v } from 'uuid'
const testUserId = uuidv4v()

jest.mock('@/lib/auth-light', () => ({
  getAuthLight: jest.fn(async () => ({ uuid: (global as any).__TEST_USER_ID__ }))
}))

describe('GET /api/apikeys (light list, no full decrypt)', () => {
  const userId = testUserId
  const email = `test-apikeys-get-${Date.now()}@example.com`

  beforeAll(async () => {
    // Ensure user exists
    ;(global as any).__TEST_USER_ID__ = userId
    try {
      await prisma.user.create({ data: { id: userId, email, nickname: 'T', role: 'user', status: 'active', planType: 'free' } })
    } catch {}

    // Seed two keys: one active, one deleted
    const activeId = uuidv4()
    await prisma.apiKey.create({
      data: {
        id: activeId,
        ownerUserId: userId,
        keyHash: 'hash-active',
        prefix: 'sk-test',
        name: 'Active Key',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {},
      }
    })

    const deletedId = uuidv4()
    await prisma.apiKey.create({
      data: {
        id: deletedId,
        ownerUserId: userId,
        keyHash: 'hash-deleted',
        prefix: 'sk-del',
        name: 'Deleted Key',
        status: 'deleted',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {},
      }
    })
  })

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { ownerUserId: userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  test('returns only non-deleted keys and does not include fullKey', async () => {
    const mod = await import('@/app/api/apikeys/route')
    const res = await mod.GET(new Request('http://localhost/api/apikeys'))
    expect(res).toBeInstanceOf(NextResponse as any)
    const body = await (res as any).json()
    expect(Array.isArray(body.apiKeys)).toBe(true)

    // Only the active one should be present
    const titles = body.apiKeys.map((k: any) => k.title)
    expect(titles).toContain('Active Key')
    expect(titles).not.toContain('Deleted Key')

    // List payload should not expose fullKey in the light variant
    for (const k of body.apiKeys) {
      expect('fullKey' in k).toBe(false)
    }
  })
})
