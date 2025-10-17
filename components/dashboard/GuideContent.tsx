"use client";

import React, { useEffect, useState } from 'react'
import { useT } from '@/contexts/I18nContext'
import Image, { StaticImageData } from 'next/image'
import { FiAlertTriangle, FiHelpCircle } from 'react-icons/fi'
import vscodeGuide1 from '@/vscode_guide1.PNG'
import vscodeGuide2 from '@/vscode_guide2.PNG'

type Props = {
  onNavigateToApiKeys?: () => void
}

function Tag({ label, color = '#ff3b30' }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 700,
      color: '#fff',
      background: color,
      marginLeft: 8
    }}>{label}</span>
  )
}

function Section({ title, tag, tagColor, children }: { title: string; tag?: string; tagColor?: string; children: React.ReactNode }) {
  return (
    <details style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--dashboard-border)',
      borderRadius: 10,
      padding: 12,
      margin: '8px 0'
    }}>
      <summary style={{
        listStyle: 'none',
        cursor: 'pointer',
        color: '#fff',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center'
      }}>
        {title}
        {tag ? <Tag label={tag} color={tagColor} /> : null}
      </summary>
      <div style={{ color: '#ccc', marginTop: 12, lineHeight: 1.65 }}>{children}</div>
    </details>
  )
}

function Quote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: '3px solid #555',
      paddingLeft: 12,
      margin: '10px 0',
      color: '#ddd'
    }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  )
}

function Code({ code }: { code: string }) {
  return (
    <pre style={{
      background: '#0d0d0d',
      border: '1px solid #1a1a1a',
      borderRadius: 8,
      padding: 12,
      overflowX: 'auto',
      color: '#d1d5db',
      fontSize: 13,
      lineHeight: 1.5
    }}><code>{code}</code></pre>
  )
}

