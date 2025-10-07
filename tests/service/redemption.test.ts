import { redeemCode } from '@/app/service/redemption'

jest.mock('@/app/models/db', () => {
  const findUnique = jest.fn()
  const updateMany = jest.fn(async () => ({ count: 1 }))
  const defaultTx = { redemptionCode: { findUnique, updateMany } }
  return {
    prisma: {
      $transaction: jest.fn(async (fn: any) => fn(defaultTx)),
    },
  }
})

jest.mock('@/app/service/creditManager', () => ({
  purchaseCredits: jest.fn(async () => ({ success: true })),
  resetPackageCreditsForNewPackage: jest.fn(async () => ({ success: true })),
}))

jest.mock('@/app/models/package', () => ({
  getActivePackages: jest.fn(async () => ([
    { id: 'pkg-basic', name: 'Plus', version: 'v', priceCents: 5000, dailyPoints: 6000, planType: 'basic', validDays: 30, features: {}, limitations: {}, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' },
    { id: 'pkg-pro', name: 'Pro', version: 'v', priceCents: 10000, dailyPoints: 10000, planType: 'pro', validDays: 30, features: {}, limitations: {}, isActive: true, sortOrder: 2, createdAt: '', updatedAt: '' },
  ])),
}))

jest.mock('@/app/models/userPackage', () => ({
  getUserActivePackage: jest.fn(async () => null),
  renewUserPackage: jest.fn(async () => ({ id: 'upkg' })),
  createUserPackage: jest.fn(async () => ({ id: 'upkg2' })),
}))

describe('redeemCode service', () => {
  const { prisma } = require('@/app/models/db')
  const { purchaseCredits, resetPackageCreditsForNewPackage } = require('@/app/service/creditManager')
  const { getUserActivePackage } = require('@/app/models/userPackage')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redeem credits code success', async () => {
    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        redemptionCode: {
          findUnique: jest.fn(async () => ({ code: 'KOI-XXXX', status: 'active', codeType: 'credits', codeValue: '500', validDays: 30 })),
          updateMany: jest.fn(async () => ({ count: 1 })),
        },
      }
      return await fn(tx)
    })

    const res = await redeemCode('uid1', 'koi-xxxx')
    expect(res.success).toBe(true)
    expect(purchaseCredits).toHaveBeenCalled()
  })

  test('redeem plan upgrade success', async () => {
    // current: basic, target: pro
    const { getActivePackages } = require('@/app/models/package')
    const { createUserPackage } = require('@/app/models/userPackage')
    ;(getUserActivePackage as jest.Mock).mockResolvedValueOnce({ package_snapshot: { planType: 'basic' } })

    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        redemptionCode: {
          findUnique: jest.fn(async () => ({ code: 'UP', status: 'active', codeType: 'plan', codeValue: 'pro', validDays: 30 })),
          updateMany: jest.fn(async () => ({ count: 1 })),
        },
      }
      return await fn(tx)
    })

    const res = await redeemCode('uid1', 'up')
    expect(res.success).toBe(true)
    expect(createUserPackage).toHaveBeenCalled()
    expect(resetPackageCreditsForNewPackage).toHaveBeenCalled()
  })

  test('redeem plan renew (same level) success', async () => {
    const { renewUserPackage } = require('@/app/models/userPackage')
    ;(getUserActivePackage as jest.Mock).mockResolvedValueOnce({ package_snapshot: { planType: 'pro' } })

    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        redemptionCode: {
          findUnique: jest.fn(async () => ({ code: 'RN', status: 'active', codeType: 'plan', codeValue: 'pro', validDays: 30 })),
          updateMany: jest.fn(async () => ({ count: 1 })),
        },
      }
      return await fn(tx)
    })

    const res = await redeemCode('uid1', 'rn')
    expect(res.success).toBe(true)
    expect(renewUserPackage).toHaveBeenCalled()
  })

  test('redeem plan downgrade rejected', async () => {
    const { getUserActivePackage } = require('@/app/models/userPackage')
    ;(getUserActivePackage as jest.Mock).mockResolvedValueOnce({ package_snapshot: { planType: 'enterprise' } })

    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        redemptionCode: {
          findUnique: jest.fn(async () => ({ code: 'DG', status: 'active', codeType: 'plan', codeValue: 'pro', validDays: 30 })),
          updateMany: jest.fn(async () => ({ count: 1 })),
        },
      }
      return await fn(tx)
    })

    const res = await redeemCode('uid1', 'dg')
    expect(res.success).toBe(false)
    expect(res).toMatchObject({ error: 'DOWNGRADE_NOT_ALLOWED' })
  })
})
