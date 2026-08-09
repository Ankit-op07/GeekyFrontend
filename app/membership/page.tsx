"use client"

import Link from "next/link"
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react"
import { MembershipPlans, useMembershipStatus } from "@/components/membership/membership-plans"
import { MembershipFeatures } from "@/components/membership/membership-features"
import { MembershipCard } from "@/components/membership/membership-card"

/**
 * The membership page.
 *
 * Client-rendered because everything on it is per-viewer: prices come from
 * /api/membership/status, and a member must see their card and expiry rather
 * than a pitch for something they already have. Server-rendering would mean
 * either caching a page that is wrong for members or opting out of caching
 * entirely, which buys nothing here.
 *
 * Deliberately NOT under /dashboard — it is linked from marketing, from the
 * gated tabs and from the renewal email, and those readers may not be signed in.
 *
 * LAYOUT: one column, generous vertical rhythm, no boxes inside boxes. The
 * member's card leads for a member; the price does for everyone else.
 */
export default function MembershipPage() {
    const { status, loading, reload } = useMembershipStatus()
    const isMember = Boolean(status?.active)

    return (
        <main className="min-h-screen bg-background">
            {/* One soft wash at the top, then nothing. Restraint is the look. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
                style={{
                    background:
                        "radial-gradient(60% 100% at 50% 0%, rgba(139,92,246,0.10) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-3xl px-5 py-10 sm:py-16">
                <Link
                    href="/dashboard"
                    className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                </Link>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-14">
                        {isMember ? (
                            <section className="space-y-6">
                                <MembershipCard
                                    data={{
                                        name: status?.name ?? null,
                                        planLabel: status?.planLabel ?? null,
                                        expiresAt: status?.expiresAt ?? null,
                                        memberSince: status?.memberSince ?? null,
                                        daysRemaining: status?.daysRemaining ?? 0,
                                    }}
                                    showRenew={false}
                                />
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Extend your membership
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Added to your current term, not restarted.
                                    </p>
                                </div>
                            </section>
                        ) : (
                            <header>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400">
                                    Membership
                                </p>
                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
                                    The whole platform,
                                    <br className="hidden sm:block" /> one membership.
                                </h1>
                                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                                    Every kit, the 155-problem DSA sheet, the India-only job board and
                                    the contest tracker — instead of seven separate purchases.
                                </p>
                            </header>
                        )}

                        <MembershipPlans status={status} onPurchased={reload} />

                        <section>
                            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                What you get
                            </h2>
                            <MembershipFeatures />
                        </section>

                        {/* The commitment that matters most to an existing
                            customer, stated plainly rather than buried in terms.
                            A kit purchase writes a permanent entry to
                            purchasedKits and membership is a separate, additive
                            grant — so this is a fact about the data model, not a
                            marketing promise. */}
                        <section className="flex items-start gap-3 rounded-2xl border border-hairline bg-card p-5">
                            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    Kits you own stay yours permanently.
                                </span>{" "}
                                Membership is added on top — it never replaces a purchase, and nothing
                                you have paid for changes when a membership ends. Your notes,
                                bookmarks, DSA progress and saved jobs are kept, and come straight back
                                if you renew.
                            </p>
                        </section>
                    </div>
                )}
            </div>
        </main>
    )
}
