import { getDictionary } from '@/lib/i18n/server'

describe('i18n: dictionary loading', () => {
  test('loads header namespace for en and zh', async () => {
    const en = await getDictionary('en', ['header'])
    const zh = await getDictionary('zh', ['header'])

    // Expect at least signIn key exists once implemented
    expect(en.header?.signIn).toBeDefined()
    expect(zh.header?.signIn).toBeDefined()

    // Ensure different languages map to different values (sanity)
    expect(en.header.signIn).not.toBe(zh.header.signIn)
  })
})

