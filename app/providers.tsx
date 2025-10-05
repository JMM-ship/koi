"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>
    <ReferralAttachOnLogin />
    {children}
  </SessionProvider>;
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
