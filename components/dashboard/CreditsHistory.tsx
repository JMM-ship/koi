"use client";

import useSWR from 'swr'

type Tx = { id: string; type: string; bucket: string; points: number; reason?: string | null; createdAt: string }

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CreditsHistory({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useSWR(`/api/credits/transactions?limit=${limit}`, fetcher)
  const txs: Tx[] = data?.data?.transactions || []

  const mapReasonToEnglish = (reason?: string | null, isIncome?: boolean): string => {
    if (!reason || reason.trim().length === 0) return isIncome ? 'Income' : 'Expense'
    const r = reason.trim()
    // Exact mappings for legacy Chinese reasons
    if (r === '每日积分重置') return 'Daily credits reset'
    if (r === '购买独立积分') return 'Purchased independent credits'
    if (r === '激活套餐积分') return 'Activated package credits'
    if (r === '购买套餐重置积分') return 'Package purchase reset'
    if (r === '订单退款扣减积分（套餐）') return 'Order refund deduction (package)'
    if (r === '订单退款扣减积分（独立）') return 'Order refund deduction (independent)'
    if (r === '新用户注册奖励') return 'New user signup bonus'
    if (r === '自动恢复（每小时恢复）') return 'Auto recovery (hourly)'
    if (r === '手动重置到上限') return 'Manual reset to cap'
    if (r === '推荐奖励-邀请人') return 'Referral reward - inviter'
    if (r === '推荐奖励-被邀请人') return 'Referral reward - invitee'
    // Pattern: "{service}服务消耗" -> "Service usage - {service}"
    const serviceUse = r.match(/^(.*)服务消耗$/)
    if (serviceUse && serviceUse[1]) return `Service usage - ${serviceUse[1]}`
    return r
  }

  const mapBucketToEnglish = (bucket?: string | null): string => {
    const b = (bucket || '').toLowerCase()
    if (b === 'package' || b === '套餐') return 'Package'
    if (b === 'independent' || b === '独立') return 'Independent'
    return bucket || ''
  }

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>Credits History</h3>
      </div>

      {isLoading ? (
        <div style={{ color: '#999' }}>Loading...</div>
      ) : txs.length === 0 ? (
        <div style={{ color: '#999' }}>No records</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {txs.map((t) => {
            const isIncome = t.type === 'income'
            const sign = isIncome ? '+' : '-'
            const amountColor = isIncome ? '#00d084' : '#ff6b6b'
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#e0e0e0', fontSize: '0.875rem' }}>{mapReasonToEnglish(t.reason, isIncome)}</span>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(t.createdAt).toLocaleString('en-US')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: amountColor }}>{`${sign}${t.points}`}</span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    color: '#999',
                    border: '1px solid #2a2a2a'
                  }}>{mapBucketToEnglish(t.bucket)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
