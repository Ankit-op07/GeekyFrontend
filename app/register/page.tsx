"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { AuthCard, GoogleLogo, getPasswordStrength } from "@/components/auth-card"

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void
                    prompt: () => void
                }
            }
        }
    }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect") || "/dashboard"

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const strength = getPasswordStrength(password)

    // Check if already logged in
    useEffect(() => {
        fetch("/api/auth/session").then(r => r.json()).then(d => {
            if (d.user) router.replace(redirect)
        })
    }, [redirect, router])

    // Load Google Identity Services
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return
        if (window.google?.accounts?.id) {
            initGoogle()
            return
        }
        const s = document.createElement("script")
        s.src = "https://accounts.google.com/gsi/client"
        s.async = true
        s.defer = true
        s.onload = initGoogle
        document.head.appendChild(s)
    }, [])

    function initGoogle() {
        window.google?.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
        })
    }

    const handleGoogleClick = () => {
        if (!window.google?.accounts?.id) return
        setGoogleLoading(true)
        setError("")
        window.google.accounts.id.prompt()
        setTimeout(() => setGoogleLoading(false), 5000)
    }

    const handleGoogleCallback = async (response: any) => {
        setGoogleLoading(true)
        setError("")
        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Google sign-in failed")
            setSuccess(true)
            setTimeout(() => router.push(redirect), 600)
        } catch (e: any) {
            setError(e.message)
            setGoogleLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const res = await fetch("/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name, mode: "register" })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Registration failed")
            setSuccess(true)
            setTimeout(() => router.push(redirect), 600)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard>
            {/* Heading */}
            <div className="text-center mb-8">
                <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                    Create your account
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
                    Start your interview preparation journey
                </p>
            </div>

            {/* Success overlay */}
            {success && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div className="auth-success-icon">
                        <CheckCircle2 style={{ width: 28, height: 28, color: '#22c55e' }} />
                    </div>
                    <p style={{ color: '#86efac', fontSize: '14px', fontWeight: 500 }}>Account created! Redirecting…</p>
                </div>
            )}

            {!success && (
                <>
                    {/* Google Sign-In */}
                    {GOOGLE_CLIENT_ID && (
                        <>
                            <button
                                type="button"
                                className="auth-btn-google"
                                onClick={handleGoogleClick}
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <div className="auth-spinner" />
                                ) : (
                                    <GoogleLogo />
                                )}
                                Continue with Google
                            </button>
                            <div className="auth-divider"><span>or</span></div>
                        </>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="auth-alert auth-alert-error" style={{ marginBottom: '16px' }}>
                            <AlertCircle className="auth-alert-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="auth-label">Full name</label>
                            <div className="auth-input-wrapper">
                                <User className="auth-input-icon" />
                                <input
                                    type="text"
                                    className="auth-input has-icon"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label className="auth-label">Email</label>
                            <div className="auth-input-wrapper">
                                <Mail className="auth-input-icon" />
                                <input
                                    type="email"
                                    className="auth-input has-icon"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                            <label className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
                                <Lock className="auth-input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="auth-input has-icon has-toggle"
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                                </button>
                            </div>
                            {/* Password strength bar */}
                            {password && (
                                <div>
                                    <div className="auth-strength-bar">
                                        <div
                                            className="auth-strength-fill"
                                            style={{ width: `${strength.score}%`, background: strength.color }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '11px', color: strength.color, marginTop: '4px', textAlign: 'right', fontWeight: 500 }}>
                                        {strength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-btn-primary"
                            disabled={loading || !email || !password}
                            style={{ marginTop: '16px' }}
                        >
                            {loading ? <><div className="auth-spinner" /> Creating account…</> : "Create account"}
                        </button>
                    </form>

                    {/* Login link */}
                    <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                        Already have an account?{" "}
                        <Link href="/login" className="auth-link">Sign in</Link>
                    </p>
                </>
            )}
        </AuthCard>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#07060b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="auth-spinner" style={{ width: 24, height: 24, borderColor: 'rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6' }} />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
