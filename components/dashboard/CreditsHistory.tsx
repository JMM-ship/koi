"use client";

import useSWR from 'swr'

type Tx = { id: string; type: string; bucket: string; points: number; reason?: string | null; createdAt: string }

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CreditsHistory({ limit = 5 }: { limit?: number }) {
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
                  <span style={{ color: '#e0e0e0', fontSize: '0.875rem' }}>{t.reason || (isIncome ? 'Income' : 'Expense')}</span>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(t.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: amountColor }}>{`${sign}${t.points}`}</span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    color: '#999',
                    border: '1px solid #2a2a2a'
                  }}>{t.bucket}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

