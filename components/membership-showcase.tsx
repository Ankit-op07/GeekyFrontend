// components/membership-showcase.tsx
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
    ArrowRight,
    BookOpen,
    Binary,
    Briefcase,
    CalendarClock,
    Check,
    Map as MapIcon,
    Trophy,
} from "lucide-react"

/**
 * The membership section on the marketing homepage.
 *
 * Placed directly under the hero, ABOVE the kit grid, because the whole point of
 * a membership is that it is the better answer than buying kits one at a time —
 * and that argument has to land before someone starts comparing individual kit
 * prices, not after they have already picked one.
 *
 * Styled with explicit light-theme colours rather than semantic tokens. Per
 * CLAUDE.md the marketing pages are deliberately single-theme (next-themes is
 * mounted per-subtree, not at the root), so `bg-card` here would render against
 * assumptions that do not hold on this page.
 *
 * DESIGN: a dark panel on a light page. The homepage is white end to end, so one
 * inverted block is the cheapest way to make the highest-value SKU read as the
 * premium option without adding a single decorative flourish.
 *
 * PRICES ARE FETCHED, never inlined — /api/membership/status is the only place
 * they exist. A hardcoded "₹2,499" on a marketing page is the exact bug where a
 * visitor reads one number and gets charged another.
 */

const FEATURES = [
    { icon: BookOpen, label: "All 7 kits", detail: "JavaScript, React, System Design, Angular, Node, Java, DevOps" },
    { icon: Binary, label: "DSA Sheet", detail: "155 problems, written approaches, video solutions" },
    { icon: Briefcase, label: "Job board", detail: "India-only roles from 50+ boards, with a tracker" },
    { icon: CalendarClock, label: "Contest tracker", detail: "Codeforces, AtCoder, CodeChef + reminders" },
    { icon: MapIcon, label: "Roadmaps", detail: "Week-by-week plans, not a pile of links" },
    { icon: Trophy, label: "Quizzes & leaderboard", detail: "Server-graded, ranked on what you got right" },
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

export function MembershipShowcase() {
    const [plans, setPlans] = useState<PlanView[]>([])

    useEffect(() => {
        fetch("/api/membership/status")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.plans && setPlans(d.plans))
            .catch(() => {
                /* Section still renders without prices — never invent one. */
            })
    }, [])

    const cheapest = plans.length ? Math.min(...plans.map((p) => p.perMonth)) : null

    return (
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-5xl">
                <div className="relative overflow-hidden rounded-[28px] bg-[#0b0b12] px-6 py-12 sm:px-12 sm:py-16">
                    {/* Two soft washes, nothing else. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(70% 60% at 15% 0%, rgba(139,92,246,0.20) 0%, transparent 60%), radial-gradient(60% 60% at 100% 100%, rgba(34,211,238,0.12) 0%, transparent 60%)",
                        }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-12 top-0 h-px"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)",
                        }}
                    />

                    <div className="relative">
                        {/* ── Head ─────────────────────────────────────── */}
                        <div className="max-w-2xl">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-violet-300">
                                Membership
                            </p>
                            <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.75rem]">
                                The whole platform,
                                <br />
                                one membership.
                            </h2>
                            <p className="mt-5 text-base leading-relaxed text-white/60">
                                Every kit, the 155-problem DSA sheet, the India-only job board and the
                                contest tracker
                                {cheapest !== null && (
                                    <>
                                        {" "}
                                        — from{" "}
                                        <span className="font-semibold text-white">
                                            ₹{cheapest.toLocaleString("en-IN")}/month
                                        </span>
                                    </>
                                )}
                                .
                            </p>
                        </div>

                        {/* ── Features ─────────────────────────────────── */}
                        <div className="mt-12 grid gap-x-10 gap-y-7 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((f) => (
                                <div key={f.label} className="flex gap-3">
                                    <f.icon
                                        className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-violet-300"
                                        strokeWidth={1.75}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-white">{f.label}</p>
                                        <p className="mt-1 text-[13px] leading-relaxed text-white/50">
                                            {f.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Plans ────────────────────────────────────── */}
                        {plans.length > 0 && (
                            <div className="mt-12 grid gap-3 border-t border-white/10 pt-10 sm:grid-cols-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-2xl border p-5 ${
                                            plan.highlight
                                                ? "border-violet-400/40 bg-white/[0.06]"
                                                : "border-white/10 bg-white/[0.02]"
                                        }`}
                                    >
                                        {plan.highlight && (
                                            <span className="absolute -top-2 right-5 rounded-full bg-violet-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                                                Best value
                                            </span>
                                        )}
                                        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/45">
                                            {plan.label}
                                        </p>
                                        {/* Per-month leads — it is the number people
                                            compare, and leading with the total makes
                                            the best value look most expensive. */}
                                        <div className="mt-2.5 flex items-baseline gap-1">
                                            <span className="text-2xl font-semibold tabular-nums text-white">
                                                ₹{plan.perMonth.toLocaleString("en-IN")}
                                            </span>
                                            <span className="text-sm text-white/45">/mo</span>
                                        </div>
                                        <p className="mt-1 text-xs text-white/40">
                                            {plan.months === 1
                                                ? "Billed monthly"
                                                : `₹${plan.price.toLocaleString("en-IN")} once`}
                                        </p>
                                        {plan.savings > 0 && (
                                            <p className="mt-2.5 text-[11px] font-medium text-emerald-400">
                                                Save ₹{plan.savings.toLocaleString("en-IN")}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── CTA ──────────────────────────────────────── */}
                        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <Link
                                href="/membership"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-950 transition-colors hover:bg-white/90"
                            >
                                Get membership
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            {/* The honest boundary, stated where the decision is
                                made. This is the biggest objection from someone
                                who has already bought a kit; the answer removes it. */}
                            {/* Both halves of the trade-off, in one line. The
                                membership is the thing being sold here, so its
                                limit belongs on the same surface as its pitch —
                                not only in the terms page. */}
                            <p className="flex items-start gap-2 text-xs leading-relaxed text-white/45">
                                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" strokeWidth={3} />
                                <span>
                                    Membership runs for your chosen term. Kits you buy outright are{" "}
                                    <span className="text-white/70">permanent</span> and stay yours
                                    either way.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
