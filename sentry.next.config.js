// Wrapper to apply Sentry's Next.js plugin in next.config.mjs
function wrapWithSentry(nextConfig) {
  try {
    const { withSentryConfig } = require('@sentry/nextjs')
    return withSentryConfig(nextConfig, {
      // keep logs quiet during build
      silent: true,
    })
  } catch (e) {
    // Fallback: if sentry plugin not available, return the original config
    return nextConfig
  }
}

module.exports = { wrapWithSentry }

