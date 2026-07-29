"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Clock, Layers, CheckCircle2, Lock, ArrowRight } from "lucide-react"
import { getCheckoutPathForKit } from "@/lib/checkout-paths"
import { KitBadge } from "@/components/roadmap/kit-badge"
import { RoadmapView } from "@/components/roadmap/roadmap-view"
import type { ApiRoadmapSummary } from "@/components/roadmap/types"

/**
 * The Roadmap section of the dashboard.
 *
 * Two screens: a picker of every roadmap, and the roadmap itself. Which one is
 * showing is driven by the `r` query param so a roadmap is linkable and the
 * browser Back button works — the dashboard already routes its tabs this way.
 *
 * Every roadmap is browsable by every user, bought or not. Only the LESSONS a
 * node links to are gated (see /api/roadmap/[roadmapId]); a preview user sees
 * the whole map with locks on the paid lessons and an unlock CTA in the drawer.
 */
export function RoadmapTab({
    selectedId,
    onSelect,
}: {
    /** Roadmap id from the URL, or null for the picker. */
    selectedId: string | null
    onSelect: (id: string | null) => void
}) {
    const [roadmaps, setRoadmaps] = useState<ApiRoadmapSummary[] | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        let cancelled = false
        fetch("/api/roadmap")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
            .then((json) => {
                if (!cancelled) setRoadmaps(json.roadmaps || [])
            })
            .catch(() => {
                if (!cancelled) setError(true)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const back = useCallback(() => onSelect(null), [onSelect])

    if (selectedId) {
        const summary = roadmaps?.find((r) => r.id === selectedId)
        return (
            <RoadmapView
                roadmapId={selectedId}
                checkoutHref={getCheckoutPathForKit(summary?.kitSlug ?? selectedId)}
                onBack={back}
            />
        )
    }

    if (error) {
        return (
            <p className="rounded-xl border border-hairline bg-card p-6 text-sm text-muted-foreground">
                We could not load the roadmaps. Please refresh the page.
            </p>
        )
    }

    if (!roadmaps) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading roadmaps…
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-foreground">Interview roadmaps</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    A study order for each kit — what to learn, in what sequence, with the lessons,
                    free resources and interview questions attached to every step. Click any node to
                    open it.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {roadmaps.map((roadmap) => {
                    const pct = roadmap.nodeCount
                        ? Math.round((roadmap.doneCount / roadmap.nodeCount) * 100)
                        : 0
                    return (
                        <button
                            key={roadmap.id}
                            onClick={() => onSelect(roadmap.id)}
                            className="group flex flex-col rounded-2xl border border-hairline bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                            <div className="flex items-start gap-3">
                                <KitBadge kitSlug={roadmap.kitSlug} accent={roadmap.accent} />
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold leading-snug text-foreground">
                                        {roadmap.title}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{roadmap.tagline}</p>
                                </div>
                                {!roadmap.hasAccess && (
                                    <Lock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
                                )}
                            </div>

                            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                {roadmap.audience}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    {roadmap.nodeCount} topics
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />~{roadmap.weeks} weeks
                                </span>
                                {roadmap.doneCount > 0 && (
                                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {roadmap.doneCount} done
                                    </span>
                                )}
                            </div>

                            {roadmap.doneCount > 0 && (
                                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-overlay-strong">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            )}

                            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-400">
                                Open roadmap
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
