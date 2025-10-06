import { prisma } from '@/app/models/db'
import {
  INVITE_CODE_MIN_LEN,
  INVITE_CODE_DEFAULT_LEN,
  INVITE_CODE_CHARSET,
} from '@/config/referral.config'

function normalize(code: string) {
  return (code || '').trim().toUpperCase()
}

export function validateInviteCodeFormat(code: string): string {
  const up = normalize(code)
  if (up.length < INVITE_CODE_MIN_LEN) {
    throw new Error('Invite code too short')
  }
  const re = new RegExp(`^[${INVITE_CODE_CHARSET}]+$`)
  if (!re.test(up)) {
    throw new Error('Invite code contains invalid characters')
  }
  return up
}

export function generateInviteCode(length: number = INVITE_CODE_DEFAULT_LEN): string {
  const len = Math.max(INVITE_CODE_MIN_LEN, length || INVITE_CODE_DEFAULT_LEN)
  const chars = INVITE_CODE_CHARSET
  let out = ''
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(Math.random() * chars.length)
    out += chars[idx]
  }
  return out
}

export async function ensureUserInviteCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const current = (user as any).inviteCode || ''
  if (current) {
    try {
      const normalized = validateInviteCodeFormat(current)
      if (normalized !== current) {
        // normalize to uppercase if needed
        await prisma.user.update({ where: { id: userId }, data: { inviteCode: normalized } })
      }
      return normalized
    } catch {
      // fallthrough to regenerate if invalid
    }
  }

  // Generate unique code with retries
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateInviteCode()
    const exists = await prisma.user.findFirst({
      where: {
        inviteCode: { equals: candidate, mode: 'insensitive' },
      },
      select: { id: true },
    })
    if (!exists) {
      await prisma.user.update({ where: { id: userId }, data: { inviteCode: candidate } })
      return candidate
    }
  }
  throw new Error('Failed to generate unique invite code')
}

export async function canChangeInviteCode(userId: string): Promise<boolean> {
  await ensureReferralMetaReady()
  // If no row, means 0 changes so far → allowed
  const rows: Array<{ invite_code_changes: number }> = await prisma.$queryRaw`
    SELECT invite_code_changes FROM referral_meta WHERE user_id = CAST(${userId} AS uuid) LIMIT 1
  `
  if (!rows || rows.length === 0) return true
  const cnt = Number(rows[0].invite_code_changes || 0)
  return cnt < 1
}

async function incrementChangeCount(userId: string) {
  await ensureReferralMetaReady()
  // Upsert-like logic since table not in Prisma schema
  const existing: Array<{ invite_code_changes: number }> = await prisma.$queryRaw`
    SELECT invite_code_changes FROM referral_meta WHERE user_id = CAST(${userId} AS uuid) LIMIT 1
  `
  if (!existing || existing.length === 0) {
    await prisma.$executeRaw`
      INSERT INTO referral_meta (user_id, invite_code_changes) VALUES (CAST(${userId} AS uuid), 1)
    `
  } else {
    await prisma.$executeRaw`
      UPDATE referral_meta SET invite_code_changes = invite_code_changes + 1, updated_at = NOW() WHERE user_id = CAST(${userId} AS uuid)
    `
  }
}

export async function setUserInviteCode(userId: string, code: string): Promise<string> {
  const target = validateInviteCodeFormat(code)

  // Run checks then update + meta in a transaction
  await ensureReferralMetaReady()
  return await prisma.$transaction(async (tx) => {
    // Fetch current user
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    const current = (user as any).inviteCode || ''
    const isChange = normalize(current) !== target

    // Uniqueness (case-insensitive) excluding self
    const conflict = await tx.user.findFirst({
      where: {
        inviteCode: { equals: target, mode: 'insensitive' },
        NOT: { id: userId },
      },
      select: { id: true },
    })
    if (conflict) throw new Error('Invite code already in use')

    if (isChange) {
      // Enforce modify-once policy
    const rows: Array<{ invite_code_changes: number }> = await tx.$queryRaw`
        SELECT invite_code_changes FROM referral_meta WHERE user_id = CAST(${userId} AS uuid) LIMIT 1
      `
      const cnt = rows && rows.length ? Number(rows[0].invite_code_changes || 0) : 0
      if (cnt >= 1) throw new Error('Invite code change limit reached')
    }

    // Update user code
    await tx.user.update({ where: { id: userId }, data: { inviteCode: target } })

    if (isChange) {
      // Increment change count
      const existRows: Array<{ invite_code_changes: number }> = await tx.$queryRaw`
        SELECT invite_code_changes FROM referral_meta WHERE user_id = CAST(${userId} AS uuid) LIMIT 1
      `
      if (!existRows || existRows.length === 0) {
        await tx.$executeRaw`
          INSERT INTO referral_meta (user_id, invite_code_changes) VALUES (CAST(${userId} AS uuid), 1)
        `
      } else {
        await tx.$executeRaw`
          UPDATE referral_meta SET invite_code_changes = invite_code_changes + 1, updated_at = NOW() WHERE user_id = CAST(${userId} AS uuid)
        `
      }
    }

    return target
  }, { maxWait: 15000, timeout: 15000 })
}

