"use client"

import { Map as MapIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { KitLogo, getKitLogo } from "@/components/kit-logo"

/**
 * The kit tile on a roadmap card / header.
 *
 * WHY THE LOGO DOES NOT SIT ON THE ACCENT GRADIENT
 * ------------------------------------------------
 * Each roadmap's accent is derived from its technology, and so is its logo — so
 * putting one on the other meant cyan React on a cyan tile, green Node on a
 * green tile, red Angular on a red tile. Every logo was washed out at 24px.
 *
 * Brand artwork therefore gets a neutral white plate (the surface every one of
 * these logos was drawn for, in both themes) and the gradient is kept for the
 * generic-icon fallback, where there is no brand colour to clash with.
 */
export function KitBadge({
    kitSlug,
    accent,
    className,
}: {
    /** Any kit key — slug, name, or plan name. Matched by `getKitLogo`. */
    kitSlug: string
    accent: { from: string; to: string }
    className?: string
}) {
    const hasLogo = !!getKitLogo(kitSlug)

    return (
        <div
            className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm",
                hasLogo
                    ? // Padding so a square logo (Angular, JS) does not bleed to the
                      // rounded edge the way an object-contain image otherwise would.
                      "border border-hairline bg-white p-1.5"
                    : cn("bg-gradient-to-br", accent.from, accent.to),
                className
            )}
        >
            <KitLogo
                nameKey={kitSlug}
                imgClassName="h-full w-full object-contain"
                fallback={<MapIcon className="h-5 w-5 text-white" />}
            />
        </div>
    )
}
