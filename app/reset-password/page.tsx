"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { AuthCard, getPasswordStrength } from "@/components/auth-card"

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const strength = getPasswordStrength(password)

    useEffect(() => {
        if (!token) setError("Invalid or missing reset token")
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!token) { setError("Invalid or missing reset token"); return }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return }
        if (password !== confirmPassword) { setError("Passwords do not match"); return }

        setLoading(true)
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || "Failed to reset password"); return }
            setSuccess(true)
        } catch {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard>
            {success ? (
                /* ─── Success state ─── */
                <div style={{ textAlign: 'center' }}>
                    <div className="auth-success-icon">
                        <CheckCircle2 style={{ width: 28, height: 28, color: '#22c55e' }} />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>Password updated</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto 28px' }}>
                        Your password has been reset successfully. You can now sign in.
                    </p>
                    <button
                        className="auth-btn-primary"
                        onClick={() => router.push('/login')}
                        style={{ display: 'inline-flex' }}
                    >
                        Proceed to sign in <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            ) : (
                /* ─── Form state ─── */
                <>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                            Set new password
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
                            Choose a strong password to secure your account
                        </p>
                    </div>

                    {error && (
                        <div className="auth-alert auth-alert-error" style={{ marginBottom: '16px' }}>
                            <AlertCircle className="auth-alert-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="auth-label">New password</label>
                            <div className="auth-input-wrapper">
                                <Lock className="auth-input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="auth-input has-icon has-toggle"
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={!token}
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

                        <div style={{ marginBottom: '20px' }}>
                            <label className="auth-label">Confirm password</label>
                            <div className="auth-input-wrapper">
                                <Lock className="auth-input-icon" />
                                <input
                                    type="password"
                                    className="auth-input has-icon"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    disabled={!token}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-btn-primary" disabled={loading || !token}>
                            {loading ? <><div className="auth-spinner" /> Updating…</> : "Save new password"}
                        </button>
                    </form>
                </>
            )}
        </AuthCard>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#07060b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="auth-spinner" style={{ width: 24, height: 24, borderColor: 'rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6' }} />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
