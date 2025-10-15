"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SWRConfig } from 'swr'
import { createPersistedSWRProvider } from '@/lib/cache/swrPersist'

export function Providers({ children }: { children: ReactNode }) {
  // Configure a persisted cache provider for SWR.
  const swrProvider = createPersistedSWRProvider({
    storageKey: '__swr_cache_v1__',
    version: 'v1',
    // Allowlist was confirmed by you (includes apikeys and dashboard usage)
    allowlist: [
      '/api/referrals/summary',
      '/api/referrals/invites',
      '/api/packages/credits',
      '/api/packages',
      '/api/apikeys',
      '/api/dashboard',
      '/api/credits/info',
      '/api/profile',
    ],
    softTtlMs: 5 * 60 * 1000,
    hardTtlMs: 24 * 60 * 60 * 1000,
  })

  return (
    <SessionProvider>
      <SWRConfig value={{
        provider: swrProvider,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        // Keep defaults light; components can override as needed
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 2000,
      }}>
        <ReferralAttachOnLogin />
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}

function ReferralAttachOnLogin() {
  const { status } = useSession()
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (status !== 'authenticated') return
    const code = window.localStorage.getItem('inviteCode')
    const body = code ? { code } : undefined
    ;(async () => {
      try {
        await fetch('/api/referrals/attach', {
          method: 'POST',
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        })
      } catch {}
      if (code) {
        try { window.localStorage.removeItem('inviteCode') } catch {}
      }
    })()
  }, [status])
  return null
}
