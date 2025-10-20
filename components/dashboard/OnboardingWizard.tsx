"use client";
import React, { useCallback, useState } from 'react'
import { useT } from '@/contexts/I18nContext'
import { trackOnboardingEvent } from '@/lib/track'
import { FiKey, FiTerminal, FiMessageCircle, FiCreditCard, FiCheck, FiArrowRight, FiChevronLeft, FiCopy } from 'react-icons/fi'
import useSWR from 'swr'
import PaymentMethodModal from '@/components/dashboard/PaymentMethodModal'

type Props = {
  isAdmin?: boolean
  bonusPoints?: number
  demoVideos?: { claude?: string; codex?: string }
  onGotoApiKeys?: () => void
  onGotoPlans?: () => void
  onGotoProfile?: () => void
  onDismiss?: () => void
}

type StepsDone = {
  createKey: boolean
  install: boolean
  firstCall: boolean
  choosePlan: boolean
}

const LS_DONE_KEY = 'onboard.v1.done'
const LS_FIRST_SEEN = 'onboard.v1.firstSeenAt'

export default function OnboardingWizard({
  isAdmin,
  bonusPoints = 0,
  demoVideos,
  onGotoApiKeys,
  onGotoPlans,
  onGotoProfile,
  onDismiss,
}: Props) {
  const { t } = useT()
  if (isAdmin) return null

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [selectedPlan, setSelectedPlan] = useState<string | null>('free')
  const [creating, setCreating] = useState(false)
  const [apiKeyTitle, setApiKeyTitle] = useState('My API Key')
  const [createdKey, setCreatedKey] = useState<{ id: string; masked: string; full: string } | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [copiedInline, setCopiedInline] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedPaidPkg, setSelectedPaidPkg] = useState<any | null>(null)
  const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [stepsDone, setStepsDone] = useState<StepsDone>({ createKey: false, install: false, firstCall: false, choosePlan: false })

  const anyTracking = (process.env.NEXT_PUBLIC_ONBOARDING_TRACKING || '').toString().toLowerCase() === '1'
    || (process.env.NEXT_PUBLIC_ONBOARDING_TRACKING || '').toString().toLowerCase() === 'true'

  // Ensure first seen timestamp exists
  React.useEffect(() => {
    try {
      const fs = window.localStorage.getItem(LS_FIRST_SEEN)
      if (!fs) window.localStorage.setItem(LS_FIRST_SEEN, new Date().toISOString())
    } catch {}
  }, [])

  // Track started once
  React.useEffect(() => {
    if (anyTracking) trackOnboardingEvent('onboarding_started', { variant: 'wizard', stepCount: 4 })
  }, [anyTracking])

  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }, [])

  

  const goNext = useCallback(() => {
    const next = Math.min(currentStep + 1, totalSteps)
    // mark step done when proceeding
    setStepsDone(prev => {
      const nextState = { ...prev }
      if (currentStep === 1) nextState.createKey = true
      if (currentStep === 2) nextState.install = true
      if (currentStep === 3) nextState.firstCall = true
      if (currentStep === 4) nextState.choosePlan = true
      return nextState
    })
    if (anyTracking) trackOnboardingEvent('onboarding_step_done', { step: `wizard_step_${currentStep}` })
    setCurrentStep(next)
  }, [currentStep, anyTracking])

  const goPrev = useCallback(() => setCurrentStep(s => Math.max(1, s - 1)), [])

  const finish = useCallback(async () => {
    try { document.cookie = `onboard_done=1; path=/; max-age=${60 * 60 * 24 * 180}` } catch {}
    try { window.localStorage.setItem(LS_DONE_KEY, '1') } catch {}
    if (anyTracking) trackOnboardingEvent('onboarding_completed')
    try {
      const payload = {
        done: true,
        steps: { ...stepsDone, choosePlan: true, variant: 'wizard' },
        firstSeenAt: (typeof window !== 'undefined') ? localStorage.getItem(LS_FIRST_SEEN) : null,
      }
      await fetch('/api/onboarding/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } catch {}
    onDismiss?.()
  }, [stepsDone, anyTracking, onDismiss])

  const cardStyle: React.CSSProperties = {
    background: 'var(--dashboard-card-bg, #0a0a0a)',
    border: '1px solid var(--dashboard-border, #1a1a1a)',
    borderRadius: 12,
    padding: 16,
  }
  const outerStyle: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '0 16px' }
  const stepCardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(121,74,255,0.08), rgba(255,255,255,0.03))',
    border: '1px solid var(--dashboard-border, #1a1a1a)',
    borderRadius: 12,
    padding: 16,
  }

  const progressDot = (idx: number, Icon: any, label: string) => {
    const done = currentStep > idx
    const active = currentStep === idx
    return (
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${active || done ? '#794aff' : '#2a2a2a'}`,
            background: done ? '#794aff' : 'transparent', color: done ? '#fff' : (active ? '#794aff' : '#777')
          }}>
            {done ? <FiCheck /> : <Icon />}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: active || done ? '#fff' : '#888', fontWeight: 600 }}>{label}</div>
        </div>
        {idx < totalSteps && (
          <div style={{ height: 2, flex: 1, margin: '0 12px', background: currentStep > idx ? '#794aff' : '#2a2a2a' }} />
        )}
      </div>
    )
  }

  function formatFeaturesWizard(pkg: any): string[] {
    const f = (pkg.features || {}) as any
    const creditCap = Number(f.creditCap ?? pkg.daily_credits ?? pkg.dailyPoints ?? 0)
    const recoveryRate = Number(f.recoveryRate ?? 0)
    const dailyUsageLimit = Number(f.dailyUsageLimit ?? 0)
    const manualResetPerDay = Number(f.manualResetPerDay ?? 0)
    const hoursToFull = recoveryRate > 0 && creditCap > 0 ? Math.ceil(creditCap / recoveryRate) : null

    const lines: string[] = []
    lines.push(t('packages.features.creditCap', { count: creditCap.toLocaleString() }) || `${creditCap.toLocaleString()} credit cap`)
    lines.push(
      recoveryRate > 0
        ? (t('packages.features.recoveryPerHour', { count: recoveryRate.toLocaleString() }) || `Recovery rate ${recoveryRate.toLocaleString()}/hour`)
        : (t('packages.features.recoveryZero') || 'Recovery rate 0/hour')
    )
    lines.push(
      dailyUsageLimit > 0
        ? (t('packages.features.dailyMaxUsage', { count: dailyUsageLimit.toLocaleString() }) || `Daily max usage ${dailyUsageLimit.toLocaleString()} credits`)
        : (t('packages.features.noDailyCap') || 'No daily usage cap')
    )
    lines.push(
      hoursToFull
        ? (t('packages.features.fullRecoveryHours', { hours: String(hoursToFull) }) || `Full recovery in ~${hoursToFull} hours`)
        : (t('packages.features.fullRecoveryNA') || 'Full recovery N/A')
    )
    lines.push(
      manualResetPerDay > 0
        ? (t('packages.features.manualResetPerDay', { count: String(manualResetPerDay) }) || `Manual reset to cap ${manualResetPerDay} time(s) per day`)
        : (t('packages.features.noManualReset') || 'No manual reset')
    )
    lines.push(t('packages.features.cliTools') || 'Supports Claude and full suite of CLI tools')

    const name = (pkg.name || '').toLowerCase()
    const isPro = name.includes('pro') || pkg.plan_type === 'pro' || pkg.planType === 'pro'
    const isMax = name.includes('max') || pkg.plan_type === 'enterprise' || pkg.planType === 'enterprise'
    lines.push(isPro || isMax ? (t('packages.features.prioritySupport') || 'Priority technical support') : (t('packages.features.standardSupport') || 'Standard technical support'))
    return lines
  }

  const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
    <div>
      <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h2>
      {desc ? <p style={{ color: '#999', fontSize: 13, marginTop: 6 }}>{desc}</p> : null}
    </div>
  )

  const Code = ({ label, code }: { label?: string; code: string }) => {
    const [copied, setCopied] = React.useState(false)
    const onCopy = async () => {
      await copy(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    return (
      <div style={{ marginTop: 10 }}>
        {label ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#aaa', letterSpacing: 0.4 }}>{label}</span>
            <button aria-label="Copy" onClick={onCopy} style={{ fontSize: 12, color: copied ? '#00d084' : '#ccc', background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <FiCopy /> {copied ? (t('common.copied') || '已复制') : (t('onboarding.wizard.copy') || '复制')}
            </button>
          </div>
        ) : null}
        <pre style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 12, overflowX: 'auto', color: '#d1d5db', fontSize: 13, lineHeight: 1.5 }}>
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  const VideoSlot = ({ title, src }: { title: string; src?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ color: '#ddd', fontWeight: 600 }}>{title}</div>
      <div style={{ position: 'relative', width: '100%', height: 0, paddingBottom: '56.25%', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden' }}>
        {src ? (
          <video controls autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} src={src} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', textAlign: 'center', padding: 16 }}>
            {t('onboarding.wizard.video.placeholder') || '在此处嵌入演示视频（上传后填入地址）'}
          </div>
        )}
      </div>
    </div>
  )

  // Load packages (step 4)
  const { data: packagesResp } = useSWR('/api/packages', async (url: string) => { const r = await fetch(url); return r.json() }, { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 2000 })
  const packages = (packagesResp?.data?.packages || []) as any[]

  // Load existing API keys (step 1)
  const { data: keysResp } = useSWR('/api/apikeys', async (url: string) => { const r = await fetch(url); return r.json() }, { revalidateOnFocus: true, revalidateOnReconnect: true, dedupingInterval: 2000 })
  const existingKeys = ((keysResp?.apiKeys || []) as any[]).filter((k: any) => k.status !== 'deleted')
  const activeKey = existingKeys.find((k: any) => k.status === 'active') || existingKeys[0]
  let existingFullKey: string | null = null
  try {
    if (activeKey?.id) {
      const raw = localStorage.getItem('apikeys_fullkey_cache')
      if (raw) { const cache = JSON.parse(raw); existingFullKey = cache[activeKey.id] || null }
    }
  } catch {}

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 8px', borderBottom: '1px solid #1a1a1a', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/assets/logo.svg" alt="KOI" style={{ width: 64, height: 40, objectFit: 'contain' }} />
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: 0.3 }}>Welcome to KOI</div>
          </div>
          <div style={{ color: '#999', fontSize: 13 }}>{t('onboarding.wizard.progress', { cur: currentStep, total: totalSteps }) || `${currentStep}/${totalSteps}`}</div>
        </div>

      {/* Progress dots */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
        {progressDot(1, FiKey, t('onboarding.step.createKey') || '创建 API Key')}
        {progressDot(2, FiTerminal, t('onboarding.wizard.install') || '安装/配置')}
        {progressDot(3, FiMessageCircle, t('onboarding.step.firstCall') || '首次对话')}
        {progressDot(4, FiCreditCard, t('onboarding.step.choosePlan') || '选择套餐')}
      </div>

      {/* Step content */}
      <div style={{ marginTop: 16 }}>
        {currentStep === 1 && (
          <div style={stepCardStyle}>
            <SectionTitle
              title={t('onboarding.wizard.step1.title') || '创建你的 API 密钥'}
              desc={t('onboarding.wizard.step1.desc') || '在此直接创建你的第一个 API 密钥。请妥善保存完整密钥。'}
            />
            <div style={{ marginTop: 12 }}>
              {createdKey ? (
                <div>
                  <div style={{ color: '#ccc', fontSize: 13, marginBottom: 8 }}>{t('dashboard.apiKeys.created.onceTip') || '完整密钥仅展示一次，请立即复制保存。'}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input readOnly value={createdKey.full} style={{ flex: '1 1 360px', minWidth: 260, padding: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', fontFamily: 'monospace' }} />
                    <button onClick={async () => { await copy(createdKey.full); setCopiedInline(true); setTimeout(()=>setCopiedInline(false),1200) }} style={{ background: 'transparent', color: copiedInline ? '#00d084' : '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCopy /> {copiedInline ? (t('common.copied') || '已复制') : (t('onboarding.wizard.copy') || '复制')}</button>
                  </div>
                </div>
              ) : activeKey ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input readOnly value={existingFullKey || activeKey.apiKey} style={{ flex: '1 1 360px', minWidth: 260, padding: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', fontFamily: 'monospace' }} />
                  <button onClick={async () => { await copy(existingFullKey || activeKey.apiKey); setCopiedInline(true); setTimeout(()=>setCopiedInline(false),1200) }} style={{ background: 'transparent', color: copiedInline ? '#00d084' : '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCopy /> {copiedInline ? (t('common.copied') || '已复制') : (t('onboarding.wizard.copy') || '复制')}</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <InlineCreateKey creating={creating} setCreating={setCreating} setCreatedKey={setCreatedKey} setCreateError={setCreateError} />
                </div>
              )}
              {createError ? <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 8 }}>{createError}</div> : null}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={stepCardStyle}>
            <SectionTitle
              title={t('onboarding.wizard.step2.title') || '安装 / 配置'}
              desc={t('onboarding.wizard.step2.desc') || '运行一键安装脚本，按提示在脚本中输入 API key 完成配置。'}
            />
            <Code label={t('onboarding.wizard.oneClickInstall') || 'One‑click install'} code={`npx @koi.codes/koi-installer`} />
            <div style={{ marginTop: 12, color: '#ccc', fontSize: 13 }}>
              {t('onboarding.wizard.step2.hint') || '当脚本运行过程中向您请求输入 API key 时，请输入：'}
              <div style={{ marginTop: 8 }}>
                <pre style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 12, color: '#d1d5db', fontSize: 13 }}>
                  <code>{createdKey?.full || existingFullKey || 'YOUR_API_KEY'}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div style={stepCardStyle}>
            <SectionTitle
              title={t('onboarding.wizard.step3.title') || '开始你的第一次对话'}
              desc={t('onboarding.wizard.step3.desc') || '在终端分别输入 Claude / codex 启动应用，并输入 "hi" 发起你的第一个对话。下方预留演示视频位置。'}
            />
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
              <VideoSlot title={t('onboarding.wizard.video.claude') || 'Claude 演示'} src={demoVideos?.claude} />
              <VideoSlot title={t('onboarding.wizard.video.codex') || 'Codex 演示'} src={demoVideos?.codex} />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div style={stepCardStyle}>
            <SectionTitle
              title={t('onboarding.wizard.step4.title') || '选择适合你的套餐'}
              desc={(t('onboarding.wizard.step4.desc') || '可先使用新人免费套餐；包含 {points} 积分').replace('{points}', String(bonusPoints || 500))}
            />
            <div className="row justify-content-center" style={{ marginTop: 12 }}>
              {/* Free plan card styled like purchase page */}
              <div className="col-lg-3 mb-4">
                <div className="balance-card" style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(121,74,255,0.14), rgba(20,20,20,0.9))',
                  border: selectedPlan === 'free' ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(121,74,255,0.25)',
                  borderRadius: '14px',
                  padding: '24px',
                  height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'transform .2s ease, box-shadow .2s ease',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                }}>
                  <div className="text-center mb-4" style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '0.5px' }}>{t('onboarding.wizard.plan.free.name') || '免费版'}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
                      <span style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>$0</span>
                      <span style={{ fontSize: 14, color: '#9aa0a6' }}>{t('packages.perMonth') || '/mo'}</span>
                    </div>
                  </div>
                  <ul className="list-unstyled" style={{ flex: 1, marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                    <li className="d-flex align-items-start" style={{ marginBottom: '14px' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 208, 132, 0.15)', marginRight: 10, flexShrink: 0, marginTop: 2 }}>
                        <FiCheck style={{ fontSize: 11, color: '#00d084', fontWeight: 'bold' }} />
                      </span>
                      <span style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.5 }}>{t('onboarding.wizard.plan.free.desc', { points: bonusPoints || 500 }) || `仅含新人赠送 ${bonusPoints || 500} 积分`}</span>
                    </li>
                    <li className="d-flex align-items-start" style={{ marginBottom: '14px' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 208, 132, 0.15)', marginRight: 10, flexShrink: 0, marginTop: 2 }}>
                        <FiCheck style={{ fontSize: 11, color: '#00d084', fontWeight: 'bold' }} />
                      </span>
                      <span style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.5 }}>{t('packages.features.standardSupport') || 'Standard technical support'}</span>
                    </li>
                  </ul>
                  <button onClick={() => { setSelectedPlan('free'); onGotoPlans?.() }} style={{ position: 'relative', zIndex: 2, width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px' }}>
                    {t('packages.choosePlan') || 'Choose Plan'}
                  </button>
                </div>
              </div>

              {(packages || []).filter((pkg: any) => String(pkg.plan_type || pkg.planType || '').toLowerCase() !== 'credits').map((pkg: any) => (
                <div key={pkg.id} className="col-lg-3 mb-4">
                  <div className="balance-card" style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(121,74,255,0.14), rgba(20,20,20,0.9))', border: selectedPlan === pkg.id ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(121,74,255,0.25)', borderRadius: '14px', padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform .2s ease, box-shadow .2s ease', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
                    <div className="text-center mb-4" style={{ position: 'relative', zIndex: 1 }}>
                      {(() => {
                        const planType = String(pkg.planType || pkg.plan_type || '').toLowerCase()
                        const rawName = String(pkg.name || '').toLowerCase()
                        const name = (() => {
                          if (planType === 'basic') return 'Plus'
                          if (planType === 'pro' || rawName.includes('pro')) return 'Pro'
                          if (planType === 'enterprise' || planType === 'max') return 'Max'
                          if (rawName.includes('plus') || rawName.includes('member')) return 'Plus'
                          if (rawName.includes('vip')) return 'Pro'
                          if (rawName.includes('premium') || rawName.includes('max')) return 'Max'
                          return pkg.name
                        })()
                        return (
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '0.5px' }}>{name}</h3>
                        )
                      })()}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
                        <span style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>${(pkg.priceCents || 0) / 100}</span>
                        <span style={{ fontSize: 14, color: '#9aa0a6' }}>{t('packages.perMonth') || '/mo'}</span>
                      </div>
                    </div>
                    <ul className="list-unstyled" style={{ flex: 1, marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                      {formatFeaturesWizard(pkg).map((feature: string, idx: number) => (
                        <li key={idx} className="d-flex align-items-start" style={{ marginBottom: '14px' }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 208, 132, 0.15)', marginRight: 10, flexShrink: 0, marginTop: 2 }}>
                            <FiCheck style={{ fontSize: 11, color: '#00d084', fontWeight: 'bold' }} />
                          </span>
                          <span style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.5 }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => { setSelectedPaidPkg(pkg); setConfirmOpen(true) }} style={{ position: 'relative', zIndex: 2, width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px' }}>
                      {t('packages.choosePlan') || 'Choose Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
              {t('onboarding.wizard.plan.note') || '你可以在后续随时前往“购买套餐”升级。'}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1a1a1a', marginTop: 16, paddingTop: 12 }}>
        <button onClick={goPrev} disabled={currentStep === 1} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'transparent', color: currentStep === 1 ? '#555' : '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
        }}>
          <FiChevronLeft /> {t('onboarding.wizard.prev') || '上一步'}
        </button>
        {currentStep < totalSteps ? (
          <button onClick={goNext} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px'
          }}>
            {t('onboarding.wizard.next') || '下一步'} <FiArrowRight />
          </button>
        ) : (
          <button onClick={finish} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px'
          }}>
            {t('onboarding.wizard.finish') || '完成'}
          </button>
        )}
      </div>
      </div>

      {/* Confirm purchase modal */}
      {confirmOpen && selectedPaidPkg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 24, width: 'min(520px, 92vw)' }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>{t('packages.confirmPurchase') || 'Confirm Purchase'}</h3>
            <div style={{ color: '#ccc', fontSize: 14, marginBottom: 16 }}>
              {t('packages.purchaseName') || 'Plan'}: <b>{selectedPaidPkg.name}</b> — ¥{(selectedPaidPkg.priceCents || 0)/100} {t('packages.perMonth') || '/月'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmOpen(false)} style={{ background: '#222', color: '#ccc', border: '1px solid #333', borderRadius: 8, padding: '10px 14px' }}>{t('common.cancel') || 'Cancel'}</button>
              <button disabled={purchasing} onClick={async () => {
                if (purchasing) return
                setPurchasing(true)
                try {
                  const res = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderType: 'package', packageId: selectedPaidPkg.id, paymentMethod: 'pending' }) })
                  const data = await res.json()
                  if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Failed to create order')
                  const orderNo = data.data.order.orderNo
                  setPendingOrderNo(orderNo)
                  setConfirmOpen(false)
                  setShowPaymentMethodModal(true)
                } catch (e) {
                  console.error(e)
                  setPurchasing(false)
                }
              }} style={{ background: 'linear-gradient(135deg,#794aff,#b084ff)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 700 }}>
                {purchasing ? (t('packages.processing') || 'Processing...') : (t('common.confirm') || 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onSelectMethod={async (method) => {
          if (!pendingOrderNo || processingPayment) return
          setProcessingPayment(true)
          try {
            const endpoint = method === 'stripe' ? '/api/orders/pay/stripe' : '/api/orders/pay/antom'
            const payResp = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: pendingOrderNo }) })
            const payData = await payResp.json()
            if (method === 'stripe') {
              if (!payResp.ok || !payData?.success || !payData?.data?.checkoutUrl) throw new Error(payData?.error?.message || 'Stripe init failed')
              window.location.href = payData.data.checkoutUrl
            } else {
              if (!payResp.ok || !payData?.success || !payData?.data?.redirectUrl) throw new Error(payData?.error?.message || 'Antom init failed')
              window.location.href = payData.data.redirectUrl
            }
          } catch (e) {
            console.error(e)
            setProcessingPayment(false)
          }
        }}
        processing={processingPayment}
      />
    </div>
  )
}

function InlineCreateKey({ creating, setCreating, setCreatedKey, setCreateError }: { creating: boolean; setCreating: (v: boolean) => void; setCreatedKey: (v: { id: string; masked: string; full: string }) => void; setCreateError: (v: string | null) => void }) {
  const { t } = useT()
  const onCreate = async () => {
    try {
      setCreating(true)
      setCreateError(null)
      const res = await fetch('/api/apikeys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'My API Key' }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to create')
      const id = body?.apiKey?.id
      const masked = body?.apiKey?.apiKey
      const full = body?.apiKey?.fullKey
      if (id && full) {
        try {
          const STORAGE_KEY = 'apikeys_fullkey_cache'
          const cachedRaw = localStorage.getItem(STORAGE_KEY)
          const cache = cachedRaw ? JSON.parse(cachedRaw) : {}
          cache[id] = full
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
        } catch {}
      }
      setCreatedKey({ id, masked, full })
    } catch (e: any) {
      setCreateError(e?.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }
  return (
    <button onClick={onCreate} disabled={creating} style={{ background: creating ? '#333' : 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', minWidth: 260, cursor: creating ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
      {creating ? (t('dashboard.apiKeys.create.creating') || 'Creating...') : (t('dashboard.apiKeys.create.createBtn') || 'Create API Key')}
    </button>
  )
}
