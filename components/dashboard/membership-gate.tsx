"use client"

import Link from "next/link"
import { Lock, Binary, CalendarClock, Briefcase, ArrowRight } from "lucide-react"
import { RowListSkeleton } from "@/components/dashboard/skeletons"
import {
    MembershipPlans,
    useMembershipStatus,
    type MembershipStatusView,
} from "@/components/membership/membership-plans"

/**
 * Shown in place of a membership-gated tab (DSA, Contests, Jobs).
 *
 * This is a SECOND line of defence, not the gate itself. The real gate is in the
 * API routes — /api/jobs, /api/contests/plans and the DSA tracker endpoints all
 * refuse a non-member regardless of what the client renders. Hiding a tab hides
 * a link, not an endpoint. If this component were the only check, the feature
 * would be free to anyone who opened devtools.
 *
 * It exists to make the refusal legible and to sell the fix, which an API 403
 * cannot do.
 *
 * DESIGN: the lock is small and stated once. A dramatic paywall makes people
 * feel they have hit a wall; a quiet one makes it feel like a door.
 */

const FEATURE_META = {
    dsa: {
        icon: Binary,
        title: "DSA Sheet",
        blurb:
            "155 interview problems grouped by the idea they teach, each with a written approach, a video solution, your notes and progress tracking.",
        // Content is deliberately still public — see lib/dsa-access.ts. Saying so
        // is more persuasive than pretending everything is locked.
        freeNote:
            "Every problem and approach is still free to read — membership adds the tracker, your notes and lists.",
        freeHref: "/dsa/arrays-hashing/contains-duplicate",
        freeLabel: "Browse a solution",
    },
    contests: {
        icon: CalendarClock,
        title: "Contest planning",
        blurb:
            "Every upcoming Codeforces, AtCoder, CodeChef and LeetCode round. Mark the ones you'll sit, see them on your calendar, and get an email the morning of.",
        freeNote: null,
        freeHref: null,
        freeLabel: null,
    },
    jobs: {
        icon: Briefcase,
        title: "Job board",
        blurb:
            "Indian developer openings pulled from 50+ company boards into one deduplicated list, with an application tracker that remembers where you applied.",
        freeNote: null,
        freeHref: null,
        freeLabel: null,
    },
} as const

export type GatedFeature = keyof typeof FEATURE_META

export function MembershipGate({
    feature,
    onUnlocked,
}: {
    feature: GatedFeature
    onUnlocked?: () => void
}) {
    const { status, loading, reload } = useMembershipStatus()
    const meta = FEATURE_META[feature]
    const Icon = meta.icon

    if (loading) {
        return (
            <div className="max-w-3xl">
                <RowListSkeleton count={4} />
            </div>
        )
    }

    const lapsed = lapsedMessage(status)

    return (
        <div className="max-w-3xl space-y-10">
            <header>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-overlay px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Members only
                </div>

                <div className="flex items-start gap-3.5">
                    <Icon
                        className="mt-1 h-6 w-6 flex-shrink-0 text-violet-700 dark:text-violet-400"
                        strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            {meta.title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {meta.blurb}
                        </p>
                    </div>
                </div>

                {lapsed && (
                    <p className="mt-5 rounded-xl border border-hairline bg-card px-4 py-3 text-sm text-muted-foreground">
                        {lapsed}
                    </p>
                )}

                {meta.freeNote && (
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-muted-foreground">{meta.freeNote}</p>
                        {meta.freeHref && meta.freeLabel && (
                            <Link
                                href={meta.freeHref}
                                className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 transition-colors hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300"
                            >
                                {meta.freeLabel}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                )}
            </header>

            {/* Signed out — asking someone to subscribe before they have an
                account is two asks at once, and checkout requires a session. */}
            {status && !status.signedIn ? (
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/login?next=/dashboard"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/membership"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-violet-500/40"
                    >
                        See plans
                    </Link>
                </div>
            ) : (
                <MembershipPlans
                    status={status}
                    compact
                    onPurchased={() => {
                        reload()
                        onUnlocked?.()
                    }}
                />
            )}
        </div>
    )
}

/**
 * A former member is not a stranger. Naming the date they lapsed converts far
 * better than generic upsell copy, and it is also just less rude.
 */
function lapsedMessage(status: MembershipStatusView | null): string | null {
    if (!status || status.active || !status.expiresAt) return null
    const when = new Date(status.expiresAt)
    if (Number.isNaN(when.getTime())) return null
    return `Your membership ended on ${when.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })}. Everything you saved is still here.`
}
