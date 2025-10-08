describe('Prisma instrumentation is included for DB spans', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV, SENTRY_DSN: 'dsn' }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('prisma instrumentation present in sdk options when enabled', async () => {
    process.env.SENTRY_OTEL_ENABLE = '1'
    const ins = await import('@/instrumentation')
    await (ins as any).register()
    const sdkStub = await import('@opentelemetry/sdk-node')
    const capturedOptions = (sdkStub as any).__getCapturedOptions()
    const list = capturedOptions?.instrumentations || []
    const hasPrisma = list.some((i: any) => i?.marker === 'prisma' || i?.name === 'prisma')
    expect(hasPrisma).toBe(true)
  })
})
