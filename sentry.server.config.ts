// Lazy require to avoid TS build error when dependency is not yet installed locally
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sentry: any = (() => { try { return require('@sentry/nextjs') } catch { return null } })()

// Deprecated: Sentry.init moved to instrumentation.register() per Next.js App Router guidance.
// This file intentionally left as a no-op to avoid duplicate initialization.

// Make this file a module to avoid global scope collisions
export {}
