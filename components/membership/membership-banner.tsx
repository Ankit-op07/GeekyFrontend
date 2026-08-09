"use client"

import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { useMembershipStatus } from "@/components/membership/membership-plans"
import { MembershipCard } from "@/components/membership/membership-card"
import { cn } from "@/lib/utils"

/**
 * The membership entry point — shown where people are already deciding to buy.
 *
 * WHY THIS IS NOT A NAV TAB. A tab is a destination you go to when you already
 * want the thing, which is backwards for the highest-value SKU: nobody clicks
 * "Membership" in a sidebar to find out what a membership is. It has to appear
 * at the moment of the decision — on top of the dashboard, and above the kit
 * grid where the alternative purchase is being weighed.
 *
 * For a MEMBER this becomes their card (variant `full`) or a quiet confirmation
 * line (`compact`), because the same surface then has to answer the only
 * question a subscriber has: how long have I got. That is also why removing the
 * tab lost nothing — the status is on the page they land on anyway.
 */
export function MembershipBanner({
    variant = "full",
    className,
}: {
    /** `full` = dashboard hero / member card. `compact` = one line above the kit grid. */
    variant?: "full" | "compact"
    className?: string
}) {
    const { status, loading } = useMembershipStatus()

    // Render nothing rather than a skeleton: this is a promo, and a grey box
    // that resolves into an advert is worse than the advert simply appearing.
    if (loading || !status) return null

    // ── Member ──────────────────────────────────────────────────────────
    if (status.active) {
        // Above the kit grid, the card would shout. One line is enough there.
        if (variant === "compact") {
            return (
                <div
                    className={cn(
                        "flex items-center gap-2.5 rounded-xl border border-hairline bg-card px-4 py-3",
                        className
                    )}
                >
                    <Check
                        className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2.5}
                    />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Membership active</span> — every
                        kit below is already unlocked.
                    </p>
                </div>
            )
        }

        return (
            <MembershipCard
                className={className}
                data={{
                    name: status.name ?? null,
                    planLabel: status.planLabel ?? null,
                    expiresAt: status.expiresAt,
                    memberSince: status.memberSince ?? null,
                    daysRemaining: status.daysRemaining,
                }}
            />
        )
    }

    // ── Not a member ────────────────────────────────────────────────────
    const cheapest = status.plans.length
        ? Math.min(...status.plans.map((p) => p.perMonth))
        : null
    const lapsedOn =
        status.expiresAt && !Number.isNaN(new Date(status.expiresAt).getTime())
            ? new Date(status.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              })
            : null

    if (variant === "compact") {
        return (
            <div
                className={cn(
                    "flex flex-col justify-between gap-3 rounded-2xl border border-hairline bg-card px-5 py-4 sm:flex-row sm:items-center",
                    className
                )}
            >
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                        Get all seven kits with a membership
                        {cheapest !== null && (
                            <span className="text-muted-foreground"> — from ₹{cheapest}/month</span>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Plus the DSA sheet, job board and contest tracker.
                    </p>
                </div>
                <Link
                    href="/membership"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    View plans
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-hairline bg-card p-6",
                className
            )}
        >
            {/* A single soft wash from one corner — not a full gradient fill.
                The dashboard already has coloured panels; another one competes. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(80% 120% at 100% 0%, rgba(139,92,246,0.10) 0%, transparent 60%)",
                }}
            />

            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400">
                        Membership
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        Unlock everything
                        {cheapest !== null && (
                            <span className="text-muted-foreground"> from ₹{cheapest}/month</span>
                        )}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        All seven kits, the 155-problem DSA sheet, the India-only job board and the
                        contest tracker — in one membership instead of seven purchases.
                    </p>

                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                        {["7 kits", "155 DSA problems", "Job board", "Contest reminders", "Roadmaps"].map(
                            (item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                    <Check
                                        className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                                        strokeWidth={3}
                                    />
                                    {item}
                                </li>
                            )
                        )}
                    </ul>

                    <p className="mt-4 text-xs text-muted-foreground">
                        {lapsedOn
                            ? `Your membership ended on ${lapsedOn} — everything you saved is still here.`
                            : "Kits you have already bought stay yours permanently."}
                    </p>
                </div>

                <Link
                    href="/membership"
                    className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    {lapsedOn ? "Renew membership" : "View plans"}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    )
}
