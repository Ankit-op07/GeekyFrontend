"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
import { AuthCard } from "@/components/auth-card"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!email) { setError("Please enter your email address"); return }

        setLoading(true)
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || "Failed to send reset link"); return }
            setSent(true)
        } catch {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard>
            {sent ? (
                /* ─── Success state ─── */
                <div style={{ textAlign: 'center' }}>
                    <div className="auth-success-icon">
                        <CheckCircle2 style={{ width: 28, height: 28, color: '#22c55e' }} />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>Check your email</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto 28px' }}>
                        If an account exists for that email, we&apos;ve sent password reset instructions.
                    </p>
                    <Link href="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to sign in
                    </Link>
                </div>
            ) : (
                /* ─── Form state ─── */
                <>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                            Reset password
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
                            Enter your email and we&apos;ll send a reset link
                        </p>
                    </div>

                    {error && (
                        <div className="auth-alert auth-alert-error" style={{ marginBottom: '16px' }}>
                            <AlertCircle className="auth-alert-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
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

                        <button type="submit" className="auth-btn-primary" disabled={loading || !email}>
                            {loading ? <><div className="auth-spinner" /> Sending…</> : "Send reset link"}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Link href="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowLeft style={{ width: 14, height: 14 }} /> Back to sign in
                        </Link>
                    </p>
                </>
            )}
        </AuthCard>
    )
}
