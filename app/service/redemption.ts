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

  return await (prisma as any).$transaction(async (tx: any) => {
    const codeRow = await (tx as any).redemptionCode.findUnique({ where: { code } })
    if (!codeRow) return { success: false, error: 'CODE_NOT_FOUND' }
    if (codeRow.status !== 'active') return { success: false, error: 'CODE_NOT_ACTIVE' }
    if (codeRow.expiresAt && new Date(codeRow.expiresAt) < new Date()) return { success: false, error: 'CODE_EXPIRED' }

    // 乐观更新：先占用卡密
    const upd = await (tx as any).redemptionCode.updateMany({
      where: { code, status: 'active' },
      data: { status: 'used', usedAt: new Date(), usedBy: userId },
    })
    if (upd.count !== 1) return { success: false, error: 'CODE_ALREADY_USED' }

    if (codeRow.codeType === 'credits') {
      const amount = parseInt(String(codeRow.codeValue), 10)
      if (!amount || amount <= 0) return { success: false, error: 'INVALID_CODE_VALUE' }
      const r = await purchaseCredits(userId, amount, `redeem-${code}`)
      if (!r.success) return { success: false, error: 'REDEEM_FAILED' }
      return { success: true, message: 'Credits added' }
    }

    if (codeRow.codeType === 'plan') {
      const targetPlan = String(codeRow.codeValue || '').toLowerCase()
      const pkgs = await getActivePackages()
      const target = pkgs.find(p => (p.planType || '').toLowerCase() === targetPlan)
      if (!target) return { success: false, error: 'PLAN_NOT_FOUND' }

      const now = new Date()
      const validDays = Number(codeRow.validDays || 0)
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + validDays)

      const current = await getUserActivePackage(userId)
      const currentLevel = current ? levelOf((current.package_snapshot?.planType) || current.package?.planType || '') : 0
      const targetLevel = levelOf(target.planType)

      // 降级不允许
      if (current && targetLevel < currentLevel) {
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
          validDays: validDays,
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
        if (!rr.success) return { success: false, error: 'REDEEM_FAILED' }
        return { success: true, message: 'Plan activated' }
      }

      if (targetLevel > currentLevel) {
        // 升级：立即生效，覆盖旧套餐，并重置套餐积分
        const snapshot = {
          id: target.id,
          name: target.name,
          version: target.version,
          price: target.priceCents / 100,
          dailyCredits: target.dailyPoints,
          validDays: validDays,
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
        if (!rr.success) return { success: false, error: 'REDEEM_FAILED' }
        return { success: true, message: 'Plan upgraded' }
      }

      // 同级：叠加有效期（从当前结束时间开始）
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
      if (!renewed) return { success: false, error: 'REDEEM_FAILED' }
      return { success: true, message: 'Plan renewed' }
    }

    return { success: false, error: 'UNSUPPORTED_CODE_TYPE' }
  })
}

