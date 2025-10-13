export type HeaderGetter = {
  get(name: string): string | null | undefined
}

export function getRequestCountry(headers: HeaderGetter | Headers): string | null {
  try {
    // Prefer platform headers
    const vercel = headers.get('x-vercel-ip-country') || headers.get('X-Vercel-IP-Country')
    const cf = headers.get('cf-ipcountry') || headers.get('CF-IPCountry')
    const raw = (vercel || cf || '').toString().trim()
    if (!raw) return null
    return raw.toUpperCase()
  } catch {
    return null
  }
}

