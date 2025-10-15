import { jest } from '@jest/globals'

describe('Sentry tags include region/service', () => {
  const OLD_ENV = process.env
  let initMock: jest.Mock, setTagMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV,
      SENTRY_DSN: 'dsn',
      VERCEL_ENV: 'development',
      VERCEL_REGION: 'sfo1',
      VERCEL_URL: 'koi.vercel.app'
    }
    initMock = jest.fn()
    setTagMock = jest.fn()
    jest.doMock('@sentry/nextjs', () => ({ init: initMock, setTag: setTagMock }))
  })

  afterEach(() => {
    process.env = OLD_ENV
    jest.dontMock('@sentry/nextjs')
  })

  test('sets region tag based on VERCEL_REGION', async () => {
    const ins = await import('@/instrumentation')
    await (ins as any).register()
    expect(setTagMock).toHaveBeenCalledWith('region', 'sfo1')
  })
})
