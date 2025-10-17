import enCommon from './en/common.json'
import enHeader from './en/header.json'
import enAuth from './en/auth.json'
import enDashboard from './en/dashboard.json'
import enReasons from './en/reasons.json'
import enBuckets from './en/buckets.json'
import enToasts from './en/toasts.json'
import enSidebar from './en/sidebar.json'
import enPackages from './en/packages.json'
import enHome from './en/home.json'
import enOnboarding from './en/onboarding.json'

import zhCommon from './zh/common.json'
import zhHeader from './zh/header.json'
import zhAuth from './zh/auth.json'
import zhDashboard from './zh/dashboard.json'
import zhReasons from './zh/reasons.json'
import zhBuckets from './zh/buckets.json'
import zhToasts from './zh/toasts.json'
import zhSidebar from './zh/sidebar.json'
import zhPackages from './zh/packages.json'
import zhHome from './zh/home.json'
import zhOnboarding from './zh/onboarding.json'

import viCommon from './vi/common.json'
import viHeader from './vi/header.json'
import viAuth from './vi/auth.json'
import viDashboard from './vi/dashboard.json'
import viReasons from './vi/reasons.json'
import viBuckets from './vi/buckets.json'
import viToasts from './vi/toasts.json'
import viSidebar from './vi/sidebar.json'
import viPackages from './vi/packages.json'
import viHome from './vi/home.json'
import viOnboarding from './vi/onboarding.json'
import viAdmin from './vi/admin.json'

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
    packages: enPackages,
    home: enHome,
    onboarding: enOnboarding,
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
    packages: zhPackages,
    home: zhHome,
    onboarding: zhOnboarding,
  },
  vi: {
    common: viCommon,
    header: viHeader,
    auth: viAuth,
    dashboard: viDashboard,
    reasons: viReasons,
    buckets: viBuckets,
    toasts: viToasts,
    sidebar: viSidebar,
    packages: viPackages,
    home: viHome,
    onboarding: viOnboarding,
    admin: viAdmin,
  }
} as const
