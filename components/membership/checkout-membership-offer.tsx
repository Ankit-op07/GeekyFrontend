"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
    ArrowRight,
    Binary,
    BookOpen,
    Briefcase,
    CalendarClock,
    Check,
    Infinity as InfinityIcon,
    Map as MapIcon,
    Timer,
    Trophy,
} from "lucide-react"

/**
 * The membership alternative, shown on a single kit's checkout page.
 *
 * WHY IT BELONGS HERE. Someone on /checkout/react has already decided to spend
 * money on interview prep — this is the highest-intent moment on the site, and
 * the only place where "one kit" versus "everything" is a live comparison. Every
 * other surface either catches them before they intend to buy (homepage) or
 * after (dashboard).
 *
 * WHAT IT MUST NOT DO: bury the kit they came for. The kit is the default and
 * keeps the sticky buy card; this is a considered second option placed below it,
 * not a competing hero. An upsell that makes people abandon the purchase they
 * arrived for is worse than no upsell.
 *
 * THE HONEST COMPARISON IS THE WHOLE POINT — and it cuts both ways:
 *   • kit        → PERMANENT. One payment, yours forever.
 *   • membership → TIME-LIMITED. Everything, until the term ends.
 * Stating the kit's advantage plainly is what makes the membership claim
 * credible. Hiding the expiry to win a sale produces a refund and a bad review,
 * which costs more than the sale was worth.
 *
 * Light-theme literals throughout: per CLAUDE.md the checkout pages are
 * deliberately single-theme (next-themes is mounted per-subtree, not at the
 * root), so semantic tokens like `bg-card` would render against assumptions that
 * do not hold here.
 *
 * PRICES ARE FETCHED from /api/membership/status — never inlined. A hardcoded
 * price on a checkout page is the bug where a buyer reads one number and is
 * charged another.
 */

const PERKS = [
    { icon: BookOpen, label: "All 7 kits" },
    { icon: Binary, label: "DSA Sheet — 155 problems" },
    { icon: Briefcase, label: "Job board + tracker" },
    { icon: CalendarClock, label: "Contest tracker" },
    { icon: MapIcon, label: "Interview roadmaps" },
    { icon: Trophy, label: "Quizzes & leaderboard" },
]

interface PlanView {
    id: string
    label: string
    price: number
    months: number
    savings: number
    perMonth: number
    highlight: boolean
}

export function CheckoutMembershipOffer({
    kitName,
    kitPrice,
}: {
    kitName: string
    kitPrice: number
}) {
    const [plans, setPlans] = useState<PlanView[]>([])
    const [active, setActive] = useState(false)

    useEffect(() => {
        fetch("/api/membership/status")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return
                setPlans(d.plans || [])
                setActive(Boolean(d.active))
            })
            .catch(() => {
                /* Section simply does not render — never invent a price. */
            })
    }, [])

    // An existing member does not need to be sold a membership on a page where
    // they are (legitimately) buying a kit outright to keep permanently.
    if (active || !plans.length) return null

    const cheapest = Math.min(...plans.map((p) => p.perMonth))
    const best = plans.find((p) => p.highlight) ?? plans[plans.length - 1]

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* ── Head: dark inset, so the section reads as a distinct option
                   rather than another white card in the stack ─────────────── */}
            <div className="relative overflow-hidden bg-[#0b0b12] px-5 py-6 md:px-7">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(70% 90% at 0% 0%, rgba(139,92,246,0.22) 0%, transparent 60%), radial-gradient(60% 80% at 100% 100%, rgba(34,211,238,0.12) 0%, transparent 60%)",
                    }}
                />
                <div className="relative">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                        Or get everything
                    </p>
                    <h2 className="mt-2 text-xl font-bold leading-snug text-white md:text-2xl">
                        Membership — all 7 kits and every tool
                        <span className="text-white/50"> from ₹{cheapest}/month</span>
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
                        {kitName} is one kit. A membership opens the whole platform — every kit plus
                        the DSA sheet, job board and contest tracker.
                    </p>

                    <div className="mt-5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        {PERKS.map((p) => (
                            <div key={p.label} className="flex items-center gap-2.5">
                                <p.icon
                                    className="h-4 w-4 flex-shrink-0 text-violet-300"
                                    strokeWidth={1.75}
                                />
                                <span className="text-[13px] text-white/80">{p.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── The honest comparison ──────────────────────────────────── */}
            <div className="grid gap-px bg-gray-200 sm:grid-cols-2">
                <div className="bg-white p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <InfinityIcon className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            Permanent
                        </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                        This kit — ₹{kitPrice.toLocaleString("en-IN")} once
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
                        One payment and {kitName} is yours forever, including future updates. It
                        never expires and a membership can never take it away.
                    </p>
                </div>

                <div className="bg-white p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <Timer className="h-4 w-4 text-violet-600" strokeWidth={2} />
                        <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                            Time-limited
                        </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                        Membership — from ₹{cheapest}/month
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
                        Everything on the platform while it runs. When it ends, access to
                        membership content stops — anything you bought outright stays yours.
                    </p>
                </div>
            </div>

            {/* ── CTA ───────────────────────────────────────────────────── */}
            <div className="flex flex-col items-start gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
                <p className="text-[13px] text-gray-600">
                    <span className="font-semibold text-gray-900">
                        ₹{best.price.toLocaleString("en-IN")} for {best.label.toLowerCase()}
                    </span>
                    {best.savings > 0 && ` — saves ₹${best.savings.toLocaleString("en-IN")}`}
                </p>
                <Link
                    href="/membership"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    Compare membership plans
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    )
}

/**
 * The one-line permanence promise for the buy card itself.
 *
 * Sits next to the price, where the decision is actually made. Two jobs at once:
 * it reassures the kit buyer (their purchase does not expire) and it makes the
 * membership section's "time-limited" admission read as candour rather than
 * fine print.
 */
export function PermanentAccessNote({ className }: { className?: string }) {
    return (
        <p className={`flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-600 ${className ?? ""}`}>
            <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-600" strokeWidth={3} />
            <span>
                <span className="font-semibold text-gray-900">Yours permanently.</span> One payment,
                no renewal — this kit never expires.
            </span>
        </p>
    )
}
