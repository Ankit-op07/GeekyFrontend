"use client"

/**
 * ─── Bundle upsell ─────────────────────────────────────────────────────────
 *
 *  Shown at moments of peak intent — when someone has just finished a kit, or
 *  is looking at the kits they own. It quotes the bundle with THIS user's
 *  credit already applied, so the ask reads as "your ₹149 counts toward this"
 *  rather than "give us ₹499 more".
 *
 *  ⚠️  Copy must never claim the bundle includes the coming-soon kits (Node,
 *  Experiences). It grants JS + React + Frontend System Design. PRD-001 §3.1.
 *
 *  Renders nothing if the user already owns the bundle, or if the quote fails.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Check } from "lucide-react"
import { BUNDLE_KIT_ID, getKitById } from "@/lib/appConstants"

interface PriceQuote {
  listPrice: number
  credit: number
  payable: number
  alreadyOwned: boolean
}

interface BundleUpsellProps {
  /** Optional context line, e.g. "You just finished the JS Kit." */
  eyebrow?: string
  /** "dark" matches the dashboard's slate theme; "light" matches marketing pages. */
  tone?: "light" | "dark"
  className?: string
}

export function BundleUpsell({ eyebrow, tone = "light", className }: BundleUpsellProps) {
  const [quote, setQuote] = useState<PriceQuote | null>(null)

  useEffect(() => {
    fetch(`/api/payment/quote?kit=${BUNDLE_KIT_ID}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setQuote)
      .catch(() => setQuote(null))
  }, [])

  // Nothing to sell, or we couldn't price it → render nothing.
  if (!quote || quote.alreadyOwned) return null

  const hasCredit = quote.credit > 0
  // Honest anchor: the real sum of the three kits (₹647), from the catalog.
  const bundleAnchor = getKitById(BUNDLE_KIT_ID)?.originalPrice ?? quote.listPrice

  const dark = tone === "dark"
  const shell = dark
    ? "border-violet-500/25 bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-950"
    : "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-pink-50"
  // The "dark" tone shell is a hardcoded dark violet gradient in BOTH themes, so
  // its text must stay light literals (theme tokens would go dark in light mode
  // and vanish on the dark card). "light" tone inherits the themed card colours.
  const muted = dark ? "text-slate-300" : "text-muted-foreground"
  const heading = dark ? "text-white" : ""
  const strike = dark ? "text-slate-400" : "text-muted-foreground"
  const creditText = dark ? "text-emerald-400" : "text-green-700"

  return (
    <Card className={`relative overflow-hidden p-5 md:p-6 border-2 ${shell} ${className ?? ""}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">BEST VALUE</Badge>
            {hasCredit && (
              <span className={`text-xs font-medium ${creditText} flex items-center gap-1`}>
                <Sparkles className="w-3 h-3" />
                ₹{quote.credit} credit applied
              </span>
            )}
          </div>

          {eyebrow && <p className={`text-sm ${muted} mb-1`}>{eyebrow}</p>}

          <h3 className={`text-lg font-bold mb-1 ${heading}`}>Get the Complete Kit — all 3 kits</h3>
          <p className={`text-sm ${muted} mb-3`}>
            JavaScript + React + Frontend System Design. One price, lifetime access.
          </p>

          <ul className={`grid sm:grid-cols-3 gap-1.5 text-xs ${muted}`}>
            {["JS Interview Kit", "React Interview Kit", "Frontend System Design Kit"].map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                {k}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:text-right shrink-0">
          <div className="flex md:justify-end items-baseline gap-2 mb-1">
            {hasCredit && <span className={`text-sm line-through ${strike}`}>₹{quote.listPrice}</span>}
            <span className={`text-3xl font-bold ${heading}`}>₹{quote.payable}</span>
          </div>

          {hasCredit ? (
            <p className={`text-xs ${creditText} mb-3 max-w-[15rem] md:ml-auto`}>
              What you've already spent comes straight off. You never pay twice.
            </p>
          ) : (
            <p className={`text-xs ${muted} mb-3`}>Worth ₹{bundleAnchor} separately</p>
          )}

          <Button asChild className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
            <Link href={`/pay?kit=${BUNDLE_KIT_ID}`}>
              Upgrade for ₹{quote.payable}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
