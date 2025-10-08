describe('OTel NodeSDK registers http/undici/pg/prisma instrumentations', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV, SENTRY_DSN: 'dsn', VERCEL_ENV: 'production' }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('constructs NodeSDK with http/pg/prisma instrumentations', async () => {
    await import('@/instrumentation')
    const sdkStub = await import('@opentelemetry/sdk-node')
    const capturedOptions = (sdkStub as any).__getCapturedOptions()
    expect(capturedOptions).toBeTruthy()
    const list = capturedOptions?.instrumentations || []
    expect(list.length).toBeGreaterThanOrEqual(3)
    const names = list.map((i: any) => i.name)
    expect(names).toEqual(expect.arrayContaining(['http', 'pg', 'prisma']))
  })
})
