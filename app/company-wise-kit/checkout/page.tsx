// app/company-wise-kit/checkout/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { appConstants } from "@/lib/appConstants"
import { Mail, Lock, User, Phone, CheckCircle2, Shield, ArrowLeft, Loader2, Check, Crown } from "lucide-react"
import { signIn, useSession } from "next-auth/react"

export function CheckoutContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const planId = searchParams.get('plan') || '3m'

    const { company_kit_plans } = appConstants()
    const plan = (company_kit_plans as any)[planId] || company_kit_plans['3m' as keyof typeof company_kit_plans]

    const { data: session } = useSession()

    // Form state
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [mobile, setMobile] = useState("")

    // Pre-fill if session exists
    useEffect(() => {
        if (session?.user) {
            if (session.user.email) setEmail(session.user.email)
            if (session.user.name) setName(session.user.name)
        }
    }, [session])

    // Flow state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Load Razorpay
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        return () => { document.body.removeChild(script) }
    }, [])

    const handleGoogleAuth = async () => {
        try {
            await signIn('google', { redirect: false })
            // Note: because the page doesn't fully reload immediately, 
            // the useEffect above handles populating the fields once session is active.
            // We use standard next-auth for this. 
        } catch (error) {
            console.error("Google pre-fill failed", error)
        }
    }

    const handlePayment = async () => {
        if (!name || !email) {
            setError("Please fill in your name and email")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email")
            return
        }

        if (mobile && mobile.length < 10) {
            setError("Please enter valid mobile number")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const orderRes = await fetch('/api/company-kit/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: email,
                    userName: name,
                    userMobile: mobile,
                    planId: plan.id,
                    amount: plan.price,
                }),
            })

            const orderData = await orderRes.json()

            if (!orderData.orderId) {
                throw new Error('Failed to create order')
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Geeky Frontend',
                description: `Company Wise Kit - ${plan.name}`,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    const verifyRes = await fetch('/api/company-kit/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userEmail: email,
                            planId: plan.id,
                            durationDays: plan.durationDays,
                        }),
                    })

                    const verifyData = await verifyRes.json()

                    if (verifyData.success) {
                        if (verifyData.sessionToken) {
                            localStorage.setItem('companyKitToken', verifyData.sessionToken)
                            window.dispatchEvent(new Event('storage'))
                        }
                        router.push('/dashboard')
                        router.refresh()
                    } else {
                        setError('Payment verification failed')
                    }
                },
                prefill: {
                    email: email,
                    name: name,
                    contact: mobile,
                },
                theme: {
                    color: '#7c3aed',
                },
            }

            const rzp = new (window as any).Razorpay(options)
            rzp.open()
        } catch (err) {
            setError('Payment failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const features = [
        "15+ top tech companies",
        "1700+ verified questions",
        "Timeline filters",
        "Progress tracking",
        "Weekly updates",
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/company-wise-kit')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to plans
                </button>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 h-fit">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                        <div className="bg-white/5 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm">{plan.duration} access</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">₹{plan.price}</p>
                                    <p className="text-slate-500 text-sm line-through">₹{plan.originalPrice}</p>
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-6">
                            {features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-green-400">₹{plan.price}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Checkout Form */}
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                        <h2 className="text-xl font-bold mb-6">Checkout</h2>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            className="w-full bg-white text-black hover:bg-slate-100 border-0 mb-6 font-medium h-12"
                            onClick={handleGoogleAuth}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Quick fill with Google
                        </Button>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#1f1938] px-2 text-slate-400">Or enter details</span>
                            </div>
                        </div>

                        {/* Step 1: Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Full Name <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                                />
                            </div>
                        </div>

                        {/* Step 2: Email */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address <span className="text-red-400">*</span>
                            </label>
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                                />
                            </div>
                        </div>

                        {/* Step 3: Mobile (Optional) */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Mobile Number <span className="text-slate-500 text-xs">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                                />
                            </div>
                        </div>

                        {/* Pay Button */}
                        <Button
                            onClick={handlePayment}
                            disabled={isLoading || !name || !email}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black rounded-xl"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Crown className="w-5 h-5 mr-2" />
                                    Pay ₹{plan.price}
                                </>
                            )}
                        </Button>

                        {/* Trust Badges */}
                        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>Secure Payment</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Instant Access</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    )
}
