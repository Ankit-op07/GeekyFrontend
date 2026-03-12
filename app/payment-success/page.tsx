"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { CheckCircle2, Mail, ArrowRight, Shield, Loader2, Sparkles, Lock } from "lucide-react"

function SuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const kitName = searchParams.get("kit") || "Your Interview Kit"
    const mustChange = searchParams.get("cp") === "1" // change password flag

    const [countdown, setCountdown] = useState(10)

    // Auto-redirect to dashboard after 10s
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timer)
                    router.push("/dashboard")
                    return 0
                }
                return c - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Success Icon */}
                <div className="relative inline-flex mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/25 animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                    Payment Successful!
                </h1>
                <p className="text-gray-500 text-lg mb-8">
                    You now have access to <span className="font-semibold text-violet-600">{kitName}</span>
                </p>

                {/* Info Cards */}
                <div className="space-y-3 mb-8 text-left">
                    {/* Account created */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3.5 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Account Created</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Your account has been automatically created. You're already logged in!
                            </p>
                        </div>
                    </div>

                    {/* Email sent */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3.5 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Check Your Email</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                We've sent your login credentials and a link to change your password.
                            </p>
                        </div>
                    </div>

                    {/* Password change notice */}
                    {mustChange && (
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-amber-900">Change Your Password</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    You're using a temporary password. Please change it for security.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2.5 w-full h-14 rounded-xl font-bold text-[16px] text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-violet-500/20"
                >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="text-xs text-gray-400 mt-4">
                    Redirecting to dashboard in <span className="font-semibold text-gray-500">{countdown}s</span>...
                </p>

                {mustChange && (
                    <Link
                        href="/forgot-password"
                        className="inline-flex items-center justify-center gap-1.5 mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        Change Password Now
                    </Link>
                )}
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    )
}
