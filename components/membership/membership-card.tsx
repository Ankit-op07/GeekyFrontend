"use client"

import Link from "next/link"
import { ArrowUpRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The member's card — the "you are a member" moment.
 *
 * Shaped like a physical membership card, not a status banner. A banner says "a
 * flag on your account is true"; a card says "this is yours". For the one screen
 * someone checks to see what they pay for every month, that is the whole job.
 *
 * WHAT MAKES IT READ AS PREMIUM, since every one of these is easy to undo:
 *
 *  1. A GRADIENT HAIRLINE BORDER, not a flat one. The 1px frame is a gradient
 *     from warm gold through transparent, produced by a padded wrapper with the
 *     gradient as its background and the card sitting inside it. A flat
 *     `border-white/10` is what "dark rectangle" looks like; a frame that
 *     catches light is what an object looks like.
 *  2. GRAIN. A tiny SVG feTurbulence tiled at 3% opacity. Flat #0d0d14 reads as
 *     an empty div at any size; the same colour with imperceptible noise reads
 *     as a surface. This is the single highest-value detail here and it costs
 *     one inline data URI.
 *  3. TYPE DOES THE WORK. Wide letter-spacing on the small caps, a large tight
 *     name, tabular figures. No decorative flourishes anywhere.
 *  4. ONE ACCENT, used four times at most. Restraint is the look; a card in four
 *     gradients reads as a free-trial pop-up.
 *  5. NO ANIMATION LOOP. A shimmer that never stops is a distraction on a screen
 *     people keep open. The sheen is static.
 */

/** feTurbulence grain, inlined. A remote texture would be blocked and would
 *  also be a network request for something that must never flash. */
const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")"

export interface MemberCardData {
    name: string | null
    planLabel: string | null
    expiresAt: string | null
    memberSince: string | null
    daysRemaining: number
}

function fmt(date: string | null, opts: Intl.DateTimeFormatOptions): string | null {
    if (!date) return null
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString("en-IN", opts)
}

export function MembershipCard({
    data,
    className,
    showRenew = true,
}: {
    data: MemberCardData
    className?: string
    showRenew?: boolean
}) {
    const until = fmt(data.expiresAt, { day: "numeric", month: "short", year: "numeric" })
    const since = fmt(data.memberSince, { month: "long", year: "numeric" })

    /* 14 days — a fortnight's notice rather than a same-week scramble. Display
     * only; access does not change at this threshold. */
    const expiringSoon = data.daysRemaining > 0 && data.daysRemaining <= 14

    return (
        // Outer wrapper IS the border: 1px of gradient showing around the inner
        // surface. This is why there is no `border` class below.
        <div
            className={cn(
                "relative rounded-[26px] p-px",
                /* CARD PROPORTIONS, NOT BANNER PROPORTIONS.
                 *
                 * Stretched to a 1000px dashboard column this becomes a bar with
                 * its content clustered at the left and a void in the middle —
                 * the exact opposite of the object it is meant to be. Capping
                 * the width is what keeps it reading as a card. */
                "w-full max-w-[460px]",
                className
            )}
            style={{
                background:
                    "linear-gradient(145deg, rgba(253,224,138,0.55) 0%, rgba(255,255,255,0.10) 26%, rgba(255,255,255,0.04) 55%, rgba(167,139,250,0.35) 100%)",
            }}
        >
            <div
                className="relative overflow-hidden rounded-[25px] bg-[#0b0b11] px-6 py-6 sm:px-7 sm:py-7"
                style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,0.85)" }}
            >
                {/* Depth: warm from the top-left, cool from the bottom-right. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(105% 75% at 0% 0%, rgba(251,191,36,0.15) 0%, transparent 58%), radial-gradient(85% 75% at 100% 100%, rgba(139,92,246,0.16) 0%, transparent 62%)",
                    }}
                />
                {/* Grain — see note 2. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
                    style={{ backgroundImage: GRAIN }}
                />

                <div className="relative">
                    {/* ── Head ─────────────────────────────────────────── */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
                                Geeky Frontend
                            </p>
                            <p
                                className="mt-2 text-[15px] font-medium tracking-[0.02em]"
                                style={{
                                    // Foil: a warm metallic gradient clipped to the
                                    // text. One place only — the wordmark.
                                    background:
                                        "linear-gradient(100deg, #fde68a 0%, #fbbf24 32%, #fff4cc 55%, #f59e0b 100%)",
                                    WebkitBackgroundClip: "text",
                                    backgroundClip: "text",
                                    color: "transparent",
                                }}
                            >
                                Membership
                            </p>
                        </div>

                        <span className="flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">
                            <span className="h-1 w-1 rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.55)]" />
                            Active
                        </span>
                    </div>

                    {/* ── Holder ───────────────────────────────────────── */}
                    <div className="mt-10">
                        <p className="truncate text-[25px] font-semibold leading-none tracking-[-0.02em] text-white sm:text-[27px]">
                            {data.name || "Member"}
                        </p>
                        {since && (
                            <p className="mt-2.5 text-[11px] tracking-wide text-white/35">
                                Member since {since}
                            </p>
                        )}
                    </div>

                    {/* ── Term ─────────────────────────────────────────── */}
                    <div
                        className="mt-8 grid grid-cols-3 gap-3 pt-5"
                        style={{
                            borderTop: "1px solid",
                            borderImage:
                                "linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04)) 1",
                        }}
                    >
                        <Field label="Plan" value={data.planLabel || "—"} />
                        <Field label="Valid until" value={until || "—"} />
                        <Field
                            label="Days left"
                            value={String(Math.max(0, data.daysRemaining))}
                            tone={expiringSoon ? "text-amber-300" : "text-white"}
                        />
                    </div>

                    {showRenew && expiringSoon && (
                        <Link
                            href="/membership"
                            className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-400 px-5 py-2.5 text-[13px] font-semibold text-slate-950 transition-opacity hover:opacity-90"
                        >
                            Renew membership
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

function Field({
    label,
    value,
    tone = "text-white",
}: {
    label: string
    value: string
    tone?: string
}) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
                {label}
            </p>
            <p className={cn("mt-2 truncate text-[15px] font-medium tabular-nums", tone)}>{value}</p>
        </div>
    )
}

/**
 * The marker on a membership-gated sidebar tab.
 *
 * TWO STATES, and the difference is the whole point:
 *
 *   unlocked  → a small gold diamond. Reads as "this one is yours", and ties the
 *               tab to the membership card through the shared amber accent.
 *   locked    → a small lock. Reads as "this is what a membership adds".
 *
 * A single lock icon for both would tell a paying member their own features are
 * locked, which is worse than no marker at all. Callers must therefore only
 * render this once membership state is KNOWN (not `null`), or a member sees a
 * lock flash on every page load.
 *
 * Deliberately tiny and monochrome-plus-one-accent. Six coloured badges down a
 * sidebar is a toolbar, not a hierarchy — the marker should be noticed on the
 * second pass, not the first.
 */
export function PremiumMark({ unlocked }: { unlocked: boolean }) {
    if (unlocked) {
        return (
            <span
                aria-label="Included in your membership"
                title="Included in your membership"
                className="block h-[7px] w-[7px] rotate-45 rounded-[1.5px] bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_6px_1px_rgba(251,191,36,0.45)]"
            />
        )
    }
    return (
        <Lock
            aria-label="Members only"
            className="h-3 w-3 text-muted-foreground/45"
            strokeWidth={2.25}
        />
    )
}

/**
 * The small "MEMBER" mark, for places that only need to acknowledge the status —
 * the dashboard sidebar beside the user's name. Being visible everywhere is most
 * of what "properly show him" means; a status that exists on one screen does not
 * feel like a membership.
 */
export function MemberBadge({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-gradient-to-b from-amber-400/15 to-amber-500/[0.07] px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300",
                className
            )}
        >
            Member
        </span>
    )
}
