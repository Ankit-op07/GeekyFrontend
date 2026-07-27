"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, ShieldCheck, Lock, CreditCard, Zap, Star, AlertTriangle, User, LogIn, Atom, FileText, Code, ChevronDown } from "lucide-react"
import { KIT_CATALOG, getKitById } from "@/lib/appConstants"
import { trackPurchase } from "@/lib/meta-pixel"
import { CouponField, type AppliedCouponView } from "@/components/checkout/coupon-field"
import { BonusList, type BonusItemView } from "@/components/checkout/bonus-list"
import { BetterDeal, type KitDealView } from "@/components/checkout/better-deal"

/**
 * Is the "have a coupon code?" box shown to buyers?
 *
 * OFF for now — a deliberate product decision, not a bug. Everything behind it
 * is live and tested: an admin can create codes at /admin/coupons, and any
 * coupon marked `autoApply` is still applied server-side, so a campaign price
 * shows up at checkout without anyone typing anything.
 *
 * What this flag withholds is only the manual entry box. Flip it to `true` to
 * start accepting shared/partner codes; nothing else needs to change.
 *
 * ⚠️  While this is false, do NOT advertise a code anyone has to type —
 * components/offer-banner.tsx only surfaces auto-applied offers for exactly
 * this reason.
 */
const COUPON_FIELD_ENABLED = false

interface SessionUser {
    id: string
    email: string
    name: string
    profilePicture?: string
}

