"use client"

/**
 * ─── Better deal ───────────────────────────────────────────────────────────
 *
 *  "The thing you're buying is part of a better one."
 *
 *  Every number here comes from the server's getDealsForKit(), which prices
 *  through computeUpgradePrice() — so an upgrade is quoted with the buyer's
 *  own credit already applied. It never shows a list price they wouldn't be
 *  charged, and it never invents a discount (that is the coupon system's job).
 *
 *  Shown at most twice and only when there is genuinely more on offer; the
 *  server returns nothing when the buyer is already on the best deal. A
 *  checkout page that nags is a checkout page people leave.
 * ──────────────────────────────────────────────────────────────────────────
 */

import Link from "next/link"
import { ArrowRight, TrendingUp, Plus } from "lucide-react"

export interface KitDealView {
    kitId: string
    name: string
    tagline: string
    listPrice: number
    payable: number
    credit: number
    extraSpend: number
    savings: number
    reason: string
    type: "upgrade" | "addon"
    href: string
}

export function BetterDeal({ deals }: { deals: KitDealView[] }) {
    if (!deals?.length) return null

    const upgrade = deals.find((d) => d.type === "upgrade")
    const addons = deals.filter((d) => d.type === "addon")

    return (
        <div className="space-y-3">
            {upgrade && (
                <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-600 text-white">
                            Better value
                        </span>
                        {upgrade.credit > 0 && (
                            <span className="text-xs font-semibold text-emerald-700">
                                ₹{upgrade.credit.toLocaleString("en-IN")} credit applied
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-violet-600" />
                        {upgrade.name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{upgrade.tagline}</p>

                    <div className="flex items-end justify-between gap-4 mt-4">
                        <div>
                            <p className="text-sm font-semibold text-violet-900">{upgrade.reason}</p>
                            {upgrade.savings > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Saves ₹{upgrade.savings.toLocaleString("en-IN")} versus buying separately.
                                </p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-2xl font-extrabold text-gray-900 leading-none">
                                ₹{upgrade.payable.toLocaleString("en-IN")}
                            </p>
                            {upgrade.credit > 0 && (
                                <p className="text-xs text-gray-400 line-through">
                                    ₹{upgrade.listPrice.toLocaleString("en-IN")}
                                </p>
                            )}
                        </div>
                    </div>

                    <Link
                        href={upgrade.href}
                        className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity"
                    >
                        Switch to this — add ₹{upgrade.extraSpend.toLocaleString("en-IN")}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {addons.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                        Complete your stack
                    </p>
                    <ul className="space-y-2">
                        {addons.map((d) => (
                            /* min-w-0 all the way down: the labels below are
                               `truncate` (white-space: nowrap), whose min-content
                               is the full untruncated string. Without this, a long
                               kit name makes this row unshrinkable and blows out
                               whatever grid or flex track it is dropped into —
                               which it did, taking the whole checkout page into
                               horizontal scroll on mobile. */
                            <li key={d.kitId} className="min-w-0">
                                <Link
                                    href={d.href}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 -mx-1 hover:bg-gray-50 transition-colors group min-w-0"
                                >
                                    <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-semibold text-gray-900 truncate">{d.name}</span>
                                        <span className="block text-xs text-gray-500 truncate">{d.tagline}</span>
                                    </span>
                                    <span className="text-sm font-bold text-gray-900 shrink-0 group-hover:text-violet-700">
                                        ₹{d.payable.toLocaleString("en-IN")}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
