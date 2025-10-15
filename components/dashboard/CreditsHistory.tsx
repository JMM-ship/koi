"use client";

import useSWR from 'swr'
import { useT } from '@/contexts/I18nContext'

type Tx = { id: string; type: string; bucket: string; points: number; reason?: string | null; createdAt: string }

const fetcher = (url: string) => fetch(url).then(res => res.json())

const CN_TO_KEY: Record<string, string> = {
  '每日积分重置': 'dailyReset',
  '购买独立积分': 'purchasedIndependent',
  '激活套餐积分': 'activatedPackage',
  '购买套餐重置积分': 'packagePurchaseReset',
  '订单退款扣减积分（套餐）': 'orderRefundPackage',
  '订单退款扣减积分（独立）': 'orderRefundIndependent',
  '新用户注册奖励': 'newUserBonus',
  '自动恢复（每小时恢复）': 'autoRecoveryHourly',
  '手动重置到上限': 'manualResetToCap',
  '推荐奖励-邀请人': 'referralInviter',
  '推荐奖励-被邀请人': 'referralInvitee',
}

function canonicalizeReason(reason?: string | null): { key?: string; params?: Record<string, any>; fallback?: string } {
  if (!reason) return {}
  const r = reason.trim()
  if (CN_TO_KEY[r]) return { key: CN_TO_KEY[r] }
  const serviceUse = r.match(/^(.*)服务消耗$/)
  if (serviceUse && serviceUse[1]) return { key: 'serviceUsage', params: { service: serviceUse[1] } }
  return { fallback: r }
}

function canonicalizeBucket(bucket?: string | null): string | undefined {
  const b = (bucket || '').toLowerCase()
  if (b === 'package' || b === '套餐') return 'package'
  if (b === 'independent' || b === '独立') return 'independent'
  return undefined
}

export default function CreditsHistory({ limit = 5 }: { limit?: number }) {
  const { t } = useT()
  const { data, isLoading } = useSWR(`/api/credits/transactions?limit=${limit}`, fetcher)
  const txs: Tx[] = data?.data?.transactions || []

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
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>{t('dashboard.creditsHistory.title')}</h3>
      </div>

      {isLoading ? (
        <div style={{ color: '#999' }}>{t('dashboard.creditsHistory.loading')}</div>
      ) : txs.length === 0 ? (
        <div style={{ color: '#999' }}>{t('dashboard.creditsHistory.empty')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {txs.map((trow) => {
            const isIncome = trow.type === 'income'
            const sign = isIncome ? '+' : '-'
            const amountColor = isIncome ? '#00d084' : '#ff6b6b'
            const c = canonicalizeReason(trow.reason)
            const reasonText = c.key ? (c.params ? useTranslateKey('reasons.' + c.key, c.params, t) : t('reasons.' + c.key)) : (c.fallback || '')
            const bucketKey = canonicalizeBucket(trow.bucket)
            const bucketText = bucketKey ? t('buckets.' + bucketKey) : (trow.bucket || '')
            return (
              <div key={trow.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#e0e0e0', fontSize: '0.875rem' }}>{reasonText}</span>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(trow.createdAt).toLocaleString('en-US')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: amountColor }}>{`${sign}${trow.points}`}</span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    color: '#999',
                    border: '1px solid #2a2a2a'
                  }}>{bucketText}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function useTranslateKey(key: string, params: Record<string, any>, t: (k: string, params?: any) => string) {
  return t(key, params)
}
