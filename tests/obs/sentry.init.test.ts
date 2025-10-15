describe('Sentry init (server) — environment, release, sampler', () => {
  const OLD_ENV = process.env

  beforeEach(async () => {
    jest.resetModules()
    process.env = { ...OLD_ENV,
      SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      VERCEL_ENV: 'production',
      VERCEL_GIT_COMMIT_SHA: 'abc123',
      VERCEL_REGION: 'sfo1',
    }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('initializes with DSN, env, release and tracesSampler (prod=0.2)', async () => {
    const ins = await import('@/instrumentation')
    await (ins as any).register()
    const sentry = await import('@sentry/nextjs')
    const arg = (sentry as any).__getInitArg()
    expect(arg.dsn).toBe('https://examplePublicKey@o0.ingest.sentry.io/0')
    expect(arg.environment).toBe('production')
    expect(arg.release).toBe('abc123')
    expect(typeof arg.tracesSampler).toBe('function')
    const rate = arg.tracesSampler!({ transactionContext: { name: 'test' } } as any)
    expect(rate).toBeCloseTo(0.2)
    const tagCalls = (sentry as any).__getTagCalls()
    expect(tagCalls).toContainEqual(['region', 'sfo1'])
  })

  test('preview env uses 1.0 sample rate', async () => {
    process.env.VERCEL_ENV = 'preview'
    const ins = await import('@/instrumentation')
    await (ins as any).register()
    const sentry = await import('@sentry/nextjs')
    const arg = (sentry as any).__getInitArg()
    const rate = arg.tracesSampler!({ transactionContext: { name: 'x' } } as any)
    expect(rate).toBe(1.0)
  })
})
