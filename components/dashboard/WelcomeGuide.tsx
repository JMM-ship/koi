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

  // 取消自动探测：改为用户自测（手动勾选）

  const completeCount = useMemo(() => Object.values(steps).filter(Boolean).length, [steps])
  const allDone = useMemo(() => Object.values(steps).every(Boolean), [steps])

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
        // 步骤标记不自动完成，由最终确认按钮触发 done
        fetch('/api/onboarding/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: false, steps: next, firstSeenAt: localStorage.getItem(LS_FIRST_SEEN) }) })
      } catch {}
      return next
    })
  }

  // 取消“跳过”和自动完成逻辑：由底部按钮手动完成

  // 样式：改为自上而下的 ToDoList 形式
  const cardStyle: React.CSSProperties = {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  }

  const stepRow = (
    idx: number,
    label: string,
    done: boolean,
    onGo?: () => void,
    onMark?: () => void,
    ctaLabel?: string,
    desc?: string
  ) => (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 8px',
      borderBottom: '1px solid #141414'
    }}>
      {/* 序号/状态 */}
      <div style={{ width: 28, height: 28, borderRadius: 6, background: done ? 'rgba(11,208,132,0.16)' : '#121212', border: done ? '1px solid rgba(11,208,132,0.28)' : '1px solid #1f1f1f', color: done ? '#0bd084' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
        {done ? '✓' : String(idx)}
      </div>
      {/* 文案区 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>{label}</div>
          {done ? <span style={{ color: '#0bd084', fontSize: 12 }}>{t('onboarding.state.done')}</span> : null}
        </div>
        {desc ? <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>{desc}</div> : null}
      </div>
      {/* 操作区 */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {onGo ? (
          <button onClick={onGo} style={{ background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px', whiteSpace: 'nowrap' }}>{ctaLabel}</button>
        ) : null}
        {!done && onMark ? (
          <button onClick={() => { onMark() }} style={{ background: 'transparent', color: '#999', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px', whiteSpace: 'nowrap' }}>{t('onboarding.cta.done')}</button>
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

      {/* 进度条/统计 */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ height: 6, background: '#121212', border: '1px solid #1f1f1f', borderRadius: 999, overflow: 'hidden', width: '100%' }}>
          <div style={{ height: '100%', width: `${(completeCount / 4) * 100}%`, background: '#0bd084' }} />
        </div>
        <div style={{ color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{completeCount}/4</div>
      </div>

      {/* ToDo 列表：自上而下 */}
      <div style={{ marginTop: 8, borderTop: '1px solid #141414' }}>
        {stepRow(1, t('onboarding.step.createKey'), steps.createKey, onGotoApiKeys, () => markStep('createKey', !steps.createKey), t('onboarding.cta.createKey'), t('onboarding.stepDesc.createKey'))}
        {stepRow(2, t('onboarding.step.firstCall'), steps.firstCall, undefined, () => markStep('firstCall', !steps.firstCall), t('onboarding.cta.firstCall'), t('onboarding.stepDesc.firstCall'))}
        {stepRow(3, t('onboarding.step.choosePlan'), steps.choosePlan, onGotoPlans, () => markStep('choosePlan', !steps.choosePlan), t('onboarding.cta.choosePlan'), t('onboarding.stepDesc.choosePlan'))}
        {stepRow(4, t('onboarding.step.setLocale'), steps.setLocale, onGotoSetLocale || onGotoProfile, () => markStep('setLocale', !steps.setLocale), t('onboarding.cta.setLocale'), t('onboarding.stepDesc.setLocale'))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          data-testid="onboarding-finish"
          disabled={!allDone}
          onClick={() => {
            if (!allDone) return
            try { window.localStorage.setItem(LS_DONE_KEY, '1') } catch {}
            if (anyTracking) trackOnboardingEvent('onboarding_completed')
            try {
              fetch('/api/onboarding/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: true, steps, firstSeenAt: localStorage.getItem(LS_FIRST_SEEN) })
              })
            } catch {}
            onDismiss?.()
          }}
          style={{
            background: 'transparent',
            color: allDone ? '#fff' : '#555',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            padding: '6px 10px',
            cursor: allDone ? 'pointer' : 'not-allowed',
            opacity: allDone ? 1 : 0.7
          }}
        >
          {t('onboarding.cta.done')}
        </button>
      </div>
    </div>
  )
}
