describe('Sentry beforeSend preserves request headers and attaches response headers if provided', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV,
      SENTRY_DSN: 'dsn',
      VERCEL_ENV: 'production'
    }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('beforeSend returns headers intact and copies extra.responseHeaders', async () => {
    const ins = await import('@/instrumentation')
    await (ins as any).register()
    const sentry = await import('@sentry/nextjs')
    const arg = (sentry as any).__getInitArg()
    expect(typeof arg.beforeSend).toBe('function')
    const eventIn: any = {
      request: { headers: { a: '1' } },
      extra: { responseHeaders: { b: '2' } }
    }
    const out = arg.beforeSend!(eventIn)
    expect(out.request.headers.a).toBe('1')
    expect(out.contexts?.response?.headers?.b).toBe('2')
  })
})