/* ── Main checkout content ──────────────────────────────────────── */
function PayContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const kitId = searchParams.get("kit") || ""
    const kit = getKitById(kitId)

    /* ── Session state ────────────────────────────────────────── */
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
    const [sessionLoading, setSessionLoading] = useState(true)

    /* ── Form state ───────────────────────────────────────────── */
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [mobile, setMobile] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [emailConflict, setEmailConflict] = useState(false)

    /* ── Personalised price quote (upgrade credit + coupon applied) ────────
     * DISPLAY ONLY. The amount actually charged is recomputed server-side in
     * /api/payment/create-order and never trusts this. Without it the page
     * would show the full list price (e.g. ₹499) even for a user whose owned
     * kits credit the bundle down to ₹200. */
    const [quote, setQuote] = useState<{
        listPrice: number
        credit: number
        payableBeforeCoupon: number
        payable: number
        alreadyOwned: boolean
        coupon: AppliedCouponView | null
        totalSavings: number
    } | null>(null)

    /* The code the buyer typed, if any. It is passed to the server on every
     * quote AND on create-order — it is a code, never an amount. */
    const [couponCode, setCouponCode] = useState<string | null>(null)
    /** Mobile-only: the summary's inclusion list starts collapsed. See the render. */
    const [featuresOpen, setFeaturesOpen] = useState(false)
    const [bonuses, setBonuses] = useState<BonusItemView[]>([])
    const [bonusWorth, setBonusWorth] = useState(0)
    const [deals, setDeals] = useState<KitDealView[]>([])

    /* ── Check session on mount ───────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/auth/session")
                const data = await res.json()
                if (data.user) {
                    setSessionUser(data.user)
                }
            } catch { /* not logged in */ }
            finally { setSessionLoading(false) }
        })()
    }, [])

    /* ── Auto-fill email from localStorage for guests ────────── */
    useEffect(() => {
        if (!sessionUser) {
            const saved = localStorage.getItem("gf_checkout_email")
            if (saved) setEmail(saved)
        }
    }, [sessionUser])

    /* ── Fetch the personalised quote + offers ─────────────────────────────
     * One request for quote, bonuses and deals (see /api/payment/offers).
     *
     * Re-runs on identity change, because all three are personalised: credit
     * comes from the signed session, and coupon limits are checked against the
     * buyer email. For a guest that email is the one being typed, so it is
     * DEBOUNCED — this fires on a settled address, not on every keystroke, and
     * it is why a provisional discount settles into a confirmed one before the
     * buyer ever reaches the Pay button. */
    const guestEmail = sessionUser ? "" : email.trim()
    const [debouncedGuestEmail, setDebouncedGuestEmail] = useState("")

    useEffect(() => {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
        const t = setTimeout(() => setDebouncedGuestEmail(valid ? guestEmail : ""), 500)
        return () => clearTimeout(t)
    }, [guestEmail])

    const quoteEmail = sessionUser?.email ?? debouncedGuestEmail

    useEffect(() => {
        if (!kitId) return
        let active = true

        const params = new URLSearchParams({ kit: kitId })
        if (couponCode) params.set("coupon", couponCode)
        if (quoteEmail) params.set("email", quoteEmail)

        fetch(`/api/payment/offers?${params.toString()}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!active || !data?.quote || typeof data.quote.payable !== "number") return
                setQuote(data.quote)
                setBonuses(data.bonuses ?? [])
                setBonusWorth(data.bonusWorth ?? 0)
                setDeals(data.deals ?? [])
            })
            .catch(() => { /* fall back to list price */ })

        return () => { active = false }
    }, [kitId, quoteEmail, couponCode])

    /* ── Apply / remove a coupon ───────────────────────────────────────────
     * Validation is entirely server-side. On success we store the CODE and let
     * the effect above re-quote, so the price on screen always comes from one
     * place instead of being patched locally. */
    const handleCoupon = async (code: string | null): Promise<{ ok: boolean; message?: string }> => {
        if (!code) {
            setCouponCode(null)
            return { ok: true }
        }
        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kitId, code, email: quoteEmail || undefined }),
            })
            const data = await res.json()
            if (data.quote) {
                // Render the server's quote either way: a refused code can still
                // leave an auto-apply offer standing, and the total must match it.
                setQuote(data.quote)
            }
            if (!data.ok) return { ok: false, message: data.message }
            setCouponCode(code)
            return { ok: true }
        } catch {
            return { ok: false, message: "Could not check that code. Please try again." }
        }
    }

    /* ── Load Razorpay SDK ────────────────────────────────────── */
    useEffect(() => {
        const s = document.createElement("script")
        s.src = "https://checkout.razorpay.com/v1/checkout.js"
        s.async = true
        document.body.appendChild(s)
        return () => { document.body.removeChild(s) }
    }, [])

    /* ── If kit not found, show error ─────────────────────────── */
    if (!kit) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Kit not found</h1>
                <p className="text-gray-500 mb-6">The kit you are looking for does not exist or the link is invalid.</p>
                <Link href="/" className="text-violet-600 hover:underline font-medium">← Back to homepage</Link>
            </div>
        )
    }

    /* ── Effective, personalised pricing (falls back to list price) ── */
    const listPrice = quote?.listPrice ?? kit.price
    const credit = quote?.credit ?? 0
    const payable = quote?.payable ?? kit.price
    const alreadyOwned = quote?.alreadyOwned ?? false
    const appliedCoupon = quote?.coupon ?? null
    const totalSaved = quote?.totalSavings ?? Math.max(kit.originalPrice - payable, 0)
    const discount = Math.round(((kit.originalPrice - listPrice) / kit.originalPrice) * 100)

    /* ── Resolve user details (from session or form) ──────────── */
    const resolvedEmail = sessionUser?.email || email
    const resolvedName = sessionUser?.name || name

    /* ── Payment handler ──────────────────────────────────────── */
    const handlePayment = async () => {
        // Guest validation
        if (!sessionUser) {
            if (!name.trim() || !email.trim()) { setError("Name and email are required"); return }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email"); return }
            if (mobile && mobile.length < 10) { setError("Enter a valid 10‑digit mobile number"); return }

            // Check if email already exists
            try {
                const checkRes = await fetch("/api/auth/check-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email.trim() }),
                })
                const checkData = await checkRes.json()
                if (checkData.exists) {
                    setEmailConflict(true)
                    setError("")
                    return
                }
            } catch {
                // If check fails, proceed anyway — verify API will handle it
            }

            // Save email for future auto-fill
            localStorage.setItem("gf_checkout_email", email.trim())
        }

        setIsLoading(true)
        setError("")
        setEmailConflict(false)

        try {
            const orderRes = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kitId,
                    userEmail: resolvedEmail,
                    userName: resolvedName,
                    userMobile: mobile,
                    // A code, not an amount — the server re-derives the discount.
                    couponCode,
                }),
            })
            const orderData = await orderRes.json()
            if (!orderData.orderId) throw new Error(orderData.error || "Order creation failed")

            /* The server had the last word on the coupon. If it refused the code
             * (ran out while they sat on the page, expired mid-session), stop
             * here: clearing the code re-quotes the page at the real price, and
             * they can pay with one more click. Opening Razorpay for an amount
             * higher than the one on screen would be the worst possible moment
             * to surprise someone. */
            if (orderData.couponError) {
                setCouponCode(null)
                setError(orderData.couponError.message)
                return
            }

            const rzp = new (window as any).Razorpay({
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Geeky Frontend",
                description: kit.name,
                order_id: orderData.orderId,
                handler: async (res: any) => {
                    const vRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_signature: res.razorpay_signature,
                            userEmail: resolvedEmail,
                            userName: resolvedName,
                            planName: kit.name,
                        }),
                    })
                    const vData = await vRes.json()
                    if (vData.success) {
                        // ✅ AWAIT trackPurchase — must complete before navigation
                        const nameParts = resolvedName?.split(' ') || [];
                        await trackPurchase({
                            email: resolvedEmail,
                            phone: mobile ? `91${mobile}` : undefined,
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(' ') || undefined,
                            value: orderData.payable ?? payable,
                            currency: orderData.currency || 'INR',
                            contentName: kit.name,
                            contentIds: [kitId],
                        });

                        router.push("/dashboard")
                        router.refresh()
                    } else {
                        setError("Payment verification failed. Contact support.")
                    }
                },
                prefill: {
                    email: resolvedEmail,
                    name: resolvedName,
                    contact: mobile,
                },
                theme: { color: "#7c3aed" },
            })
            rzp.open()
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    /* ── Loading state ────────────────────────────────────────── */
    if (sessionLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    /* ── UI ────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-gray-900">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-extrabold shadow-md">
                            G
                        </div>
                        Geeky Frontend
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        Secure Checkout
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                {/* ⚠️  `min-w-0` on BOTH columns is load-bearing, not cosmetic.
                    A grid item defaults to `min-width: auto`, i.e. it refuses to
                    shrink below its own min-content. Any `truncate` inside sets
                    `white-space: nowrap`, whose min-content is the FULL text
                    width — so one long untruncatable kit name in the deal card
                    sized this single-column mobile track to 666px and pushed the
                    entire page into horizontal scroll. min-w-0 removes that
                    automatic floor, which is also what finally lets `truncate`
                    do its job. */}
                <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

                    {/* ─── LEFT: Form or Logged-In Card ─────────────── */}
                    <div className="order-2 lg:order-1 min-w-0">

                        {/* ── Logged-in user: streamlined card ─────── */}
                        {sessionUser ? (
                            <div>
                                <h1 className="text-2xl font-bold mb-1.5 tracking-tight">Complete your purchase</h1>
                                <p className="text-gray-500 text-sm mb-8">You&apos;re signed in. Click below to pay instantly.</p>

                                {/* User info card */}
                                <div className="border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-4 bg-gray-50/50">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                        {sessionUser.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{sessionUser.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{sessionUser.email}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Signed in
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                                        <span className="shrink-0 mt-0.5">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── Guest: show form ─────────────────────── */
                            <div>
                                <h1 className="text-2xl font-bold mb-1.5 tracking-tight">Complete your purchase</h1>
                                <p className="text-gray-500 text-sm mb-8">Fill in your details below. Your account will be created automatically.</p>

                                {error && (
                                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                                        <span className="shrink-0 mt-0.5">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Email conflict alert */}
                                {emailConflict && (
                                    <div className="mb-6 px-4 py-4 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-900 mb-1">
                                                    Welcome back! This email already has an account.
                                                </p>
                                                <p className="text-xs text-amber-700 mb-3">
                                                    Please log in to continue your purchase. Your kit will be added to your existing account.
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        href={`/login?redirect=${encodeURIComponent(`/pay?kit=${kitId}`)}`}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                                                    >
                                                        <LogIn className="w-3.5 h-3.5" />
                                                        Log in to continue
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Form */}
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="pay-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pay-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full h-12 border border-gray-200 rounded-xl px-4 text-[15px] bg-white transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="pay-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pay-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setEmailConflict(false) }}
                                            placeholder="Enter your email"
                                            className="w-full h-12 border border-gray-200 rounded-xl px-4 text-[15px] bg-white transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="pay-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Phone
                                            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                        </label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3.5 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 text-sm font-medium select-none">
                                                IN (+91)
                                            </span>
                                            <input
                                                id="pay-phone"
                                                type="tel"
                                                value={mobile}
                                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                                                maxLength={10}
                                                placeholder="Enter phone number"
                                                className="flex-1 h-12 border border-gray-200 rounded-r-xl px-4 text-[15px] bg-white transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Coupon — a control over the server's quote, not a price source.
                            Gated OFF for buyers for now (see COUPON_FIELD_ENABLED).
                            Auto-applied offers still work without it: the server
                            picks the best live offer on its own, so a campaign can
                            run before the code box is ever shown. */}
                        {COUPON_FIELD_ENABLED && (
                            <div className="mt-8">
                                <CouponField
                                    applied={appliedCoupon}
                                    email={resolvedEmail}
                                    onApply={handleCoupon}
                                />
                            </div>
                        )}

                        {/* Payment section (shared) */}
                        <div className="mt-8 mb-4">
                            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                Payment
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">All transactions are secure and encrypted.</p>
                        </div>

                        {/* Razorpay indicator */}
                        <div className="border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-violet-600 flex items-center justify-center shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                            </div>
                            <span className="font-semibold text-sm text-gray-700">Razorpay</span>
                            <span className="ml-auto text-xs text-gray-400 font-medium">UPI · Cards · Netbanking</span>
                        </div>

                        {/* Already owns this kit — block the sale (matches create-order's 409) */}
                        {alreadyOwned && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                                <span>You already own this — no need to buy it again. <Link href="/dashboard" className="font-semibold underline">Go to your dashboard</Link>.</span>
                            </div>
                        )}

                        {/* Pay button */}
                        <button
                            onClick={handlePayment}
                            disabled={isLoading || emailConflict || alreadyOwned}
                            className="w-full h-14 rounded-xl font-bold text-[16px] text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-violet-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                            ) : (
                                <>Pay ₹{payable.toLocaleString("en-IN")}</>
                            )}
                        </button>

                        {/* Info banner */}
                        {sessionUser ? (
                            <div className="mt-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200/60 text-center">
                                <p className="text-[13px] text-green-800 leading-relaxed">
                                    <span className="font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                        Signed in as {sessionUser.email}
                                    </span>{" "}
                                    — the kit will be added to your account instantly.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/60 text-center">
                                <p className="text-[13px] text-amber-800 leading-relaxed">
                                    <span className="font-semibold">New here?</span>{" "}
                                    Your account will be created automatically. A &quot;Set Password&quot; link will be emailed to you.
                                </p>
                            </div>
                        )}

                        {/* Already have an account? (guest only) */}
                        {!sessionUser && (
                            <div className="mt-4 text-center">
                                <Link
                                    href={`/login?redirect=${encodeURIComponent(`/pay?kit=${kitId}`)}`}
                                    className="text-sm text-violet-600 hover:text-violet-700 font-medium hover:underline inline-flex items-center gap-1"
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    Already have an account? Log in
                                </Link>
                            </div>
                        )}

                        {/* Trust badges — wrap rather than squeeze on a 360px screen */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> 256-bit SSL</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Safe & Secure</span>
                            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500" /> Instant Access</span>
                        </div>

                        {/* Free bonuses — reassurance, so it sits after the Pay
                            button in the mobile reading order. */}
                        <div className="mt-6">
                            <BonusList bonuses={bonuses} worth={bonusWorth} />
                        </div>
                    </div>

                    {/* ─── RIGHT: Order Summary ───────────────────────── */}
                    <div className="order-1 lg:order-2 lg:sticky lg:top-24 min-w-0">
                        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            {/* Product card */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex gap-4 items-start">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md ${kitId === 'react-kit'
                                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-blue-500/20'
                                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/20'
                                        }`}>
                                        {kitId === 'react-kit'
                                            ? <Atom className="w-7 h-7 text-white" />
                                            : <Star className="w-7 h-7 text-white" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-[15px] leading-snug text-gray-900">{kit.name}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">{kit.duration} access</p>
                                            </div>
                                            {kit.badge && (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${kit.badge === 'BESTSELLER'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-violet-100 text-violet-700'
                                                    }`}>
                                                    {kit.badge === 'BESTSELLER' ? '⭐ ' : ''}{kit.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                            {kit.tagline}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Features checklist.
                                COLLAPSED BY DEFAULT ON MOBILE. The summary card
                                renders above the form on a phone (it is order-1),
                                so listing all 10 features here pushed the email
                                field and the Pay button a full screen down — the
                                buyer had to scroll past the sales pitch to reach
                                the thing they already decided to do. Desktop has
                                a side column and no such problem, so it always
                                shows the full list. */}
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="space-y-2.5">
                                    {kit.features.map((f, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-2.5 text-sm text-gray-600 ${i >= 3 && !featuresOpen ? "hidden lg:flex" : ""
                                                }`}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {kit.features.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() => setFeaturesOpen(!featuresOpen)}
                                        aria-expanded={featuresOpen}
                                        className="lg:hidden mt-3 h-9 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
                                    >
                                        {featuresOpen
                                            ? "Show less"
                                            : `Show all ${kit.features.length} inclusions`}
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform ${featuresOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Price breakdown */}
                            <div className="px-6 py-5 space-y-3">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Price</span>
                                    <span className="line-through text-gray-400">₹{kit.originalPrice.toLocaleString("en-IN")}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-medium">Discount ({discount}% off)</span>
                                        <span className="text-green-600 font-medium">
                                            -₹{(kit.originalPrice - listPrice).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                )}
                                {credit > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-medium">Credit for kits you own</span>
                                        <span className="text-green-600 font-medium">
                                            -₹{credit.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                )}
                                {appliedCoupon && appliedCoupon.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-medium truncate pr-2">
                                            {appliedCoupon.auto ? "Offer applied" : `Coupon ${appliedCoupon.code}`}
                                        </span>
                                        <span className="text-green-600 font-medium shrink-0">
                                            -₹{appliedCoupon.discount.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                                    <span className="text-base font-bold text-gray-900">Total</span>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 mr-1.5">INR</span>
                                        <span className="text-2xl font-extrabold text-gray-900">₹{payable.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                                {totalSaved > 0 && (
                                    <div className="rounded-lg bg-green-50 border border-green-200/70 px-3 py-2 text-center">
                                        <span className="text-[13px] font-semibold text-green-800">
                                            You save ₹{totalSaved.toLocaleString("en-IN")} today
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* A genuinely better deal, if one exists for this buyer.
                            Stays in this column on purpose: on mobile this column
                            renders BEFORE the form, and an upgrade offer is only
                            useful while the buyer is still deciding. Shown after
                            the Pay button it would just be a regret.
                            (The bonuses moved to the other column — they are
                            reassurance, which reads fine after the button.) */}
                        {!alreadyOwned && deals.length > 0 && (
                            <div className="mt-4">
                                <BetterDeal deals={deals} />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 mt-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                    <p>Copyright Geeky Frontend © {new Date().getFullYear()}. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
                        <Link href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

/* ── Page wrapper with Suspense ─────────────────────────────────── */
export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }
        >
            <PayContent />
        </Suspense>
    )
}