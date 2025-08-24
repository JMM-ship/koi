'use client'

import { useSession } from 'next-auth/react'
import GoogleOneTap from './GoogleOneTap'

export default function GoogleOneTapWrapper() {
  const { data: session, status } = useSession()
  
  // Only show Google One Tap if:
  // 1. Google One Tap is enabled
  // 2. User is not authenticated
  // 3. Session status is not loading
  if (
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === 'true' &&
    status !== 'loading' &&
    !session
  ) {
    return <GoogleOneTap />
  }

  return null
}