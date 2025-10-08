import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || ''
const environment = process.env.SENTRY_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
const release = process.env.VERCEL_GIT_COMMIT_SHA || undefined

Sentry.init({
  dsn,
  environment,
  release,
  tracesSampler: (ctx) => {
    const env = environment
    if (env === 'development' || env === 'preview') return 1.0
    // production or others
    return 0.2
  },
  sendDefaultPii: true,
  beforeSend(event) {
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

try {
  if (process.env.VERCEL_REGION) {
    Sentry.setTag('region', process.env.VERCEL_REGION)
  }
} catch {}

