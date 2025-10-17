"use client";

import React from 'react'
import ModalPortal from '@/components/common/ModalPortal'
import { useT } from '@/contexts/I18nContext'

type Props = {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
}

export default function SupportContactModal({ isOpen, onClose, imageSrc }: Props) {
  let t = (k: string) => k
  try { t = useT().t } catch {}

  const title = t('common.support.modalTitle') || 'Contact Support'
  const subtitle = t('common.support.modalSubtitle') || 'Scan to join our Discord support channel'
  const alt = t('common.support.qrAlt') || 'Discord support QR'

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} title={title}>
      <div data-testid="support-modal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <p style={{ color: '#bbb', textAlign: 'center', marginTop: 0 }}>{subtitle}</p>
        {/* Use img instead of next/image to keep tests simple */}
        <img
          src={imageSrc}
          alt={alt}
          style={{
            width: 'min(360px, 80vw)',
            height: 'auto',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        />
      </div>
    </ModalPortal>
  )
}

