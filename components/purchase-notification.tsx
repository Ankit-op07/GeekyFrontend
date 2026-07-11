// components/purchase-notification.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { X, ShoppingBag, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

/**
 * ─── Social proof — REAL purchases only ────────────────────────────────────
 *
 *  This component used to fabricate its own social proof: it shipped arrays of
 *  Indian first names, last names and cities, and generated toasts like
 *  "Aarav Sharma from Pune just purchased the React Kit" — for people who did
 *  not exist. It also faked a "verified" tick 70% of the time and hardcoded
 *  "23 people viewing".
 *
 *  All of that is gone. It now renders genuine orders from /api/social-proof/recent.
 *
 *  ⚠️  Do not reintroduce generated names, cities, or viewer counts — not here,
 *  and not on the server either. Fabricating it server-side does not make it
 *  true, it just makes it deliberate. If there is nothing real to show, we show
 *  nothing. See PRD-001 §3.4.
 * ──────────────────────────────────────────────────────────────────────────
 */

interface RecentPurchase {
  firstName: string
  planName: string
  boughtAgo: string
}

/** Shorten the canonical plan name for the toast. Display-only. */
function shortName(planName: string): string {
  const n = planName.toLowerCase()
  if (n.includes("all access") || n.includes("complete kit")) return "the Complete Kit"
  if (n.includes("system design")) return "the Frontend System Design Kit"
  if (n.includes("react")) return "the React Kit"
  if (n.includes("javascript") || n.includes("js interview")) return "the JS Kit"
  if (n.includes("node")) return "the Node.js Kit"
  if (n.includes("placement")) return "the Placement Kit"
  return planName
}

function accentFor(planName: string): string {
  const n = planName.toLowerCase()
  if (n.includes("all access") || n.includes("complete kit")) return "from-purple-400 to-pink-400"
  if (n.includes("system design")) return "from-violet-400 to-indigo-400"
  if (n.includes("react")) return "from-blue-400 to-cyan-400"
  if (n.includes("javascript") || n.includes("js interview")) return "from-yellow-400 to-orange-400"
  return "from-slate-400 to-slate-500"
}

export function PurchaseNotifications() {
  const pathname = usePathname()
  const [purchases, setPurchases] = useState<RecentPurchase[]>([])
  const [totalPurchases, setTotalPurchases] = useState(0)
  const [index, setIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [current, setCurrent] = useState<RecentPurchase | null>(null)

  // Don't show on authenticated pages.
  const suppressedPaths = ["/dashboard", "/learn", "/admin"]
  const isSuppressed = suppressedPaths.some((p) => pathname?.startsWith(p))

  // Fetch real purchases once.
  useEffect(() => {
    if (isSuppressed) return
    let cancelled = false

    fetch("/api/social-proof/recent")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setPurchases(Array.isArray(data.recent) ? data.recent : [])
        setTotalPurchases(Number(data.totalPurchases) || 0)
      })
      .catch(() => {
        /* Silent. No real data → no toast. Never a fabricated fallback. */
      })

    return () => {
      cancelled = true
    }
  }, [isSuppressed])

  // Cycle through the real purchases we actually have.
  useEffect(() => {
    if (isSuppressed || purchases.length === 0) return

    let hideTimer: ReturnType<typeof setTimeout>

    const show = () => {
      setCurrent(purchases[index % purchases.length])
      setIsVisible(true)
      hideTimer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setCurrent(null), 300)
        setIndex((i) => i + 1)
      }, 4000)
    }

    const initial = setTimeout(show, 5000)
    const interval = setInterval(show, 18000)

    return () => {
      clearTimeout(initial)
      clearTimeout(hideTimer)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, index, isSuppressed])

  // Nothing real to show → render nothing. This is deliberate.
  if (isSuppressed || !current) return null

  const accent = accentFor(current.planName)

  const body = (
    <Card className="relative p-4 pr-10 bg-white border-2 shadow-2xl max-w-sm">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-r ${accent} flex items-center justify-center`}>
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{current.firstName}</p>

          <p className="text-xs text-gray-600 mb-1">
            purchased <span className="font-semibold text-gray-900">{shortName(current.planName)}</span>{" "}
            <span className="text-gray-500">{current.boughtAgo}</span>
          </p>

          {totalPurchases > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>
                {totalPurchases.toLocaleString("en-IN")} developer
                {totalPurchases === 1 ? "" : "s"} have bought a kit
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <>
      {/* Desktop — bottom left */}
      <div
        className={`fixed bottom-20 left-6 z-40 hidden sm:block transform transition-all duration-500 ease-out ${
          isVisible ? "translate-x-0 opacity-100 scale-100" : "-translate-x-full opacity-0 scale-95"
        }`}
      >
        {body}
      </div>

      {/* Mobile — bottom, full width */}
      <div
        className={`fixed bottom-4 left-4 right-4 z-40 sm:hidden transform transition-all duration-500 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {body}
      </div>
    </>
  )
}
