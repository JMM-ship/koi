describe('next.config with Sentry plugin wrapper', () => {
  const OLD_ENV = process.env
  let called = false
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    jest.doMock('@sentry/nextjs', () => ({
      withSentryConfig: (cfg: any, _opts: any) => { called = true; return { ...cfg, __wrapped: true } }
    }))
  })
  afterEach(() => {
    process.env = OLD_ENV
    jest.dontMock('@sentry/nextjs')
    called = false
  })
  test('wraps nextConfig via withSentryConfig', async () => {
    const mod: any = await import('@/next.config.mjs')
    expect(called).toBe(true)
    expect(mod.default?.__wrapped).toBe(true)
  })
})