function Thumb({ img, alt, onClick }: { img: StaticImageData; alt: string; onClick: () => void }) {
  const ratio = Math.max(0.35, Math.min(0.75, img.height / img.width))
  const paddingBottom = `${(ratio * 100).toFixed(2)}%`
  return (
    <div
      style={{ position: 'relative', width: '100%', height: 0, paddingBottom, border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden', cursor: 'zoom-in', background: '#0d0d0d' }}
      onClick={onClick}
      title="点击放大"
    >
      <Image src={img} alt={alt} fill sizes="(max-width: 768px) 100vw, 500px" style={{ objectFit: 'contain' }} />
    </div>
  )
}

export default function GuideContent({ onNavigateToApiKeys }: Props) {
  const { t } = useT()
  const [enlarge, setEnlarge] = useState<StaticImageData | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // 主卡片样式统一
  const card: React.CSSProperties = {
    background: 'var(--dashboard-card-bg)',
    border: '1px solid var(--dashboard-border)',
    borderRadius: 12,
    padding: 16,
  }

  return (
    <div suppressHydrationWarning>
      <div className="dashboard-header mb-3">
        <div className="text-center">
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <FiHelpCircle style={{ color: '#b084ff', fontSize: 24 }} />
            {t('dashboard.guide.title') || 'Help & Support'}
          </h1>
          <p style={{ fontSize: 15, color: '#999', marginBottom: 8 }}>
            {t('dashboard.guide.subtitle') || 'A quick tour of account basics and setup.'}
          </p>
          <div style={{
            background: 'rgba(255, 193, 7, 0.08)',
            border: '1px solid rgba(255, 193, 7, 0.18)',
            borderRadius: 8,
            padding: '10px 18px',
            margin: '10px auto 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 820
          }}>
            <FiAlertTriangle style={{ color: '#ffc107', fontSize: 18, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#ffc107', textAlign: 'left' }}>
              <strong>{t('dashboard.guide.noteTitle') || 'Tip'}</strong> {t('dashboard.guide.noteDesc') || 'Create an API key and finish VSCode/CLI setup before daily use.'}
            </span>
          </div>
        </div>
      </div>
      {/* Lightbox */}
      {enlarge && (
        <div
          onClick={() => setEnlarge(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', width: 'min(90vw, 1200px)', height: 'min(90vh, 80vw)' }}>
            <Image src={enlarge} alt="preview" fill sizes="90vw" style={{ objectFit: 'contain' }} />
          </div>
        </div>
      )}
      <div style={{ ...card, maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 20, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FiHelpCircle />{t('dashboard.guide.title') || 'Help & Support'}
          </h1>
        </div>
        {/* 内容区卡片：包裹所有折叠项 */}
        <div style={{ display: 'grid', gap: 12, marginTop: 12, gridTemplateColumns: '1fr' }}>
        {/* 账户使用 */}
        <Section title={t('dashboard.guide.account.title')} tag={t('dashboard.guide.tags.mustRead')} tagColor="#ff3b30">
          <div>{t('dashboard.guide.account.p1')}</div>
          <div>{t('dashboard.guide.account.p2')}</div>
          <Quote title={t('dashboard.guide.account.quoteFree.title')}>
            {t('dashboard.guide.account.quoteFree.body')}
          </Quote>
          <Quote title={t('dashboard.guide.account.quoteInvite.title')}>
            {t('dashboard.guide.account.quoteInvite.body')}
          </Quote>
        </Section>

        {/* 使用方式 */}
        <Section title={t('dashboard.guide.usage.title')}>
          <div>{t('dashboard.guide.usage.p1')}</div>
          <div>{t('dashboard.guide.usage.p2')}</div>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={onNavigateToApiKeys}
              style={{ background: 'transparent', border: '1px solid var(--dashboard-border)', color: '#fff', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}
            >{t('dashboard.guide.apiKeysCta')}</button>
          </div>
        </Section>

        {/* VSCode 插件安装 */}
        <Section title={t('dashboard.guide.vscode.title')}>
          <div>{t('dashboard.guide.vscode.desc')}</div>
          <Quote title={t('dashboard.guide.vscode.install.title')}>
            <div>{t('dashboard.guide.vscode.install.step1')}</div>
            <div>{t('dashboard.guide.vscode.install.step2')}</div>
          </Quote>
          <Quote title={t('dashboard.guide.vscode.config.title')}>
            <div>{t('dashboard.guide.vscode.config.step1')}</div>
            {mounted && (
              <div style={{ margin: '8px 0' }} suppressHydrationWarning>
                <div style={{ width: 'min(360px, 100%)' }}>
                  <Thumb img={vscodeGuide1} alt="VSCode Settings" onClick={() => setEnlarge(vscodeGuide1)} />
                </div>
              </div>
            )}
            <div>{t('dashboard.guide.vscode.config.step2')}</div>
            {mounted && (
              <div style={{ margin: '8px 0' }} suppressHydrationWarning>
                <div style={{ width: 'min(360px, 100%)' }}>
                  <Thumb img={vscodeGuide2} alt="Edit in settings.json" onClick={() => setEnlarge(vscodeGuide2)} />
                </div>
              </div>
            )}
            <div>{t('dashboard.guide.vscode.config.step3')}</div>
            <Code code={`"claude-code.environmentVariables": [
    {
        "name": "ANTHROPIC_BASE_URL",
        "value": "https://api.jiuwanliguoxue.com"
    }
]`} />
          </Quote>
          <Quote title={t('dashboard.guide.vscode.apikey.title')}>
            <div>{t('dashboard.guide.vscode.apikey.step1')}</div>
            <div>{t('dashboard.guide.vscode.apikey.step2')}</div>
            <Code code={`{
    "primaryApiKey": "sk-acw-**"
}`} />
          </Quote>
          <Quote title={t('dashboard.guide.vscode.start.title')}>
            {t('dashboard.guide.vscode.start.desc')}
          </Quote>
        </Section>

        {/* CLI 工具 */}
        <Section title={t('dashboard.guide.cli.title')} tag={t('dashboard.guide.tags.advanced')} tagColor="#6c5ce7">
          <div>{t('dashboard.guide.cli.desc')}</div>
          <Quote title={t('dashboard.guide.cli.install.title')}>
            {t('dashboard.guide.cli.install.desc')}
            <Code code={`npm i -g @anthropic-ai/claude-code`} />
          </Quote>
          <Quote title={t('dashboard.guide.cli.config.title')}>
            <div>{t('dashboard.guide.cli.config.line1')}</div>
            <div>{t('dashboard.guide.cli.config.line2')}</div>
          </Quote>
          <Quote title={t('dashboard.guide.cli.use.title')}>
            {t('dashboard.guide.cli.use.desc')}
          </Quote>
        </Section>

        {/* 模型说明 */}
        <Section title={t('dashboard.guide.models.title')}>
          <div>{t('dashboard.guide.models.line1')}</div>
          <div>{t('dashboard.guide.models.line2')}</div>
          <div>{t('dashboard.guide.models.line3')}</div>
          <div style={{ marginTop: 8, color: '#aaa' }}>{t('dashboard.guide.models.note')}</div>
        </Section>

        {/* 积分 & token */}
        <Section title={t('dashboard.guide.credits.title')}>
          <div>{t('dashboard.guide.credits.line1')}</div>
          <div>{t('dashboard.guide.credits.line2')}</div>
          <div>{t('dashboard.guide.credits.line3')}</div>
          <div>{t('dashboard.guide.credits.line4')}</div>
        </Section>

        {/* 开始对话 */}
        <Section title={t('dashboard.guide.start.title')} tag={t('dashboard.guide.tags.tips')} tagColor="#00b894">
          <div>{t('dashboard.guide.start.desc')}</div>
          <Quote title={t('dashboard.guide.start.quoteTitle')}>
            <div>{t('dashboard.guide.start.tip1')}</div>
            <div>{t('dashboard.guide.start.tip2')}</div>
            <div>{t('dashboard.guide.start.tip3')}</div>
          </Quote>
        </Section>

        {/* 套餐选购 */}
        <Section title={t('dashboard.guide.plans.title')} tag={t('dashboard.guide.tags.important')} tagColor="#f39c12">
          <div>{t('dashboard.guide.plans.desc')}</div>
          <Quote title={t('dashboard.guide.plans.subscription.title')}>
            <div>{t('dashboard.guide.plans.subscription.line1')}</div>
            <div>{t('dashboard.guide.plans.subscription.line2')}</div>
          </Quote>
          <Quote title={t('dashboard.guide.plans.independent.title')}>
            <div>{t('dashboard.guide.plans.independent.line1')}</div>
            <div>{t('dashboard.guide.plans.independent.line2')}</div>
            <div>{t('dashboard.guide.plans.independent.line3')}</div>
          </Quote>
          <Quote title={t('dashboard.guide.plans.recommend.title')}>
            <div>{t('dashboard.guide.plans.recommend.line1')}</div>
            <div>{t('dashboard.guide.plans.recommend.line2')}</div>
            <div>{t('dashboard.guide.plans.recommend.line3')}</div>
          </Quote>
        </Section>

        {/* 兑换卡密 */}
        <Section title={t('dashboard.guide.redeem.title')} tag={t('dashboard.guide.tags.common')} tagColor="#7f8c8d">
          <div>{t('dashboard.guide.redeem.desc')}</div>
          <Quote title={t('dashboard.guide.redeem.get.title')}>
            {t('dashboard.guide.redeem.get.desc')}
          </Quote>
          <Quote title={t('dashboard.guide.redeem.steps.title')}>
            <div>{t('dashboard.guide.redeem.steps.s1')}</div>
            <div>{t('dashboard.guide.redeem.steps.s2')}</div>
            <div>{t('dashboard.guide.redeem.steps.s3')}</div>
          </Quote>
          <Quote title={t('dashboard.guide.redeem.faq.title')}>
            {t('dashboard.guide.redeem.faq.desc')}
          </Quote>
        </Section>
        </div>
      </div>
    </div>
  )
}
