import { getDictionary } from '@/lib/i18n/server'

describe('i18n: dictionary loading for vi', () => {
  test('loads header namespace for vi and differs from en', async () => {
    const en = await getDictionary('en', ['header'])
    const vi = await getDictionary('vi', ['header'])

    expect(vi.header?.signIn).toBeDefined()
    expect(en.header?.signIn).toBeDefined()
    expect(vi.header.signIn).not.toBe(en.header.signIn)
  })
})

