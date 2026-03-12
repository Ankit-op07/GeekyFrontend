"use client"

import Link from "next/link"
import Image from "next/image"

/**
 * Shared auth‑page wrapper used by Login, Register, Forgot Password, Reset Password.
 * Provides the background, centered glass card, logo, and entrance animation.
 */
export function AuthCard({ children, maxWidth = "max-w-[420px]" }: { children: React.ReactNode; maxWidth?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden auth-page-bg">
            {/* Animated background */}
            <div className="auth-bg-gradient" />
            <div className="auth-bg-orb auth-bg-orb-1" />
            <div className="auth-bg-orb auth-bg-orb-2" />
            <div className="auth-bg-noise" />

            <div className={`w-full ${maxWidth} relative z-10 auth-card-entrance`}>
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="auth-logo-link">
                        <Image src="/inter.png" alt="Geeky Frontend" width={130} height={44} priority className="opacity-90 hover:opacity-100 transition-opacity" />
                    </Link>
                </div>

                {/* Glass card */}
                <div className="auth-glass-card">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-[11px] text-white/25 mt-6 tracking-wide">
                    © {new Date().getFullYear()} Geeky Frontend · <Link href="/terms" className="hover:text-white/40 transition-colors">Terms</Link> · <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy</Link>
                </p>
            </div>

            <style jsx global>{`
                /* ─── Auth Page Styles ─── */
                .auth-page-bg {
                    background: #07060b;
                }
                .auth-bg-gradient {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 60%),
                                radial-gradient(ellipse 60% 50% at 80% 110%, rgba(99,102,241,0.08) 0%, transparent 50%);
                    pointer-events: none;
                }
                .auth-bg-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                    opacity: 0.5;
                }
                .auth-bg-orb-1 {
                    width: 400px; height: 400px;
                    top: 10%; left: 20%;
                    background: rgba(124,58,237,0.06);
                    animation: auth-float 20s ease-in-out infinite;
                }
                .auth-bg-orb-2 {
                    width: 350px; height: 350px;
                    bottom: 10%; right: 15%;
                    background: rgba(99,102,241,0.05);
                    animation: auth-float 25s ease-in-out infinite reverse;
                }
                .auth-bg-noise {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
                    pointer-events: none;
                    opacity: 0.4;
                }
                .auth-glass-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                    padding: 40px 36px;
                    backdrop-filter: blur(40px);
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.02),
                                0 20px 60px -12px rgba(0,0,0,0.5),
                                0 0 120px -40px rgba(124,58,237,0.08);
                }
                @media (max-width: 480px) {
                    .auth-glass-card {
                        padding: 32px 24px;
                        border-radius: 16px;
                    }
                }
                .auth-card-entrance {
                    animation: authFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
                }
                @keyframes authFadeInUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes auth-float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -20px); }
                }

                /* ─── Input Styles ─── */
                .auth-input-wrapper {
                    position: relative;
                }
                .auth-input {
                    width: 100%;
                    height: 48px;
                    padding: 0 16px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s ease;
                    caret-color: #a78bfa;
                }
                .auth-input::placeholder { color: rgba(255,255,255,0.2); }
                .auth-input:focus {
                    border-color: rgba(139,92,246,0.5);
                    box-shadow: 0 0 0 3px rgba(139,92,246,0.1), 0 0 20px -4px rgba(139,92,246,0.15);
                    background: rgba(255,255,255,0.06);
                }
                .auth-input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.2);
                    width: 16px;
                    height: 16px;
                    transition: color 0.2s;
                    pointer-events: none;
                }
                .auth-input-wrapper:focus-within .auth-input-icon {
                    color: rgba(139,92,246,0.6);
                }
                .auth-input.has-icon { padding-left: 40px; }
                .auth-input.has-toggle { padding-right: 44px; }
                .auth-toggle-btn {
                    position: absolute;
                    right: 4px;
                    top: 50%;
                    transform: translateY(-50%);
                    padding: 8px;
                    color: rgba(255,255,255,0.25);
                    background: none;
                    border: none;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: color 0.15s;
                }
                .auth-toggle-btn:hover { color: rgba(255,255,255,0.5); }
                .auth-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 6px;
                    letter-spacing: 0.01em;
                }

                /* ─── Buttons ─── */
                .auth-btn-primary {
                    width: 100%;
                    height: 48px;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    color: #fff;
                    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
                    transition: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 0.01em;
                }
                .auth-btn-primary::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .auth-btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px -6px rgba(124,58,237,0.35), 0 0 0 1px rgba(124,58,237,0.15);
                }
                .auth-btn-primary:hover:not(:disabled)::before { opacity: 1; }
                .auth-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.99); }
                .auth-btn-primary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .auth-btn-google {
                    width: 100%;
                    height: 48px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    color: rgba(255,255,255,0.85);
                    background: rgba(255,255,255,0.04);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    letter-spacing: 0.01em;
                }
                .auth-btn-google:hover:not(:disabled) {
                    background: rgba(255,255,255,0.07);
                    border-color: rgba(255,255,255,0.15);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px -4px rgba(0,0,0,0.25);
                }
                .auth-btn-google:active:not(:disabled) { transform: translateY(0) scale(0.99); }
                .auth-btn-google:disabled { opacity: 0.4; cursor: not-allowed; }

                /* ─── Divider ─── */
                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin: 24px 0;
                }
                .auth-divider::before, .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                }
                .auth-divider span {
                    font-size: 11px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.2);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                /* ─── Error / Success alerts ─── */
                .auth-alert {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 12px 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    line-height: 1.5;
                    animation: authFadeInUp 0.25s ease both;
                }
                .auth-alert-error {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.15);
                    color: #fca5a5;
                }
                .auth-alert-success {
                    background: rgba(34,197,94,0.08);
                    border: 1px solid rgba(34,197,94,0.15);
                    color: #86efac;
                }
                .auth-alert-icon {
                    flex-shrink: 0;
                    width: 16px;
                    height: 16px;
                    margin-top: 1px;
                }

                /* ─── Password Strength Bar ─── */
                .auth-strength-bar {
                    height: 3px;
                    border-radius: 3px;
                    background: rgba(255,255,255,0.06);
                    overflow: hidden;
                    margin-top: 8px;
                }
                .auth-strength-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.3s ease, background 0.3s ease;
                }

                /* ─── Link styles ─── */
                .auth-link {
                    color: rgba(139,92,246,0.8);
                    font-size: 13px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: color 0.15s;
                }
                .auth-link:hover { color: #a78bfa; }

                /* ─── Spinner ─── */
                .auth-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: authSpin 0.6s linear infinite;
                }
                @keyframes authSpin {
                    to { transform: rotate(360deg); }
                }

                /* ─── Success checkmark ─── */
                .auth-success-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(34,197,94,0.1);
                    border: 2px solid rgba(34,197,94,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    animation: authSuccessPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                @keyframes authSuccessPop {
                    from { opacity: 0; transform: scale(0.6); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}

/** Google G logo SVG */
export function GoogleLogo({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

/** Password strength calculator */
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: "", color: "transparent" }
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    if (score <= 1) return { score: 20, label: "Weak", color: "#ef4444" }
    if (score <= 2) return { score: 40, label: "Fair", color: "#f97316" }
    if (score <= 3) return { score: 60, label: "Good", color: "#eab308" }
    if (score <= 4) return { score: 80, label: "Strong", color: "#22c55e" }
    return { score: 100, label: "Excellent", color: "#10b981" }
}
