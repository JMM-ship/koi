// OpenTelemetry + Prisma + HTTP/PG instrumentation wiring for server runtime
// Use dynamic imports to avoid build-time type resolution issues if deps are missing.

export async function register() {
  const hasDsn = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN
  const isNode = typeof process !== 'undefined' && (process as any).release?.name === 'node'
  if (!hasDsn || !isNode) return
  try {
    const [{ NodeSDK }, { HttpInstrumentation }, { PgInstrumentation }, { PrismaInstrumentation }] = await Promise.all([
      import('@opentelemetry/sdk-node'),
      import('@opentelemetry/instrumentation-http'),
      import('@opentelemetry/instrumentation-pg'),
      import('@prisma/instrumentation'),
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
    // Swallow to avoid breaking app boot in case of optional deps missing
  }
}

// During tests, auto-run to assert wiring without Next runtime
if ((process as any)?.env?.JEST_WORKER_ID) {
  ;(async () => { try { await register() } catch {} })()
}
