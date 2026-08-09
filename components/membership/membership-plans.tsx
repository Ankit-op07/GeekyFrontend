"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { useMembershipCheckout } from "@/hooks/use-membership-checkout"
import { cn } from "@/lib/utils"

/**
 * The three membership tiers.
 *
 * PRICES ARE FETCHED, NOT HARDCODED. A page that inlines "₹499" drifts the day
 * the price changes, and the drift is silent — someone reads one number and is
 * charged another, the single worst bug a pricing page can have. The only
 * prices that exist are in lib/membership.ts.
 *
 * DESIGN: minimal, one accent, no card competes with another except the
 * recommended one. Specifically:
 *  • The PER-MONTH figure is the headline and the total is secondary. That is
 *    the number people actually compare, and leading with ₹2,499 makes the best
 *    value look like the most expensive option.
 *  • Exactly one card is emphasised. Three "special" cards is three unremarkable
 *    cards.
 *  • Borders do the work, not fills. Filled cards at this size read as buttons.
 */

export interface MembershipPlanView {
    id: string
    label: string
    price: number
    months: number
    tagline: string
    highlight: boolean
    savings: number
    perMonth: number
}

export interface MembershipStatusView {
    signedIn: boolean
    active: boolean
    expiresAt: string | null
    daysRemaining: number
    planId: string | null
    planLabel?: string | null
    memberSince?: string | null
    name?: string | null
    plans: MembershipPlanView[]
}

/** Included in every tier. Everything here must actually ship — same rule as
 *  BONUS_CATALOG: remove the line in the same commit as the feature. */
const INCLUDED = [
    "All 7 kits, including future ones",
    "DSA Sheet — 155 problems, approaches, videos",
    "India-only job board + application tracker",
    "Contest tracker with email reminders",
    "Interview roadmaps",
    "Quizzes, notes, bookmarks and the leaderboard",
]

export function MembershipPlans({
    status,
    onPurchased,
    compact = false,
}: {
    status: MembershipStatusView | null
    onPurchased?: () => void
    compact?: boolean
}) {
    const { buyMembership, busyPlanId } = useMembershipCheckout()
    const plans = status?.plans ?? []

    if (!plans.length) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
                {plans.map((plan) => {
                    const busy = busyPlanId === plan.id
                    return (
                        <button
                            key={plan.id}
                            type="button"
                            disabled={Boolean(busyPlanId)}
                            onClick={() => buyMembership(plan.id, () => onPurchased?.())}
                            className={cn(
                                "group relative flex flex-col rounded-2xl border p-5 text-left transition-all",
                                "hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait disabled:opacity-70",
                                plan.highlight
                                    ? "border-violet-500/40 bg-card shadow-md ring-1 ring-violet-500/10"
                                    : "border-hairline bg-card hover:border-violet-500/30"
                            )}
                        >
                            {plan.highlight && (
                                <span className="absolute -top-2 right-5 rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                                    Best value
                                </span>
                            )}

                            <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                {plan.label}
                            </p>

                            {/* Per-month leads; the total is the supporting fact. */}
                            <div className="mt-3 flex items-baseline gap-1">
                                <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                                    ₹{plan.perMonth.toLocaleString("en-IN")}
                                </span>
                                <span className="text-sm text-muted-foreground">/mo</span>
                            </div>

                            <p className="mt-1.5 text-xs text-muted-foreground">
                                {plan.months === 1
                                    ? "Billed monthly"
                                    : `₹${plan.price.toLocaleString("en-IN")} billed once`}
                            </p>

                            {/* Only when real — a "save ₹0" chip on the monthly
                                plan reads as a trick. */}
                            <div className="mt-3 h-5">
                                {plan.savings > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                        Save ₹{plan.savings.toLocaleString("en-IN")}
                                    </span>
                                )}
                            </div>

                            <div
                                className={cn(
                                    "mt-4 flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                                    plan.highlight
                                        ? "bg-violet-600 text-white group-hover:bg-violet-500"
                                        : "border border-hairline text-foreground group-hover:border-violet-500/40"
                                )}
                            >
                                {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : status?.active ? (
                                    "Extend"
                                ) : (
                                    "Choose"
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Renewals stack rather than reset — someone deciding whether to
                renew early needs to know they will not lose the days they have
                left. See computeMembershipExpiry. */}
            {status?.active && (
                <p className="text-center text-xs text-muted-foreground">
                    Extending adds to your current term — you never lose days you have already paid for.
                </p>
            )}

            {/* THE TERM, stated plainly under the prices rather than in terms.
                A membership is time-limited and a kit purchase is not; saying so
                here is what stops "my access disappeared" arriving as a support
                ticket, and it costs nothing — anyone who reads it and prefers a
                permanent kit was never going to stay subscribed anyway. */}
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Access runs for the term you choose and then stops.{" "}
                <span className="text-foreground">Kits you buy outright are permanent</span> and are
                never affected.
            </p>

            {!compact && (
                <div className="rounded-2xl border border-hairline bg-card p-6">
                    <p className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        Every plan includes
                    </p>
                    <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                        {INCLUDED.map((line) => (
                            <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                                <Check
                                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
                                    strokeWidth={2.5}
                                />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

/** Shared fetcher so every surface reads the same status. */
export function useMembershipStatus() {
    const [status, setStatus] = useState<MembershipStatusView | null>(null)
    const [loading, setLoading] = useState(true)

    const load = () => {
        setLoading(true)
        fetch("/api/membership/status")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => data && setStatus(data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(load, [])
    return { status, loading, reload: load }
}