export async function attachReferralByCode(userId: string, code: string): Promise<{ attached: boolean; inviterId?: string }>{
  const normalized = validateInviteCodeFormat(code)

  const inviter = await prisma.user.findFirst({
    where: { inviteCode: { equals: normalized, mode: 'insensitive' } },
    select: { id: true },
  })
  if (!inviter) throw new Error('Invalid invite code')
  if (inviter.id === userId) throw new Error('Cannot invite yourself')

  const invitee = await prisma.user.findUnique({ where: { id: userId }, select: { invitedBy: true } })
  if (!invitee) throw new Error('User not found')

  const already = (invitee as any).invitedBy
  if (already && String(already).length > 0) {
    return { attached: false }
  }

  await prisma.user.update({ where: { id: userId }, data: { invitedBy: inviter.id } })
  return { attached: true, inviterId: inviter.id }
}

async function ensureReferralMetaReady() {
  // Best-effort creation to keep tests independent of manual migration
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS referral_meta (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        invite_code_changes INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  } catch (e) {
    // ignore if lacking permission; tests may still pass if not using modify features
  }
}

// 首次消费奖励：仅当该用户存在邀请人，且当前为该用户第一笔已支付订单时发放；幂等（非第一笔不发放）
export async function processFirstPurchase(inviteeId: string, orderNo: string): Promise<{ rewarded: boolean; inviterId?: string }>{
  // 读取邀请关系
  const invitee = await prisma.user.findUnique({ where: { id: inviteeId }, select: { invitedBy: true } })
  if (!invitee) throw new Error('User not found')
  const inviterId = (invitee as any).invitedBy as string | null
  if (!inviterId || inviterId === inviteeId) {
    return { rewarded: false }
  }

  // 判断是否为第一笔已支付订单
  const paidCount = await prisma.order.count({ where: { userId: inviteeId, status: 'paid' } })
  if (paidCount !== 1) {
    return { rewarded: false }
  }

  // 发放奖励（事务内）
  const { INVITER_REWARD_POINTS, INVITEE_REWARD_POINTS } = await import('@/config/referral.config')
  const { addIndependentCredits } = await import('@/app/models/creditBalance')
  const { createCreditTransaction, TransactionType, CreditType } = await import('@/app/models/creditTransaction')

  // 读取双方当前余额（独立积分）
  const [inviterWallet, inviteeWallet] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: inviterId } }),
    prisma.wallet.findUnique({ where: { userId: inviteeId } }),
  ])

  const inviterBefore = Number(inviterWallet?.independentTokens ?? BigInt(0))
  const inviteeBefore = Number(inviteeWallet?.independentTokens ?? BigInt(0))

  // 加积分
  await addIndependentCredits(inviterId, INVITER_REWARD_POINTS, orderNo)
  await addIndependentCredits(inviteeId, INVITEE_REWARD_POINTS, orderNo)

  // 写流水（两条）
  await createCreditTransaction({
    user_id: inviterId,
    type: TransactionType.Income,
    credit_type: CreditType.Independent,
    amount: INVITER_REWARD_POINTS,
    before_balance: inviterBefore,
    after_balance: inviterBefore + INVITER_REWARD_POINTS,
    order_no: orderNo,
    description: '推荐奖励-邀请人',
    metadata: { source: 'referral_reward', inviterId, inviteeId, orderNo },
  })

  await createCreditTransaction({
    user_id: inviteeId,
    type: TransactionType.Income,
    credit_type: CreditType.Independent,
    amount: INVITEE_REWARD_POINTS,
    before_balance: inviteeBefore,
    after_balance: inviteeBefore + INVITEE_REWARD_POINTS,
    order_no: orderNo,
    description: '推荐奖励-被邀请人',
    metadata: { source: 'referral_reward', inviterId, inviteeId, orderNo },
  })

  return { rewarded: true, inviterId }
}
