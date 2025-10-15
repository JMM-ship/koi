import enCommon from './en/common.json'
import enHeader from './en/header.json'
import enAuth from './en/auth.json'
import enDashboard from './en/dashboard.json'
import enReasons from './en/reasons.json'
import enBuckets from './en/buckets.json'
import enToasts from './en/toasts.json'
import enSidebar from './en/sidebar.json'

import zhCommon from './zh/common.json'
import zhHeader from './zh/header.json'
import zhAuth from './zh/auth.json'
import zhDashboard from './zh/dashboard.json'
import zhReasons from './zh/reasons.json'
import zhBuckets from './zh/buckets.json'
import zhToasts from './zh/toasts.json'
import zhSidebar from './zh/sidebar.json'

export const PREBUNDLED_DICTIONARIES = {
  en: {
    common: enCommon,
    header: enHeader,
    auth: enAuth,
    dashboard: enDashboard,
    reasons: enReasons,
    buckets: enBuckets,
    toasts: enToasts,
    sidebar: enSidebar,
  },
  zh: {
    common: zhCommon,
    header: zhHeader,
    auth: zhAuth,
    dashboard: zhDashboard,
    reasons: zhReasons,
    buckets: zhBuckets,
    toasts: zhToasts,
    sidebar: zhSidebar,
  }
} as const

