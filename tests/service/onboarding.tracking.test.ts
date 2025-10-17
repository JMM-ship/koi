/** @jest-environment node */

describe('onboarding tracking via Sentry', () => {
  beforeEach(async () => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_ONBOARDING_TRACKING = 'true'
    const sentry = await import('@sentry/nextjs') as any
    sentry.__resetCapturedMessages?.()
  })

  test('emits captureMessage with name and tags when enabled', async () => {
    const { trackOnboardingEvent } = await import('@/lib/track')
    trackOnboardingEvent('onboarding_step_done', { step: 'createKey', role: 'user' })
    const sentry = await import('@sentry/nextjs') as any
    const msgs = sentry.__getCapturedMessages?.() || []
    expect(msgs.length).toBe(1)
    expect(msgs[0].message).toBe('onboarding_step_done')
    expect(msgs[0].context?.tags?.step).toBe('createKey')
    expect(msgs[0].context?.tags?.role).toBe('user')
  })

  test('does not emit when disabled', async () => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_ONBOARDING_TRACKING = 'false'
    const sentry = await import('@sentry/nextjs') as any
    sentry.__resetCapturedMessages?.()
    const { trackOnboardingEvent } = await import('@/lib/track')
    trackOnboardingEvent('onboarding_started', { stepCount: 4 })
    const msgs = sentry.__getCapturedMessages?.() || []
    expect(msgs.length).toBe(0)
  })
})

