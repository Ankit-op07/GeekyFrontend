"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sparkles, X, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/**
 * Dismissible "what's new" banner announcing freshly-added kits to existing
 * users on the dashboard. Dismissal persists in localStorage under a VERSIONED
 * key — bump the version (or swap the copy + key) for the next announcement and
 * everyone sees it again. Mirrors the gf-* localStorage pattern used elsewhere
 * (e.g. gf-refs-collapsed in components/learn/topic-references.tsx).
 */
const DISMISS_KEY = "gf-banner-newkits-2026-07c" // bumped when Java was added

export function NewKitsBanner() {
    // Default hidden until we've read localStorage — avoids a flash for users
    // who already dismissed it, and any SSR/hydration mismatch.
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        try {
            if (localStorage.getItem(DISMISS_KEY) !== "1") setVisible(true)
        } catch {
            // localStorage unavailable (privacy mode) — show it, non-critical.
            setVisible(true)
        }
    }, [])

    if (!visible) return null

    const dismiss = () => {
        setVisible(false)
        try { localStorage.setItem(DISMISS_KEY, "1") } catch { /* non-critical */ }
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-50 via-card to-card dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_40%)]" />

            <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-[10px] px-2 py-0.5 font-bold">
                            ✨ NEW
                        </Badge>
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Just added</span>
                    </div>
                    <h3 className="text-foreground font-bold text-base sm:text-lg leading-tight">
                        New interview kits are here: Java, Angular, Node.js &amp; DevOps
                    </h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Deep, diagram-rich content with quizzes and curated references — fresh for 2026.
                    </p>
                </div>

                {/* Wraps rather than shrinks — three CTAs don't fit one row on
                    narrow screens, and squeezing them truncates the labels.
                    DevOps has no /checkout/[kit] entry; it sells via /pay. */}
                <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                    {/* No Java CTA yet — the kit is comingSoon, so /checkout/java
                        redirects to the home page. Add it back in the commit that
                        makes the kit purchasable. */}
                    <Link
                        href="/checkout/angular"
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold px-3 py-2 shadow-sm hover:opacity-95 transition-opacity"
                    >
                        Angular <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                        href="/checkout/nodejs"
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold px-3 py-2 shadow-sm hover:opacity-95 transition-opacity"
                    >
                        Node.js <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                        href="/pay?kit=devops-kit"
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-semibold px-3 py-2 shadow-sm hover:opacity-95 transition-opacity"
                    >
                        DevOps <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
