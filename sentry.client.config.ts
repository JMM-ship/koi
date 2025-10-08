// Lazy require to avoid TS build error when dependency is not yet installed locally
// and to keep client bundle tolerant if Sentry is not configured
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sentry: any = (() => { try { return require('@sentry/nextjs') } catch { return null } })()

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''
const environment = process.env.SENTRY_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
const release = process.env.VERCEL_GIT_COMMIT_SHA || undefined

if (Sentry?.init) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  })
}
