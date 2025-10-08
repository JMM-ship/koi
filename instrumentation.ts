// OpenTelemetry + Prisma + HTTP/Undici/PG instrumentation wiring for server runtime
import { NodeSDK } from '@opentelemetry/sdk-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { PrismaInstrumentation } from '@prisma/instrumentation'

// Guard: only start in Node server environment and when Sentry is configured
const hasDsn = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN
const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node'

if (hasDsn && isNode) {
  try {
    const sdk = new NodeSDK({
      instrumentations: [
        new HttpInstrumentation(),
        new UndiciInstrumentation(),
        new PgInstrumentation(),
        new PrismaInstrumentation(),
      ],
    })
    // Fire and forget start; if it throws, swallow to avoid breaking app boot
    // In production, Sentry will pick up OTel spans via its SDK integration
    ;(async () => { try { await sdk.start() } catch {} })()
  } catch {
    // no-op: do not block app startup on instrumentation issues
  }
}

// Next.js App Router will load this file at appropriate lifecycle points.
export function register() {
  // Intentionally left blank; side-effects above perform the setup.
}

