'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'
import GoogleOneTap from '@/components/auth/GoogleOneTap'

export default function SignInPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { showSuccess, showError, showInfo } = useToast()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [verificationSent, setVerificationSent] = useState(false)
    const [countdown, setCountdown] = useState(0)

    // Login form
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
        rememberMe: true
    })

    // Register form
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        verificationCode: ''
    })
    // Referral (optional)
    const [inviteCode, setInviteCode] = useState('')

    // On mount: persist URL ref to localStorage and input
    useEffect(() => {
        const ref = searchParams.get('ref') || ''
        if (ref) {
            try { window.localStorage.setItem('inviteCode', ref) } catch {}
            setInviteCode(ref)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Send verification code
    const sendVerificationCode = async () => {
        if (!registerData.email) {
            setError('Please enter email address')
            showError('Please enter email address')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/send-verification-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registerData.email })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to send verification code')
                showError(data.error || 'Failed to send verification code')
                if (data.remainingSeconds) {
                    setCountdown(data.remainingSeconds)
                    startCountdown(data.remainingSeconds)
                }
            } else {
                setVerificationSent(true)
                setCountdown(60)
                startCountdown(60)
                showSuccess('Verification code sent to your email')
            }
        } catch (err) {
            setError('Error sending verification code')
            showError('Error sending verification code')
        } finally {
            setLoading(false)
        }
    }

    // Countdown
    const startCountdown = (seconds: number) => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email: loginData.email,
                password: loginData.password,
                rememberMe: loginData.rememberMe.toString(),
                redirect: false
            })

            if (result?.error) {
                setError('Invalid email or password')
                showError('Invalid email or password')
            } else if (result?.ok) {
                showSuccess('Login successful!')
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (err) {
            setError('Error during login')
            showError('Error during login')
        } finally {
            setLoading(false)
        }
    }

    // Handle registration
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Best-effort persist invite code before register
            if (inviteCode) {
                try { window.localStorage.setItem('inviteCode', inviteCode) } catch {}
            }
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Registration failed')
                showError(data.error || 'Registration failed')
            } else {
                showSuccess('Registration successful! Logging in...')
                // Auto login after successful registration
                const result = await signIn('credentials', {
                    email: registerData.email,
                    password: registerData.password,
                    redirect: false
                })

                if (result?.ok) {
                    router.push(callbackUrl)
                    router.refresh()
                }
            }
        } catch (err) {
            setError('Error during registration')
            showError('Error during registration')
        } finally {
            setLoading(false)
        }
    }

    // Google login
    const handleGoogleSignIn = () => {
        // Persist invite code before redirecting to Google
        const ref = inviteCode || (searchParams.get('ref') || '')
        if (ref) {
            try { window.localStorage.setItem('inviteCode', ref) } catch {}
        }
        signIn('google', { 
            callbackUrl,
            prompt: 'select_account'
        })
    }

    return (
        <section className="ai-solutions-home-section-1 position-relative overflow-hidden min-vh-100 d-flex align-items-center">
            {/* Google One Tap Component */}
            {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === 'true' && (
                <GoogleOneTap callbackUrl={callbackUrl} />
            )}
            
            <div className="position-absolute top-50 start-50 translate-middle opacity-25">
                <img className="ribbonRotate" src="/assets/imgs/pages/ai-solutions/page-home/home-section-1/wave-circle-img.png" alt="background" />
            </div>
            <div className="container position-relative z-1">
                <div className="row justify-content-center">
                    <div className="col-lg-5 col-md-7 col-sm-9">
                        <div className="card bg-dark border border-secondary shadow-lg">
                            <div className="card-body p-5">
                                {/* Logo */}
                                <div className="text-center mb-4">
                                    <Link href="/">
                                        <div style={{ overflow: 'hidden', width: '120px', height: '80px' }}>
                                            <Image src="/assets/logo.svg" alt="KOI" width={120} height={80} style={{ objectFit: 'cover', objectPosition: 'left center', transform: 'scale(1.2)' }} />
                                        </div>
                                    </Link>
                                </div>

                                {/* Tab switcher */}
                                <ul className="nav nav-pills nav-fill mb-4">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link text-white ${isLogin ? 'active bg-gradient' : ''}`}
                                            onClick={() => { setIsLogin(true); setError('') }}
                                        >
                                            Login
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link text-white ${!isLogin ? 'active bg-gradient' : ''}`}
                                            onClick={() => { setIsLogin(false); setError('') }}
                                        >
                                            Register
                                        </button>
                                    </li>
                                </ul>

                                {/* Error message */}
                                {error && (
                                    <div className="alert alert-danger py-2" role="alert">
                                        {error}
                                    </div>
                                )}

                                {/* Login form */}
                                {isLogin ? (
                                    <form onSubmit={handleLogin}>
                                        <div className="mb-3">
                                            <label className="form-label text-white">Email</label>
                                            <input
                                                type="email"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label text-white">Password</label>
                                            <input
                                                type="password"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-check mb-4">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="rememberMe"
                                                checked={loginData.rememberMe}
                                                onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                                            />
                                            <label className="form-check-label text-white" htmlFor="rememberMe">
                                                Remember me for 30 days
                                            </label>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-linear w-100 mb-3"
                                            disabled={loading}
                                        >
                                            {loading ? 'Logging in...' : 'Login'}
                                        </button>
                                    </form>
                                ) : (
                                    /* Register form */
                                    <form onSubmit={handleRegister}>
                                        <div className="mb-3">
                                            <label className="form-label text-white">Username</label>
                                            <input
                                                type="text"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={registerData.username}
                                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                                required
                                                minLength={3}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-white">Invite Code (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e.target.value)}
                                                placeholder="Enter invite code if any"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-white">Email</label>
                                            <input
                                                type="email"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={registerData.email}
                                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-white">Password</label>
                                            <input
                                                type="password"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={registerData.password}
                                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label text-white">Verification Code</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control bg-dark text-white border-secondary"
                                                    value={registerData.verificationCode}
                                                    onChange={(e) => setRegisterData({ ...registerData, verificationCode: e.target.value })}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn text-white btn-outline-primary"
                                                    onClick={sendVerificationCode}
                                                    disabled={loading || countdown > 0}
                                                >
                                                    {countdown > 0 ? `${countdown}s` : 'Send Code'}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-linear w-100 mb-3"
                                            disabled={loading}
                                        >
                                            {loading ? 'Registering...' : 'Register'}
                                        </button>
                                    </form>
                                )}

                                {/* Divider */}
                                <div className="d-flex align-items-center my-4">
                                    <hr className="flex-grow-1 text-secondary" />
                                    <span className="px-3 text-white">or</span>
                                    <hr className="flex-grow-1 text-secondary" />
                                </div>

                                {/* Google login */}
                                <button
                                    type="button"
                                    className="btn text-white btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleGoogleSignIn}
                                >
                                    <svg width="20" height="20" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    </svg>
                                    Sign in with Google
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
