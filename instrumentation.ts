// OpenTelemetry + Prisma + HTTP/PG instrumentation wiring for server runtime
// Use dynamic imports to avoid build-time type resolution issues if deps are missing.

export async function register() {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
  if (isBuildPhase) return
  const isNode = typeof process !== 'undefined' && (process as any).release?.name === 'node'
  if (!isNode) return
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
