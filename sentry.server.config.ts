// Lazy require to avoid TS build error when dependency is not yet installed locally
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sentry: any = (() => { try { return require('@sentry/nextjs') } catch { return null } })()

const dsn = process.env.SENTRY_DSN || ''
const environment = process.env.SENTRY_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
const release = process.env.VERCEL_GIT_COMMIT_SHA || undefined

if (Sentry?.init) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampler: (_ctx: any) => {
      const env = environment
      if (env === 'development' || env === 'preview') return 1.0
      return 0.2
    },
    sendDefaultPii: true,
    beforeSend(event: any) {
      try {
        const resp = (event as any).extra?.responseHeaders
        if (resp) {
          ;(event as any).contexts = (event as any).contexts || {}
          ;(event as any).contexts.response = { headers: resp }
        }
      } catch {}
      return event
    },
  })
}

try {
  if (process.env.VERCEL_REGION && Sentry?.setTag) {
    Sentry.setTag('region', process.env.VERCEL_REGION)
  }
} catch {}
