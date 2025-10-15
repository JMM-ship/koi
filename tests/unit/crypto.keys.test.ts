import { encryptApiKey, decryptApiKey } from '@/app/lib/crypto'

describe('crypto env key strategy', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('uses API_KEYS_ATREST_KEY (base64 32B) when provided', () => {
    // Prepare a fixed 32-byte key and base64 encode
    const key32 = Buffer.alloc(32, 7).toString('base64')
    process.env.API_KEYS_ATREST_KEY = key32
    delete process.env.ENCRYPTION_KEY

    const aad = 'id-123'
    const pt = 'sk-live-AAA'
    const enc = encryptApiKey(pt, aad)
    const dec = decryptApiKey(enc, aad)
    expect(dec).toBe(pt)
  })

  test('falls back to ENCRYPTION_KEY via scrypt when API_KEYS_ATREST_KEY is absent', () => {
    delete process.env.API_KEYS_ATREST_KEY
    process.env.ENCRYPTION_KEY = 'pepper-xyz'

    const aad = 'id-xyz'
    const pt = 'sk-test-BBB'
    const enc = encryptApiKey(pt, aad)
    const dec = decryptApiKey(enc, aad)
    expect(dec).toBe(pt)
  })

  test('throws when API_KEYS_ATREST_KEY is wrong length', () => {
    // 16 bytes → invalid
    const key16 = Buffer.alloc(16, 1).toString('base64')
    process.env.API_KEYS_ATREST_KEY = key16
    delete process.env.ENCRYPTION_KEY

    expect(() => encryptApiKey('pt', 'aad')).toThrow(/32 bytes/)
  })

  test('throws when neither API_KEYS_ATREST_KEY nor ENCRYPTION_KEY provided', () => {
    delete process.env.API_KEYS_ATREST_KEY
    delete process.env.ENCRYPTION_KEY

    expect(() => encryptApiKey('pt', 'aad')).toThrow(/Missing encryption key/)
  })
})

