"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Loading placeholders for the dashboard, shaped like the content they stand in
 * for so the layout doesn't jump when data lands.
 *
 * WHY THESE EXIST
 * ---------------
 * Several dashboard surfaces fetched on mount with no loading flag, so their
 * "you have nothing" empty state was the FIRST thing every user saw: the
 * Overview greeted returning buyers with "No kits yet" and a Browse Kits button
 * for as long as /api/learn/kits took to answer. An empty state is a claim
 * about the user's account — it must not be shown before the answer is known.
 *
 * Where a loading flag did exist, it rendered a centred spinner, which says
 * nothing about what is coming and collapses the page height to nothing.
 *
 * `bg-overlay*` rather than the primitive's default `bg-accent`: these sit on
 * the dashboard's card/glass surfaces, and those are the tokens the rest of
 * that layer uses in both themes (see CLAUDE.md → Theming).
 */

/** One kit card — the Overview "Active Kits" and My Kits grids. Not exported:
 *  callers want a whole section, which is `KitGridSkeleton`. */
function KitCardSkeleton() {
    return (
        <div className="rounded-2xl border border-hairline bg-card p-5">
            <div className="mb-3 flex items-start gap-3.5">
                <Skeleton className="h-11 w-11 flex-shrink-0 rounded-xl bg-overlay-strong" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3 bg-overlay-strong" />
                    <Skeleton className="h-3 w-1/3 bg-overlay" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full bg-overlay" />
            </div>
            <Skeleton className="mb-3 h-3 w-full bg-overlay" />
            <Skeleton className="h-3 w-28 bg-overlay" />
        </div>
    )
}

/** A titled section of kit cards, matching the real heading + grid. */
export function KitGridSkeleton({ count = 2, withHeader = true }: { count?: number; withHeader?: boolean }) {
    return (
        <div>
            {withHeader && (
                <div className="mb-5 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg bg-overlay-strong" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36 bg-overlay-strong" />
                        <Skeleton className="h-3 w-52 bg-overlay" />
                    </div>
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: count }, (_, i) => (
                    <KitCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

/** One roadmap picker card. */
export function RoadmapCardSkeleton() {
    return (
        <div className="flex flex-col rounded-2xl border border-hairline bg-card p-5">
            <div className="flex items-start gap-3">
                <Skeleton className="h-11 w-11 flex-shrink-0 rounded-xl bg-overlay-strong" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5 bg-overlay-strong" />
                    <Skeleton className="h-3 w-3/5 bg-overlay" />
                </div>
            </div>
            <Skeleton className="mt-3 h-3 w-full bg-overlay" />
            <div className="mt-4 flex gap-3">
                <Skeleton className="h-3 w-20 bg-overlay" />
                <Skeleton className="h-3 w-20 bg-overlay" />
            </div>
            <Skeleton className="mt-4 h-3 w-28 bg-overlay" />
        </div>
    )
}

/** Generic list of rows — bookmarks, leaderboard, company questions. */
export function RowListSkeleton({ count = 5, className }: { count?: number; className?: string }) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-hairline bg-card p-4">
                    <Skeleton className="h-9 w-9 flex-shrink-0 rounded-lg bg-overlay-strong" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2 bg-overlay-strong" />
                        <Skeleton className="h-3 w-1/4 bg-overlay" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full bg-overlay" />
                </div>
            ))}
        </div>
    )
}

/** A row of stat tiles. */
export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="rounded-2xl border border-hairline bg-card p-4">
                    <Skeleton className="h-8 w-8 rounded-lg bg-overlay-strong" />
                    <Skeleton className="mt-3 h-6 w-16 bg-overlay-strong" />
                    <Skeleton className="mt-2 h-3 w-24 bg-overlay" />
                </div>
            ))}
        </div>
    )
}
