// OpenTelemetry + Prisma + HTTP/PG instrumentation wiring for server runtime
// Use dynamic imports to avoid build-time type resolution issues if deps are missing.

export async function register() {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
  if (isBuildPhase) return
  const isNode = typeof process !== 'undefined' && (process as any).release?.name === 'node'
  if (!isNode) return
  // Always initialize Sentry in server runtime if DSN present
  try {
    const dsn = process.env.SENTRY_DSN || ''
    if (dsn) {
      const sentryMod = ['@sentry', '/nextjs'].join('')
      const Sentry: any = (await import(sentryMod as any)) as any
      const environment = process.env.SENTRY_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
      const release = process.env.VERCEL_GIT_COMMIT_SHA || undefined
      if (Sentry?.init) {
        Sentry.init({
          dsn,
          environment,
          release,
          tracesSampler: (_ctx: any) => {
            if (environment === 'development' || environment === 'preview') return 1.0
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
        if (process.env.VERCEL_REGION && Sentry?.setTag) {
          Sentry.setTag('region', process.env.VERCEL_REGION)
        }
      }
    }
  } catch {}
  const enabled = process.env.SENTRY_OTEL_ENABLE === '1'
  if (!enabled) return
  try {
    const sdkNodeMod = ['@opentelemetry', '/sdk-node'].join('')
    const httpMod = ['@opentelemetry', '/instrumentation-http'].join('')
    const pgMod = ['@opentelemetry', '/instrumentation-pg'].join('')
    const prismaMod = ['@prisma', '/instrumentation'].join('')
    const [{ NodeSDK }, { HttpInstrumentation }, { PgInstrumentation }, { PrismaInstrumentation }] = await Promise.all([
      import(sdkNodeMod as any),
      import(httpMod as any),
      import(pgMod as any),
      import(prismaMod as any),
    ])
    const sdk = new NodeSDK({
      instrumentations: [
        new HttpInstrumentation(),
        new PgInstrumentation(),
        new PrismaInstrumentation(),
      ],
    })
    await sdk.start()
  } catch {
    // swallow
  }
}
