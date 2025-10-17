export type TrackTags = Record<string, string | number | boolean | undefined>

export function trackOnboardingEvent(name: string, tags?: TrackTags) {
  try {
    const enabled = (process.env.NEXT_PUBLIC_ONBOARDING_TRACKING || '').toString().toLowerCase()
    const isOn = enabled === '1' || enabled === 'true'
    if (!isOn) return
    // Lazy import to avoid SSR build impacts
    const Sentry: any = require('@sentry/nextjs')
    if (Sentry?.captureMessage) {
      Sentry.captureMessage(name, { level: 'info', tags: tags || {} })
    }
  } catch {}
}
