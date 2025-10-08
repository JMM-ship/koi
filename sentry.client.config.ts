import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''
const environment = process.env.SENTRY_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
const release = process.env.VERCEL_GIT_COMMIT_SHA || undefined

Sentry.init({
  dsn,
  environment,
  release,
  tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
})

