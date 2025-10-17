import fs from 'fs'
import path from 'path'

function collectKeys(obj: any, prefix = ''): string[] {
  if (obj == null || typeof obj !== 'object') return [prefix].filter(Boolean)
  const keys: string[] = []
  for (const k of Object.keys(obj)) {
    const next = prefix ? `${prefix}.${k}` : k
    if (obj[k] && typeof obj[k] === 'object') keys.push(...collectKeys(obj[k], next))
    else keys.push(next)
  }
  return keys
}

describe('i18n: vi dictionary coverage', () => {
  const base = path.join(process.cwd(), 'locales')
  const enDir = path.join(base, 'en')
  const viDir = path.join(base, 'vi')

  const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'))

  for (const file of files) {
    test(`vi has keys matching en for ${file}`, () => {
      const enPath = path.join(enDir, file)
      const viPath = path.join(viDir, file)
      expect(fs.existsSync(viPath)).toBe(true)
      const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'))
      const vi = JSON.parse(fs.readFileSync(viPath, 'utf-8'))
      const enKeys = collectKeys(en).sort()
      const viKeys = collectKeys(vi).sort()
      const missing = enKeys.filter(k => !viKeys.includes(k))
      const extra = viKeys.filter(k => !enKeys.includes(k))
      if (missing.length || extra.length) {
        const msg = [
          missing.length ? `Missing in vi: ${missing.join(', ')}` : '',
          extra.length ? `Extra in vi: ${extra.join(', ')}` : ''
        ].filter(Boolean).join('\n')
        throw new Error(msg)
      }
      // quick sanity check: some vi values should differ from en values for translatable fields
      // we only spot-check a few common keys if present
      const checks = ['header.signIn', 'common.confirm', 'common.cancel']
      for (const key of checks) {
        const get = (o: any, p: string) => p.split('.').reduce((acc, cur) => (acc ? acc[cur] : undefined), o)
        const ev = get(en, key)
        const vv = get(vi, key)
        if (typeof ev === 'string' && typeof vv === 'string') {
          expect(vv).not.toBe(ev)
        }
      }
    })
  }
})

