"use client";

import React, { useCallback, useMemo, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { FiCopy, FiEdit2, FiUsers, FiGift, FiLink } from 'react-icons/fi'
import { useToast } from '@/hooks/useToast'
import { useT } from '@/contexts/I18nContext'
import { INVITE_CODE_MIN_LEN, INVITE_CODE_CHARSET } from '@/config/referral.config'

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Network error')
  return r.json()
})

interface SummaryData {
  success: boolean
  data: {
    inviteCode: string
    inviteUrl: string
    invitedCount: number
    totalRewardPoints: number
  }
}

interface InviteItem {
  email: string
  name: string | null
  registeredAt: string
  purchaseStatus: 'purchased' | 'not_purchased'
  rewardStatus: 'rewarded' | 'purchased_unrewarded' | 'not_purchased' | 'invalid'
}

interface InvitesData {
  success: boolean
  data: {
    items: InviteItem[]
    page: number
    pageSize: number
    total: number
  }
}

export default function ReferralContent() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { mutate } = useSWRConfig()
  const { showSuccess, showError } = useToast()
  const { t } = useT()

  const { data: summary } = useSWR<SummaryData>('/api/referrals/summary', fetcher)
  const invitesUrl = useMemo(() => `/api/referrals/invites?page=${page}&pageSize=${pageSize}`,[page])
  const { data: invites } = useSWR<InvitesData>(invitesUrl, fetcher)

  const inviteCode = summary?.data?.inviteCode || ''
  const inviteUrl = summary?.data?.inviteUrl || ''
  const invitedCount = summary?.data?.invitedCount ?? 0
  const totalRewardPoints = summary?.data?.totalRewardPoints ?? 0

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard?.writeText(inviteUrl)
      showSuccess(t('toasts.inviteLinkCopied'))
    } catch {}
  }, [inviteUrl, showSuccess])

  const copyCode = useCallback(async () => {
    if (!inviteCode) return
    try {
      await navigator.clipboard?.writeText(inviteCode)
      showSuccess(t('toasts.inviteCodeCopied'))
    } catch {}
  }, [inviteCode, showSuccess])
  // Edit code dialog state and handlers
  const [editOpen, setEditOpen] = useState(false)
  const [draftCode, setDraftCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState('')

  const openEdit = useCallback(() => {
    setDraftCode(inviteCode)
    setErrorText('')
    setEditOpen(true)
  }, [inviteCode])

  const closeEdit = useCallback(() => {
    if (saving) return
    setEditOpen(false)
  }, [saving])

  function normalizeCode(v: string) { return (v || '').trim().toUpperCase() }
  function validateLocal(v: string) {
    const up = normalizeCode(v)
    if (up.length < (INVITE_CODE_MIN_LEN || 4)) return 'Code too short'
    const re = new RegExp(`^[${INVITE_CODE_CHARSET}]+$`)
    if (!re.test(up)) return 'Only A–Z and 0–9 are allowed'
    return ''
  }

  const submitEdit = useCallback(async () => {
    const msg = validateLocal(draftCode)
    if (msg) { setErrorText(msg); return }
    try {
      setSaving(true)
      setErrorText('')
      const res = await fetch('/api/referrals/code', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizeCode(draftCode) }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error?.message || t('toasts.failedToUpdate'))
      showSuccess(t('toasts.inviteCodeUpdated'))
      setEditOpen(false)
      mutate('/api/referrals/summary')
    } catch (e: any) {
      setErrorText(String(e?.message || t('toasts.failedToUpdate')))
      showError(String(e?.message || t('toasts.failedToUpdate')))
    } finally {
      setSaving(false)
    }
  }, [draftCode, mutate, showError, showSuccess])

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: '#fff', marginBottom: 16 }}>Referral Program</h2>

      {/* How to Invite - three steps */}
      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20, marginBottom: 18 }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>How to invite friends</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#bda7ff' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#1c1533', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d0c7ff' }}><FiLink /> Copy your invite link</div>
            </div>
            <div style={{ color: '#9aa', marginTop: 8, fontSize: 12 }}>Click the copy button to get your personal link.</div>
          </div>
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#bda7ff' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#1c1533', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d0c7ff' }}><FiUsers /> Share with friends</div>
            </div>
            <div style={{ color: '#9aa', marginTop: 8, fontSize: 12 }}>Send the link to your friends via your channels.</div>
          </div>
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#bda7ff' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#1c1533', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d0c7ff' }}><FiGift /> Earn rewards</div>
            </div>
            <div style={{ color: '#9aa', marginTop: 8, fontSize: 12 }}>When friends purchase any plan, both of you get points.</div>
          </div>
        </div>
      </div>

      {/* My invite summary cards */}
      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20, marginBottom: 18 }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>My invite</div>
        <div style={{ color: '#9aa', fontSize: 12, marginTop: 6 }}>Share your invite code with friends. When they buy any plan, you get 2000 credits and your friend gets 1000 credits.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginTop: 12 }}>
          {/* Card 1: my code */}
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, background: '#101010' }}>
            <div style={{ color: '#9aa', fontSize: 12, marginBottom: 6 }}>My invite code</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{inviteCode}</div>
              <button onClick={copyCode} aria-label="Copy Code" title="Copy code" style={{ background: 'transparent', color: '#aaa', border: '1px solid #222', padding: 6, borderRadius: 6 }}><FiCopy /></button>
              <button onClick={openEdit} aria-label="Edit Code" title="Edit code" style={{ background: 'transparent', color: '#aaa', border: '1px solid #222', padding: 6, borderRadius: 6 }}><FiEdit2 /></button>
              <div style={{ flex: 1 }} />
              <button onClick={copyLink} aria-label="Copy" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2a2a2a', background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)', color: '#fff' }}>
                Copy Invite Link
              </button>
            </div>
            <div style={{ color: '#9cf', fontSize: 12, marginTop: 8, wordBreak: 'break-all' }}>{inviteUrl}</div>
          </div>

          {/* Card 2: invited count */}
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, background: '#101010', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: '#9aa', fontSize: 12 }}>Invited:</div>
            <div style={{ color: '#86efac', fontWeight: 800, fontSize: 24 }}>{invitedCount}</div>
          </div>

          {/* Card 3: total rewards */}
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, background: '#101010', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: '#9aa', fontSize: 12 }}>Total Rewards:</div>
            <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: 24 }}>{totalRewardPoints}</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
        <div style={{ color: '#fff', marginBottom: 8 }}>Invites</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', color: '#ddd', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #1a1a1a' }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #1a1a1a' }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #1a1a1a' }}>Registered</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #1a1a1a' }}>Purchase</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #1a1a1a' }}>Reward</th>
              </tr>
            </thead>
            <tbody>
              {(invites?.data?.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 8, borderBottom: '1px solid #1a1a1a' }}>{it.email}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #1a1a1a' }}>{it.name || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #1a1a1a' }}>{it.registeredAt}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #1a1a1a' }}>{it.purchaseStatus}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #1a1a1a' }}>{it.rewardStatus}</td>
                </tr>
              ))}
              {(!invites?.data?.items || invites.data.items.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: 12, color: '#666' }}>No invites yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 12px', borderRadius: 6 }}>Prev</button>
          <div style={{ color: '#aaa' }}>Page {page}</div>
          <button onClick={() => setPage((p) => p + 1)} style={{ padding: '6px 12px', borderRadius: 6 }}>Next</button>
        </div>
      </div>

      {editOpen && (
        <>
          <div onClick={closeEdit} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: 520, width: '92%', animation: 'fadeIn .25s ease-out' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: 2, boxShadow: '0 25px 50px rgba(0,0,0,.3)' }}>
                <div style={{ background: 'linear-gradient(135deg, #0b0b0b 0%, #141217 100%)', borderRadius: 14, padding: 22, border: '1px solid #221b33' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Edit invite code</div>
                  <div style={{ color: '#9aa', fontSize: 12, marginBottom: 12 }}>You can change your invite code only once. Use uppercase letters and digits (A–Z, 0–9), at least {INVITE_CODE_MIN_LEN} characters.</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input value={draftCode} onChange={(e) => setDraftCode(e.target.value.toUpperCase())} placeholder="Enter new invite code" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#0f0f0f', color: '#fff' }} />
                    <button onClick={submitEdit} disabled={saving} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: 700, minWidth: 110 }}>{saving ? 'Saving...' : 'Confirm'}</button>
                    <button onClick={closeEdit} disabled={saving} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#0f0f0f', color: '#aaa', minWidth: 110 }}>Cancel</button>
                  </div>
                  {errorText && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}>{errorText}</div>}
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>
        </>
      )}
    </div>
  )
}
