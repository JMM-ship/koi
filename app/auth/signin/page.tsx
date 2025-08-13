'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'

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

    // 登录表单
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    })

    // 注册表单
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        verificationCode: ''
    })

    // 发送验证码
    const sendVerificationCode = async () => {
        if (!registerData.email) {
            setError('请输入邮箱地址')
            showError('请输入邮箱地址')
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
                setError(data.error || '发送验证码失败')
                showError(data.error || '发送验证码失败')
                if (data.remainingSeconds) {
                    setCountdown(data.remainingSeconds)
                    startCountdown(data.remainingSeconds)
                }
            } else {
                setVerificationSent(true)
                setCountdown(60)
                startCountdown(60)
                showSuccess('验证码已发送到您的邮箱')
            }
        } catch (err) {
            setError('发送验证码时发生错误')
            showError('发送验证码时发生错误')
        } finally {
            setLoading(false)
        }
    }

    // 倒计时
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

    // 处理登录
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email: loginData.email,
                password: loginData.password,
                redirect: false
            })

            if (result?.error) {
                setError('邮箱或密码错误')
                showError('邮箱或密码错误')
            } else if (result?.ok) {
                showSuccess('登录成功！')
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (err) {
            setError('登录时发生错误')
            showError('登录时发生错误')
        } finally {
            setLoading(false)
        }
    }

    // 处理注册
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || '注册失败')
                showError(data.error || '注册失败')
            } else {
                showSuccess('注册成功！正在自动登录...')
                // 注册成功后自动登录
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
            setError('注册时发生错误')
            showError('注册时发生错误')
        } finally {
            setLoading(false)
        }
    }

    // Google登录
    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl })
    }

    return (
        <section className="ai-solutions-home-section-1 position-relative overflow-hidden min-vh-100 d-flex align-items-center">
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

                                {/* Tab切换 */}
                                <ul className="nav nav-pills nav-fill mb-4">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link text-white ${isLogin ? 'active bg-gradient' : ''}`}
                                            onClick={() => { setIsLogin(true); setError('') }}
                                        >
                                            登录
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link text-white ${!isLogin ? 'active bg-gradient' : ''}`}
                                            onClick={() => { setIsLogin(false); setError('') }}
                                        >
                                            注册
                                        </button>
                                    </li>
                                </ul>

                                {/* 错误提示 */}
                                {error && (
                                    <div className="alert alert-danger py-2" role="alert">
                                        {error}
                                    </div>
                                )}

                                {/* 登录表单 */}
                                {isLogin ? (
                                    <form onSubmit={handleLogin}>
                                        <div className="mb-3">
                                            <label className="form-label text-white">邮箱</label>
                                            <input
                                                type="email"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label text-white">密码</label>
                                            <input
                                                type="password"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-linear w-100 mb-3"
                                            disabled={loading}
                                        >
                                            {loading ? '登录中...' : '登录'}
                                        </button>
                                    </form>
                                ) : (
                                    /* 注册表单 */
                                    <form onSubmit={handleRegister}>
                                        <div className="mb-3">
                                            <label className="form-label text-white">用户名</label>
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
                                            <label className="form-label text-white">邮箱</label>
                                            <input
                                                type="email"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={registerData.email}
                                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-white">密码</label>
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
                                            <label className="form-label text-white">验证码</label>
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
                                                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-linear w-100 mb-3"
                                            disabled={loading}
                                        >
                                            {loading ? '注册中...' : '注册'}
                                        </button>
                                    </form>
                                )}

                                {/* 分隔线 */}
                                <div className="d-flex align-items-center my-4">
                                    <hr className="flex-grow-1 text-secondary" />
                                    <span className="px-3 text-white">或</span>
                                    <hr className="flex-grow-1 text-secondary" />
                                </div>

                                {/* Google登录 */}
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
                                    使用 Google 登录
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}