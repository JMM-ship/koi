'use client'

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google: any
  }
}

interface GoogleOneTapProps {
  callbackUrl?: string
}

export default function GoogleOneTap({ callbackUrl = '/dashboard' }: GoogleOneTapProps) {
  const router = useRouter()

  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
    
    if (!googleClientId) {
      console.error('Google Client ID not found')
      return
    }

    // Load Google One Tap script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      // Initialize Google One Tap
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false, // Set to true if you want automatic sign-in
        cancel_on_tap_outside: false,
        prompt_parent_id: 'google-one-tap-prompt',
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true
      })

      // Display the One Tap prompt
      window.google?.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap not displayed:', notification.getNotDisplayedReason())
        }
      })
    }

    // Cleanup
    return () => {
      window.google?.accounts.id.cancel()
      script.remove()
    }
  }, [callbackUrl])

  const handleCredentialResponse = async (response: any) => {
    // Sign in using NextAuth with the Google One Tap credential
    const result = await signIn('google-one-tap', {
      credential: response.credential,
      redirect: false
    })

    if (result?.ok) {
      router.push(callbackUrl)
      router.refresh()
    } else if (result?.error) {
      console.error('Sign in failed:', result.error)
    }
  }

  return (
    <>
      {/* Container for Google One Tap prompt */}
      <div id="google-one-tap-prompt" style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }} />
    </>
  )
}