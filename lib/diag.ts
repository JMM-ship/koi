export function diagEnabled(): boolean {
  return process.env.KOI_DIAG === '1'
}

export function diag(label: string, data?: any) {
  if (!diagEnabled()) return
  try {
    // Avoid logging secrets accidentally
    if (data && typeof data === 'object') {
      const safe = JSON.parse(JSON.stringify(data))
      console.log(`[DIAG] ${label}`, safe)
    } else if (typeof data !== 'undefined') {
      console.log(`[DIAG] ${label}`, data)
    } else {
      console.log(`[DIAG] ${label}`)
    }
  } catch {
    console.log(`[DIAG] ${label}`)
  }
}

export function timer(label: string) {
  const start = Date.now()
  return {
    end(extra?: any) {
      const ms = Date.now() - start
      diag(`${label}:ms`, ms)
      if (typeof extra !== 'undefined') diag(`${label}:extra`, extra)
      return ms
    }
  }
}

