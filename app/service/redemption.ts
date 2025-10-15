import { prisma } from '@/app/models/db'
import { getActivePackages } from '@/app/models/package'
import { getUserActivePackage, renewUserPackage, createUserPackage } from '@/app/models/userPackage'
import { resetPackageCreditsForNewPackage, purchaseCredits } from '@/app/service/creditManager'

export type RedeemResult = { success: true; message?: string } | { success: false; error: string }

const levelOf = (planType: string): number => {
  const key = (planType || '').toLowerCase()
  if (key === 'basic' || key === 'plus') return 1
  if (key === 'pro' || key === 'professional') return 2
  if (key === 'enterprise' || key === 'max') return 3
  return 0
}

export async function redeemCode(userId: string, rawCode: string): Promise<RedeemResult> {
  const code = (rawCode || '').trim().toUpperCase()
  if (!userId || !code) return { success: false, error: 'INVALID_PARAMS' }

  // 读取并校验
  const codeRow = await (prisma as any).redemptionCode.findUnique({ where: { code } })
  if (!codeRow) return { success: false, error: 'CODE_NOT_FOUND' }
  if (codeRow.expiresAt && new Date(codeRow.expiresAt) < new Date()) return { success: false, error: 'CODE_EXPIRED' }
  if (codeRow.status !== 'active') {
    return { success: false, error: codeRow.status === 'used' ? 'CODE_ALREADY_USED' : 'CODE_NOT_ACTIVE' }
  }

  // 抢占：active -> used（一次性成功）
  const lock = await (prisma as any).redemptionCode.updateMany({
    where: { code, status: 'active' },
    data: { status: 'used', usedAt: new Date(), usedBy: userId },
  })
  if (lock.count !== 1) return { success: false, error: 'CODE_ALREADY_USED' }

  // 后续业务，失败则回滚为 active
  const revert = async () => {
    try {
      await (prisma as any).redemptionCode.updateMany({
        where: { code, status: 'used', usedBy: userId },
        data: { status: 'active', usedAt: null, usedBy: null },
      })
    } catch {}
  }

  try {
    if (codeRow.codeType === 'credits') {
      const amount = parseInt(String(codeRow.codeValue), 10)
      if (!amount || amount <= 0) {
        await revert();
        return { success: false, error: 'INVALID_CODE_VALUE' }
      }
      const r = await purchaseCredits(userId, amount, `redeem-${code}`)
      if (!r.success) {
        await revert();
        return { success: false, error: 'REDEEM_FAILED' }
      }
      return { success: true, message: 'Credits added' }
    }

    if (codeRow.codeType === 'plan') {
      const targetPlan = String(codeRow.codeValue || '').toLowerCase()
      const pkgs = await getActivePackages()
      const target = pkgs.find((p) => (p.planType || '').toLowerCase() === targetPlan)
      if (!target) {
        await revert();
        return { success: false, error: 'PLAN_NOT_FOUND' }
      }

      const now = new Date()
      const validDays = Number(codeRow.validDays || 0)
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + validDays)

      const current = await getUserActivePackage(userId)
      const currentLevel = current ? levelOf(current.package_snapshot?.planType || current.package?.planType || '') : 0
      const targetLevel = levelOf(target.planType)
      if (current && targetLevel < currentLevel) {
        await revert();
        return { success: false, error: 'DOWNGRADE_NOT_ALLOWED' }
      }

      const orderNo = `redeem-${code}`
      if (!current) {
        const snapshot = {
          id: target.id,
          name: target.name,
          version: target.version,
          price: target.priceCents / 100,
          dailyCredits: target.dailyPoints,
          validDays,
          planType: target.planType,
          features: target.features,
        }
        await createUserPackage({
          user_id: userId,
          package_id: target.id,
          order_no: orderNo,
          start_date: now,
          end_date: endDate,
          daily_credits: target.dailyPoints,
          package_snapshot: snapshot,
        })
        const rr = await resetPackageCreditsForNewPackage(userId, target.dailyPoints || 0, orderNo)
        if (!rr.success) {
          await revert();
          return { success: false, error: 'REDEEM_FAILED' }
        }
        return { success: true, message: 'Plan activated' }
      }

      if (targetLevel > currentLevel) {
        const snapshot = {
          id: target.id,
          name: target.name,
          version: target.version,
          price: target.priceCents / 100,
          dailyCredits: target.dailyPoints,
          validDays,
          planType: target.planType,
          features: target.features,
        }
        await createUserPackage({
          user_id: userId,
          package_id: target.id,
          order_no: orderNo,
          start_date: now,
          end_date: endDate,
          daily_credits: target.dailyPoints,
          package_snapshot: snapshot,
        })
        const rr = await resetPackageCreditsForNewPackage(userId, target.dailyPoints || 0, orderNo)
        if (!rr.success) {
          await revert();
          return { success: false, error: 'REDEEM_FAILED' }
        }
        return { success: true, message: 'Plan upgraded' }
      }

      const renewed = await renewUserPackage(
        userId,
        target.id,
        orderNo,
        validDays,
        target.dailyPoints,
        {
          id: target.id,
          name: target.name,
          version: target.version,
          price: target.priceCents / 100,
          dailyCredits: target.dailyPoints,
          validDays,
          planType: target.planType,
          features: target.features,
        }
      )
      if (!renewed) {
        await revert();
        return { success: false, error: 'REDEEM_FAILED' }
      }
      return { success: true, message: 'Plan renewed' }
    }

    await revert();
    return { success: false, error: 'UNSUPPORTED_CODE_TYPE' }
  } catch (e) {
    await revert();
    return { success: false, error: 'REDEEM_FAILED' }
  }
}
