"use client"

/**
 * ─── Live offer banner ─────────────────────────────────────────────────────
 *
 *  Shows the current publicly-advertised offer away from checkout (dashboard).
 *
 *  Only coupons an admin marked `promoted` reach this — /api/coupons/active
 *  filters out private, expired and fully-claimed codes, so this can never
 *  advertise something that then fails at the till.
 *
 *  Renders NOTHING when there is no live offer. A permanent "SALE!" strip is
 *  noise that trains people to ignore the real ones.
 *
 *  Lives on the themed dashboard, so it uses the global semantic tokens plus
 *  literal brand accents, per CLAUDE.md.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Tag, ArrowRight, Clock } from "lucide-react"

interface PublicOffer {
    code: string
    description: string
    kind: "percent" | "flat"
    value: number
    appliesTo: string[]
    endsAt: string | null
    autoApply: boolean
}

/** "2d 4h" / "6h 12m" / "45m" — coarse on purpose; a ticking clock is pressure, not information. */
function timeLeft(endsAt: string): string | null {
    const ms = new Date(endsAt).getTime() - Date.now()
    if (!Number.isFinite(ms) || ms <= 0) return null

    const minutes = Math.floor(ms / 60_000)
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    const mins = minutes % 60

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${mins}m left`
    return `${mins}m left`
}

export function OfferBanner({ className }: { className?: string }) {
    const [offer, setOffer] = useState<PublicOffer | null>(null)
    const [remaining, setRemaining] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        fetch("/api/coupons/active")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!active) return
                /* Only advertise offers that apply THEMSELVES.
                 *
                 * The coupon entry box on /pay is currently gated off
                 * (COUPON_FIELD_ENABLED), so a banner saying "use code X" would
                 * send people to a checkout with nowhere to put it — worse than
                 * showing no banner at all. Auto-applied offers have no such
                 * problem: the price is already discounted when they arrive.
                 *
                 * When the code box is enabled, drop this filter to advertise
                 * typed codes too. */
                const offers: PublicOffer[] = d?.offers ?? []
                setOffer(offers.find((o) => o.autoApply) ?? null)
            })
            .catch(() => { /* a banner is decoration — stay silent */ })
        return () => { active = false }
    }, [])

    // Recomputed once a minute; matches the coarsest unit shown.
    useEffect(() => {
        if (!offer?.endsAt) { setRemaining(null); return }
        const tick = () => setRemaining(timeLeft(offer.endsAt!))
        tick()
        const id = setInterval(tick, 60_000)
        return () => clearInterval(id)
    }, [offer?.endsAt])

    if (!offer) return null
    // The offer ran out while this tab was open — stop advertising it.
    if (offer.endsAt && !remaining) return null

    const headline =
        offer.kind === "percent" ? `${offer.value}% off` : `₹${offer.value} off`

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 ${className ?? ""}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Tag className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-[15px] leading-snug">
                            {headline} — {offer.description || "limited-time offer"}
                        </p>
                        <p className="text-xs text-white/80 mt-0.5 flex items-center gap-2 flex-wrap">
                            {offer.autoApply ? (
                                <span>Applied automatically at checkout</span>
                            ) : (
                                <span>
                                    Use code <span className="font-mono font-bold text-white">{offer.code}</span>
                                </span>
                            )}
                            {remaining && (
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {remaining}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <Link
                    href={offer.appliesTo.length === 1 ? `/pay?kit=${offer.appliesTo[0]}` : "/#pricing"}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-white/90 transition-colors"
                >
                    Claim it
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    )
}
