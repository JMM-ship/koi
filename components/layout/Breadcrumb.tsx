"use client";
import Link from 'next/link'
import { useT } from '@/contexts/I18nContext'

export default function Breadcrumb({ breadcrumbTitle }: { breadcrumbTitle?: string }) {
  let t = (k: string) => k
  try { t = useT().t } catch {}
  if (!breadcrumbTitle) return null
  return (
    <div className="container py-3">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link href="/">{t('common.home') || 'Home'}</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{breadcrumbTitle}</li>
        </ol>
      </nav>
    </div>
  )
}
