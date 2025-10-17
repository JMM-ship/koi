"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { useT } from '@/contexts/I18nContext'
import { trackOnboardingEvent } from '@/lib/track'

type Props = {
  isAdmin?: boolean
  bonusPoints?: number
  onGotoApiKeys?: () => void
  onGotoPlans?: () => void
  onGotoSetLocale?: () => void
  onGotoProfile?: () => void
  onDismiss?: () => void
}

type StepsState = {
  createKey: boolean
  firstCall: boolean
  choosePlan: boolean
  setLocale: boolean
}

const LS_DONE_KEY = 'onboard.v1.done'
const LS_STEPS_KEY = 'onboard.v1.steps'
const LS_FIRST_SEEN = 'onboard.v1.firstSeenAt'

export default function WelcomeGuide({
  isAdmin,
  bonusPoints = 0,
  onGotoApiKeys,
  onGotoPlans,
  onGotoSetLocale,
  onGotoProfile,
  onDismiss,
}: Props) {
  const { t } = useT()

  // Admin 例外：不展示
  if (isAdmin) return null

  const [steps, setSteps] = useState<StepsState>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LS_STEPS_KEY) : null
      if (raw) return JSON.parse(raw)
    } catch {}
    return { createKey: false, firstCall: false, choosePlan: false, setLocale: false }
  })

  // ensure firstSeenAt for 7-day visibility window
  useEffect(() => {
    try {
      const nowIso = new Date().toISOString()
      const fs = window.localStorage.getItem(LS_FIRST_SEEN)
      if (!fs) window.localStorage.setItem(LS_FIRST_SEEN, nowIso)
    } catch {}
  }, [])

  const anyTracking = process.env.NEXT_PUBLIC_ONBOARDING_TRACKING === '1' || process.env.NEXT_PUBLIC_ONBOARDING_TRACKING === 'true'

  // Track shown
  useEffect(() => {
    if (!anyTracking) return
    trackOnboardingEvent('onboarding_started', { stepCount: 4 })
  }, [anyTracking])

  // 自动探测：API Key / 用量 预标记
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [keysResp, dashResp] = await Promise.all([
          fetch('/api/apikeys').then(r => (r.ok ? r.json() : { apiKeys: [] })),
          fetch('/api/dashboard').then(r => (r.ok ? r.json() : { creditStats: { month: { amount: 0 } }, modelUsages: [] })),
        ])
        const hasKey = Array.isArray(keysResp?.apiKeys) && keysResp.apiKeys.some((k: any) => k?.status !== 'deleted')
        const hasUsage = (dashResp?.creditStats?.month?.amount || 0) > 0 || (Array.isArray(dashResp?.modelUsages) && dashResp.modelUsages.length > 0)
        if (cancelled) return
        setSteps(prev => {
          const next = { ...prev }
          if (hasKey) next.createKey = true
          if (hasUsage) next.firstCall = true
          persistSteps(next)
          return next
        })
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const completeCount = useMemo(() => Object.values(steps).filter(Boolean).length, [steps])

  const persistSteps = (s: StepsState) => {
    try { window.localStorage.setItem(LS_STEPS_KEY, JSON.stringify(s)) } catch {}
  }

  const markStep = (key: keyof StepsState, val: boolean) => {
    setSteps(prev => {
      const next = { ...prev, [key]: val }
      persistSteps(next)
      if (anyTracking && val) trackOnboardingEvent('onboarding_step_done', { step: String(key) })
      // 尝试将状态同步至服务端（不阻断）
      try {
        fetch('/api/onboarding/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: Object.values(next).every(Boolean), steps: next, firstSeenAt: localStorage.getItem(LS_FIRST_SEEN) }) })
      } catch {}
      return next
    })
  }

  const handleSkip = () => {
    try { window.localStorage.setItem(LS_DONE_KEY, '1') } catch {}
    if (anyTracking) trackOnboardingEvent('onboarding_dismissed')
    try { fetch('/api/onboarding/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: true, steps, firstSeenAt: localStorage.getItem(LS_FIRST_SEEN) }) }) } catch {}
    onDismiss?.()
  }

  const handleMaybeComplete = () => {
    const allDone = Object.values(steps).every(Boolean)
    if (allDone) {
      try { window.localStorage.setItem(LS_DONE_KEY, '1') } catch {}
      if (anyTracking) trackOnboardingEvent('onboarding_completed')
      try { fetch('/api/onboarding/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: true, steps, firstSeenAt: localStorage.getItem(LS_FIRST_SEEN) }) }) } catch {}
      onDismiss?.()
    }
  }

  // Basic card styles to blend with dashboard theme
  const cardStyle: React.CSSProperties = {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  }

  const stepRow = (label: string, done: boolean, onGo?: () => void, onMark?: () => void, ctaLabel?: string, desc?: string) => (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: 12,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
      minHeight: 120
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>{label}</div>
        {done ? <span style={{ color: '#0bd084', fontSize: 12 }}>{t('onboarding.state.done')}</span> : null}
      </div>
      {desc ? <div style={{ color: '#aaa', fontSize: 12 }}>{desc}</div> : null}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {onGo ? (
          <button onClick={onGo} style={{ background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px' }}>{ctaLabel}</button>
        ) : null}
        {!done && onMark ? (
          <button onClick={() => { onMark(); handleMaybeComplete() }} style={{ background: 'transparent', color: '#999', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px' }}>{t('onboarding.cta.done')}</button>
        ) : null}
      </div>
    </div>
  )

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{t('onboarding.title')}</div>
          <div style={{ color: '#aaa', fontSize: 12 }}>{t('onboarding.subtitle')}</div>
        </div>
        {/* Remove top-right skip per requirement; keep bottom actions */}
      </div>
      <div style={{ color: '#ccc', marginTop: 8 }}>{t('onboarding.reward', { points: bonusPoints })}</div>
      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{t('onboarding.tip.inviteReward')}</div>

      <div style={{ marginTop: 12,
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
      }}>
        {stepRow(t('onboarding.step.createKey'), steps.createKey, onGotoApiKeys, () => markStep('createKey', true), t('onboarding.cta.createKey'), t('onboarding.stepDesc.createKey'))}
        {stepRow(t('onboarding.step.firstCall'), steps.firstCall, undefined, () => markStep('firstCall', true), t('onboarding.cta.firstCall'), t('onboarding.stepDesc.firstCall'))}
        {stepRow(t('onboarding.step.choosePlan'), steps.choosePlan, onGotoPlans, () => markStep('choosePlan', true), t('onboarding.cta.choosePlan'), t('onboarding.stepDesc.choosePlan'))}
        {stepRow(t('onboarding.step.setLocale'), steps.setLocale, onGotoSetLocale || onGotoProfile, () => markStep('setLocale', true), t('onboarding.cta.setLocale'), t('onboarding.stepDesc.setLocale'))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={handleSkip} style={{ background: 'transparent', color: '#999', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px' }}>{t('onboarding.cta.skip')}</button>
        <button onClick={() => { try { window.localStorage.setItem(LS_DONE_KEY, '1') } catch {}; try { fetch('/api/onboarding/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: true, steps, firstSeenAt: localStorage.getItem(LS_FIRST_SEEN) }) }) } catch {}; onDismiss?.() }} style={{ background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px' }}>{t('onboarding.cta.done')}</button>
      </div>
    </div>
  )
}
