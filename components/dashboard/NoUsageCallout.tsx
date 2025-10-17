"use client";
import React from 'react'
import { useT } from '@/contexts/I18nContext'

export default function NoUsageCallout({ onCreateApiKey }: { onCreateApiKey?: () => void }) {
  const { t } = useT()
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>
        {t('onboarding.callout.noUsage.title') || '还没有使用记录'}
      </div>
      <div style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>
        {t('onboarding.callout.noUsage.desc') || '创建一个 API Key 并运行一次测试调用，开始记录你的使用情况。'}
      </div>
      <button onClick={onCreateApiKey} style={{ background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px' }}>
        {t('onboarding.callout.noUsage.cta') || '去创建 API Key'}
      </button>
    </div>
  )
}

