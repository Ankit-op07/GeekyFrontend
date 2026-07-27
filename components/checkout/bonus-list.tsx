"use client"

/**
 * ─── Free bonuses ──────────────────────────────────────────────────────────
 *
 *  "What else you get" at the point of payment.
 *
 *  ⚠️  Every item here is a platform feature the buyer really receives — the
 *  list comes from BONUS_CATALOG in lib/offers.ts, which exists precisely so
 *  this copy cannot drift into things we don't do. Nothing on this card is
 *  aspirational.
 *
 *  The "worth" figures are indicative anchors, deliberately labelled as such
 *  rather than presented as a price anyone was ever charged.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { Gift, Video, ListChecks, Building2, Flame, RefreshCw, Sparkles } from "lucide-react"

export interface BonusItemView {
    id: string
    title: string
    description: string
    worth: number
    icon: string
}

/** Server sends an icon NAME (it can't ship a component); the client maps it. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Video, ListChecks, Building2, Flame, RefreshCw, Sparkles,
}

export function BonusList({ bonuses, worth }: { bonuses: BonusItemView[]; worth: number }) {
    if (!bonuses?.length) return null

    return (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-[15px] text-gray-900">Included free with every kit</h3>
            </div>
            {worth > 0 && (
                <p className="text-xs text-amber-800 mb-3.5 ml-9">
                    Platform access worth about ₹{worth.toLocaleString("en-IN")} — yours at no extra cost.
                </p>
            )}

            <ul className="space-y-2.5">
                {bonuses.map((b) => {
                    const Icon = ICONS[b.icon] ?? Sparkles
                    return (
                        <li key={b.id} className="flex items-start gap-2.5">
                            <Icon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 leading-snug">{b.title}</p>
                                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{b.description}</p>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
