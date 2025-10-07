import { POST as RedeemPOST } from '@/app/api/codes/redeem/route'

jest.mock('@/app/auth/helpers', () => ({
  auth: jest.fn(async () => ({ user: { id: 'uid1', role: 'user' } }))
}))

jest.mock('@/app/service/redemption', () => ({
  redeemCode: jest.fn(async () => ({ success: true, message: 'OK' }))
}))

describe('API /api/codes/redeem', () => {
  test('401 when not authenticated', async () => {
    const { auth } = require('@/app/auth/helpers')
    ;(auth as jest.Mock).mockResolvedValueOnce(null)
    const res = await RedeemPOST({ json: async () => ({ code: 'X' }) } as any)
    expect(res.status).toBe(401)
  })

  test('400 when no code', async () => {
    const res = await RedeemPOST({ json: async () => ({ code: '' }) } as any)
    expect(res.status).toBe(400)
  })

  test('200 when success', async () => {
    const res = await RedeemPOST({ json: async () => ({ code: 'KOI-XXXX' }) } as any)
    const data = await (res as any).json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('maps error codes to status', async () => {
    const { redeemCode } = require('@/app/service/redemption')
    ;(redeemCode as jest.Mock).mockResolvedValueOnce({ success: false, error: 'CODE_NOT_FOUND' })
    const res = await RedeemPOST({ json: async () => ({ code: 'BAD' }) } as any)
    expect(res.status).toBe(404)
  })
})

