import { prisma } from '@/app/models/db'
import { getCreditBalance, addIndependentCredits } from '@/app/models/creditBalance'
import { createCreditTransaction, TransactionType, CreditType } from '@/app/models/creditTransaction'
import { CreditsAmount } from '@/app/service/credit'

const BONUS_REASON = 'New user signup bonus'

export async function hasGrantedNewUserBonus(userId: string): Promise<boolean> {
  const count = await prisma.creditTransaction.count({
    where: {
      userId,
      type: TransactionType.Income,
      bucket: CreditType.Independent,
      reason: BONUS_REASON,
    }
  })
  return count > 0
}

export async function grantNewUserBonus(options: {
  userId: string
  source: 'email_registration' | 'oauth_registration'
  provider?: string
}): Promise<{ granted: boolean; error?: string }> {
  const { userId, source, provider } = options
  try {
    // 幂等校验：若已有注册奖励流水，则不再发放
    const already = await hasGrantedNewUserBonus(userId)
    if (already) return { granted: false }

    // 确保钱包存在并获取当前余额
    const balance = await getCreditBalance(userId)
    const beforeIndependent = Number(balance?.independent_credits || 0)

    // 发放
    await addIndependentCredits(userId, CreditsAmount.NewUserGet)

    const afterIndependent = beforeIndependent + CreditsAmount.NewUserGet

    // 记录流水（独立积分）
    await createCreditTransaction({
      user_id: userId,
      type: TransactionType.Income,
      credit_type: CreditType.Independent,
      amount: CreditsAmount.NewUserGet,
      before_balance: beforeIndependent,
      after_balance: afterIndependent,
      description: BONUS_REASON,
      metadata: {
        source,
        provider: provider || undefined,
      },
    })

    return { granted: true }
  } catch (err: any) {
    console.error('grantNewUserBonus failed:', err)
    return { granted: false, error: String(err?.message || err) }
  }
}

export const NEW_USER_BONUS_POINTS = CreditsAmount.NewUserGet
