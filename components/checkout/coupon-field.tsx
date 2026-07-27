"use client"

/**
 * ─── Coupon field ──────────────────────────────────────────────────────────
 *
 *  The "have a code?" box on checkout.
 *
 *  It is a CONTROL, not a source of truth. It sends a code string to the server
 *  and renders whatever comes back; it never computes a discount, and the page
 *  never charges what this component says. /api/payment/create-order re-derives
 *  the price from the DB at payment time.
 *
 *  Two states worth understanding:
 *    • an AUTO offer is already applied — the buyer typed nothing. We say so
 *      plainly rather than hiding it, because a discount with no explanation
 *      reads as a pricing bug.
 *    • a typed code is REFUSED — we show why, and the auto offer (if any) stays
 *      applied. A typo must never raise someone's bill.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState } from "react"
import { Loader2, Tag, X, Check, Zap } from "lucide-react"

export interface AppliedCouponView {
    code: string
    description: string
    discount: number
    auto: boolean
    provisional: boolean
}

interface CouponFieldProps {
    /** The applied coupon, owned by the parent (it also owns the quote). */
    applied: AppliedCouponView | null
    /** Buyer email — required for per-buyer limits; may be empty for a guest. */
    email: string
    /** Called with a code to apply, or null to clear. Parent re-fetches the quote. */
    onApply: (code: string | null) => Promise<{ ok: boolean; message?: string }>
}

export function CouponField({ applied, email, onApply }: CouponFieldProps) {
    const [open, setOpen] = useState(false)
    const [code, setCode] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submit = async () => {
        const trimmed = code.trim()
        if (!trimmed || busy) return
        setBusy(true)
        setError(null)
        const result = await onApply(trimmed)
        if (result.ok) setCode("")
        else setError(result.message ?? "This code is not valid.")
        setBusy(false)
    }

    const clear = async () => {
        setBusy(true)
        setError(null)
        await onApply(null)
        setCode("")
        setBusy(false)
    }

    /* ── Applied ─────────────────────────────────────────────────────────── */
    if (applied) {
        return (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5 flex-wrap">
                            {applied.auto ? (
                                <>
                                    <Zap className="w-3.5 h-3.5" />
                                    Offer applied automatically
                                </>
                            ) : (
                                <>Code <span className="font-mono">{applied.code}</span> applied</>
                            )}
                            <span className="text-green-700 font-bold">−₹{applied.discount.toLocaleString("en-IN")}</span>
                        </p>
                        {applied.description && (
                            <p className="text-xs text-green-700 mt-0.5">{applied.description}</p>
                        )}
                        {applied.provisional && (
                            /* Honest about the one case where the number can still move:
                             * per-buyer limits can't be checked until we know who they are. */
                            <p className="text-[11px] text-green-700/80 mt-1">
                                Confirmed once you enter your email.
                            </p>
                        )}
                    </div>
                    {/* An auto offer has no code to remove — removing it would only
                     * cost the buyer money, and it would come straight back on the
                     * next quote anyway. */}
                    {!applied.auto && (
                        <button
                            onClick={clear}
                            disabled={busy}
                            className="text-green-700 hover:text-green-900 shrink-0 disabled:opacity-50"
                            aria-label="Remove coupon"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                {!applied.auto ? null : (
                    <button
                        onClick={() => setOpen(true)}
                        className="text-xs text-green-800 underline mt-2 hover:text-green-900"
                    >
                        Have a different code?
                    </button>
                )}

                {open && applied.auto && (
                    <div className="mt-2.5">
                        <CodeInput
                            code={code}
                            setCode={setCode}
                            busy={busy}
                            onSubmit={submit}
                            placeholder="Enter code"
                        />
                        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
                        <p className="text-[11px] text-gray-500 mt-1.5">
                            You keep whichever saves you more.
                        </p>
                    </div>
                )}
            </div>
        )
    }

    /* ── Collapsed ───────────────────────────────────────────────────────── */
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
                <Tag className="w-3.5 h-3.5" />
                Have a coupon code?
            </button>
        )
    }

    /* ── Open, nothing applied ───────────────────────────────────────────── */
    return (
        <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    Coupon code
                </p>
                <button onClick={() => { setOpen(false); setError(null) }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <CodeInput code={code} setCode={setCode} busy={busy} onSubmit={submit} placeholder="e.g. LAUNCH30" />

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            {!email && !error && (
                <p className="text-[11px] text-gray-400 mt-2">
                    Some codes are limited per person — enter your email above so we can confirm yours.
                </p>
            )}
        </div>
    )
}

function CodeInput({
    code, setCode, busy, onSubmit, placeholder,
}: {
    code: string
    setCode: (v: string) => void
    busy: boolean
    onSubmit: () => void
    placeholder: string
}) {
    return (
        <div className="flex gap-2">
            <input
                value={code}
                // Codes are stored uppercase; upper-casing as they type means the
                // field always shows exactly what will be sent.
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSubmit() } }}
                placeholder={placeholder}
                maxLength={24}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 h-11 border border-gray-200 rounded-lg px-3 text-sm font-mono tracking-wide bg-white outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400"
            />
            <button
                onClick={onSubmit}
                disabled={busy || !code.trim()}
                className="h-11 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </button>
        </div>
    )
}
