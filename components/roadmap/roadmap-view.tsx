"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    ZoomIn, ZoomOut, Maximize2, Map as MapIcon, List, Clock, Target,
    ChevronLeft, Loader2, Lock, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { KitBadge } from "./kit-badge"
import { layoutRoadmap, NODE_H, NODE_W, STAGE_H, STAGE_W } from "./layout"
import { NodeDrawer } from "./node-drawer"
import { NodeGlyphs, TIER_BAR, nodeSurfaceClass } from "./node-visuals"
import type { ApiNode, ApiRoadmap, NodeStatus } from "./types"

const MIN_SCALE = 0.35
const MAX_SCALE = 1.6
const ZOOM_STEP = 1.25

type ViewMode = "map" | "list"

/* ────────────────────────────────────────────────────────────────────────── */

function useRoadmapProgress(roadmap: ApiRoadmap | null, isLoggedIn: boolean) {
    // Node status is mirrored here so a tick is instant; the PUT reconciles.
    const [statuses, setStatuses] = useState<Record<string, NodeStatus>>({})

    useEffect(() => {
        // Clear on the way out, not just seed on the way in: node ids are only
        // unique WITHIN a roadmap (`forms` exists in both React and Angular), so
        // keeping the old map while the next roadmap loads would paint one frame
        // of the previous roadmap's ticks on the new one.
        if (!roadmap) {
            setStatuses({})
            return
        }
        const initial: Record<string, NodeStatus> = {}
        for (const stage of roadmap.stages) {
            for (const node of stage.nodes) initial[node.id] = node.status
        }
        setStatuses(initial)
    }, [roadmap])

    const setStatus = useCallback(
        (nodeId: string, status: NodeStatus) => {
            if (!roadmap || !isLoggedIn) return
            const previous = statuses[nodeId] ?? "pending"
            setStatuses((prev) => ({ ...prev, [nodeId]: status }))
            fetch("/api/roadmap/progress", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roadmapId: roadmap.id, nodeId, status }),
            })
                .then((r) => {
                    // Roll back rather than leave a tick that was never saved.
                    if (!r.ok) setStatuses((prev) => ({ ...prev, [nodeId]: previous }))
                })
                .catch(() => setStatuses((prev) => ({ ...prev, [nodeId]: previous })))
        },
        [roadmap, isLoggedIn, statuses]
    )

    return { statuses, setStatus }
}

/* ── Node card (shared by map and list) ──────────────────────────────────── */

function NodeCard({
    node,
    onOpen,
    onFocus,
    compact,
}: {
    node: ApiNode
    onOpen: () => void
    onFocus?: () => void
    compact?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            onFocus={onFocus}
            className={cn(
                "group relative flex h-full w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 shadow-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "hover:shadow-md",
                nodeSurfaceClass(node)
            )}
        >
            <span className={cn("absolute inset-y-0 left-0 w-1", TIER_BAR[node.tier])} aria-hidden />
            <span className="min-w-0 flex-1 pl-1.5">
                <span
                    className={cn(
                        "block text-sm font-medium leading-snug text-foreground line-clamp-2",
                        node.status === "skipped" && "line-through"
                    )}
                >
                    {node.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {node.est && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {node.est}
                        </span>
                    )}
                    {node.lessons.length > 0 && (
                        <span>
                            {node.lessons.length} lesson{node.lessons.length > 1 ? "s" : ""}
                        </span>
                    )}
                    {!compact && node.interview.length > 0 && <span>{node.interview.length} Qs</span>}
                </span>
            </span>
            <NodeGlyphs node={node} compact={compact} />
        </button>
    )
}

/* ── Map view ────────────────────────────────────────────────────────────── */

function MapCanvas({
    roadmap,
    onOpenNode,
}: {
    roadmap: ApiRoadmap
    onOpenNode: (node: ApiNode) => void
}) {
    const layout = useMemo(() => layoutRoadmap(roadmap), [roadmap])
    const containerRef = useRef<HTMLDivElement>(null)
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
    const [dragging, setDragging] = useState(false)
    const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
    // Mirrors `view` for the native wheel listener, which is registered once and
    // would otherwise close over a stale value.
    const viewRef = useRef(view)
    useEffect(() => {
        viewRef.current = view
    }, [view])

    /**
     * Keep the roadmap on screen. Without this you can drag the whole map into
     * the void and be left staring at an empty grid — the Fit button recovers,
     * but only if you work out that it will.
     *
     * An axis whose content is smaller than the viewport is centred; otherwise
     * the pan is bounded so an edge can reach, but not pass, the viewport edge.
     */
    const clamp = useCallback(
        (v: { x: number; y: number; scale: number }) => {
            const el = containerRef.current
            if (!el) return v
            const axis = (content: number, viewport: number, pos: number) =>
                content <= viewport
                    ? (viewport - content) / 2
                    : Math.min(0, Math.max(viewport - content, pos))
            return {
                scale: v.scale,
                x: axis(layout.width * v.scale, el.clientWidth, v.x),
                y: axis(layout.height * v.scale, el.clientHeight, v.y),
            }
        },
        [layout.width, layout.height]
    )

    /** Scale that fits the roadmap's width, capped at 1:1 so it never blows up. */
    const fitScale = useCallback(() => {
        const el = containerRef.current
        if (!el) return 1
        return Math.min(1, Math.max(MIN_SCALE, el.clientWidth / layout.width))
    }, [layout.width])

    const resetView = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const scale = fitScale()
        setView(clamp({ x: (el.clientWidth - layout.width * scale) / 2, y: 0, scale }))
    }, [fitScale, layout.width, clamp])

    // Fit on first paint and whenever the roadmap changes.
    useEffect(() => {
        resetView()
    }, [resetView])

    const zoomBy = useCallback(
        (factor: number, originX?: number, originY?: number) => {
            const el = containerRef.current
            if (!el) return
            setView((prev) => {
                const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor))
                if (next === prev.scale) return prev
                // Keep the point under the cursor (or the viewport centre) fixed.
                const px = originX ?? el.clientWidth / 2
                const py = originY ?? el.clientHeight / 2
                const ratio = next / prev.scale
                return clamp({
                    scale: next,
                    x: px - (px - prev.x) * ratio,
                    y: py - (py - prev.y) * ratio,
                })
            })
        },
        [clamp]
    )

    // Wheel must be a non-passive native listener: React's onWheel cannot
    // preventDefault, so ctrl+wheel would zoom the whole page instead.
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const rect = el.getBoundingClientRect()
                zoomBy(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, e.clientX - rect.left, e.clientY - rect.top)
                return
            }
            // Only swallow the scroll if the map can actually move — otherwise a
            // canvas at its bottom edge would trap the wheel and the page under
            // it could never be scrolled past.
            const current = viewRef.current
            const next = clamp({
                scale: current.scale,
                x: current.x - e.deltaX,
                y: current.y - e.deltaY,
            })
            if (next.x === current.x && next.y === current.y) return
            e.preventDefault()
            setView(next)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [zoomBy, clamp])

    const onPointerDown = (e: React.PointerEvent) => {
        // Only pan from the background — a press on a node is a click.
        if ((e.target as HTMLElement).closest("[data-roadmap-node]")) return
        drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
        setDragging(true)
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (!drag.current) return
        setView((prev) =>
            clamp({
                scale: prev.scale,
                x: drag.current!.vx + (e.clientX - drag.current!.x),
                y: drag.current!.vy + (e.clientY - drag.current!.y),
            })
        )
    }

    const endDrag = (e: React.PointerEvent) => {
        if (!drag.current) return
        drag.current = null
        setDragging(false)
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    }

    /**
     * Tabbing through nodes must move the canvas, or focus lands off-screen —
     * the nodes are laid out by transform, so the browser cannot scroll to them.
     */
    const revealNode = useCallback((x: number, y: number, w: number, h: number) => {
        const el = containerRef.current
        if (!el) return
        setView((prev) => {
            const left = x * prev.scale + prev.x
            const top = y * prev.scale + prev.y
            const right = left + w * prev.scale
            const bottom = top + h * prev.scale
            const margin = 40
            let { x: nx, y: ny } = prev
            if (left < margin) nx += margin - left
            if (right > el.clientWidth - margin) nx -= right - (el.clientWidth - margin)
            if (top < margin) ny += margin - top
            if (bottom > el.clientHeight - margin) ny -= bottom - (el.clientHeight - margin)
            return clamp({ scale: prev.scale, x: nx, y: ny })
        })
    }, [clamp])

    return (
        <div className="relative">
            <div
                ref={containerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                    "relative h-[68vh] min-h-[440px] touch-none overflow-hidden rounded-2xl border border-hairline",
                    "bg-[radial-gradient(circle_at_1px_1px,var(--roadmap-dot)_1px,transparent_0)] [background-size:24px_24px]",
                    dragging ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{ ["--roadmap-dot" as string]: "color-mix(in oklab, var(--muted-foreground) 22%, transparent)" }}
            >
                <div
                    className="absolute left-0 top-0 origin-top-left"
                    style={{
                        width: layout.width,
                        height: layout.height,
                        transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    }}
                >
                    {/* Connectors */}
                    <svg
                        width={layout.width}
                        height={layout.height}
                        className="pointer-events-none absolute left-0 top-0"
                        aria-hidden
                    >
                        <g fill="none" strokeLinecap="round">
                            {layout.spine.map((d, i) => (
                                <path key={`spine-${i}`} d={d} className="stroke-violet-500/40" strokeWidth={3} />
                            ))}
                            {layout.branches.map((d, i) => (
                                <path key={`branch-${i}`} d={d} className="stroke-border" strokeWidth={2} />
                            ))}
                            {layout.stubs.map((d, i) => (
                                <path key={`stub-${i}`} d={d} className="stroke-border" strokeWidth={2} />
                            ))}
                        </g>
                    </svg>

                    {/* Stage capsules */}
                    {layout.stages.map(({ stage, index, x, y }) => (
                        <div
                            key={stage.id}
                            className="absolute flex flex-col justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 to-purple-600/10 px-4 shadow-sm"
                            style={{ left: x, top: y, width: STAGE_W, height: STAGE_H }}
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                                Stage {index + 1}
                            </span>
                            <span className="truncate text-sm font-bold text-foreground">{stage.title}</span>
                            <span className="truncate text-[11px] text-muted-foreground">{stage.goal}</span>
                        </div>
                    ))}

                    {/* Nodes */}
                    {layout.nodes.map(({ node, x, y }) => (
                        <div
                            key={node.id}
                            data-roadmap-node
                            className="absolute"
                            style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
                        >
                            <NodeCard
                                node={node}
                                compact
                                onOpen={() => onOpenNode(node)}
                                onFocus={() => revealNode(x, y, NODE_W, NODE_H)}
                            />
                        </div>
                    ))}
                </div>

                {/* Zoom controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-xl border border-hairline bg-card/90 p-1 shadow-lg backdrop-blur">
                    <button
                        onClick={() => zoomBy(ZOOM_STEP)}
                        aria-label="Zoom in"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => zoomBy(1 / ZOOM_STEP)}
                        aria-label="Zoom out"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                        onClick={resetView}
                        aria-label="Fit to screen"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                </div>

                <p className="pointer-events-none absolute bottom-4 left-4 hidden rounded-full border border-hairline bg-card/85 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur sm:block">
                    Drag to pan · scroll to move · ⌘/Ctrl + scroll to zoom
                </p>
            </div>
        </div>
    )
}

/* ── List view ───────────────────────────────────────────────────────────── */

function ListView({
    roadmap,
    onOpenNode,
}: {
    roadmap: ApiRoadmap
    onOpenNode: (node: ApiNode) => void
}) {
    return (
        <ol className="space-y-8">
            {roadmap.stages.map((stage, index) => {
                const done = stage.nodes.filter((n) => n.status === "done").length
                return (
                    <li key={stage.id} className="relative pl-6 sm:pl-8">
                        {/* Stage rail */}
                        <span
                            className="absolute bottom-0 left-[9px] top-8 w-0.5 bg-gradient-to-b from-violet-500/40 to-transparent sm:left-[13px]"
                            aria-hidden
                        />
                        <span
                            className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white sm:h-7 sm:w-7 sm:text-xs"
                            aria-hidden
                        >
                            {index + 1}
                        </span>
                        <div className="mb-3">
                            <h3 className="text-base font-bold text-foreground">{stage.title}</h3>
                            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                <Target className="h-3 w-3" />
                                {stage.goal}
                                <span className="text-muted-foreground/60">
                                    · {done}/{stage.nodes.length} done
                                </span>
                            </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {stage.nodes.map((node) => (
                                <div key={node.id} style={{ height: NODE_H }}>
                                    <NodeCard node={node} onOpen={() => onOpenNode(node)} />
                                </div>
                            ))}
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

/* ── The whole thing ─────────────────────────────────────────────────────── */

export function RoadmapView({
    roadmapId,
    checkoutHref,
    onBack,
}: {
    roadmapId: string
    /** Where the drawer's "unlock this kit" button points. */
    checkoutHref: string
    onBack: () => void
}) {
    const [data, setData] = useState<{ roadmap: ApiRoadmap; isLoggedIn: boolean } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<ViewMode>("map")
    const [openNodeId, setOpenNodeId] = useState<string | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => {
        let cancelled = false
        setData(null)
        setError(null)
        fetch(`/api/roadmap/${roadmapId}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
            .then((json) => {
                if (!cancelled) setData(json)
            })
            .catch(() => {
                if (!cancelled) setError("We could not load this roadmap. Please try again.")
            })
        return () => {
            cancelled = true
        }
    }, [roadmapId])

    // A 1600px-wide canvas is unusable on a phone; start those users in the list.
    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
            setMode("list")
        }
    }, [])

    const { statuses, setStatus } = useRoadmapProgress(data?.roadmap ?? null, data?.isLoggedIn ?? false)

    // Overlay live statuses onto the fetched roadmap so both views and the
    // drawer read from one object.
    const roadmap = useMemo(() => {
        if (!data) return null
        return {
            ...data.roadmap,
            stages: data.roadmap.stages.map((stage) => ({
                ...stage,
                nodes: stage.nodes.map((node) => ({ ...node, status: statuses[node.id] ?? node.status })),
            })),
        }
    }, [data, statuses])

    const openNode = useMemo(() => {
        if (!roadmap || !openNodeId) return null
        for (const stage of roadmap.stages) {
            const found = stage.nodes.find((n) => n.id === openNodeId)
            if (found) return found
        }
        return null
    }, [roadmap, openNodeId])

    const totals = useMemo(() => {
        if (!roadmap) return { total: 0, done: 0 }
        const all = roadmap.stages.flatMap((s) => s.nodes)
        return { total: all.length, done: all.filter((n) => n.status === "done").length }
    }, [roadmap])

    if (error) {
        return (
            <div className="space-y-4">
                <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" /> All roadmaps
                </button>
                <p className="rounded-xl border border-hairline bg-card p-6 text-sm text-muted-foreground">{error}</p>
            </div>
        )
    }

    if (!roadmap) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading roadmap…
            </div>
        )
    }

    const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0

    const handleOpenNode = (node: ApiNode) => {
        setOpenNodeId(node.id)
        setDrawerOpen(true)
    }

    return (
        <div className="space-y-5">
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ChevronLeft className="h-4 w-4" /> All roadmaps
            </button>

            {/* Header */}
            <div className="rounded-2xl border border-hairline bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <KitBadge kitSlug={roadmap.kitSlug} accent={roadmap.accent} />
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold leading-tight text-foreground">{roadmap.title}</h2>
                            <p className="text-sm text-muted-foreground">{roadmap.tagline}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{totals.total} topics</span>
                                <span>{roadmap.stages.length} stages</span>
                                <span>~{roadmap.weeks} weeks</span>
                                {!roadmap.hasAccess && (
                                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                        <Lock className="h-3 w-3" /> preview — first chapter unlocked
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {data?.isLoggedIn && (
                            <div className="hidden sm:block">
                                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    {totals.done}/{totals.total} done
                                </div>
                                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-overlay-strong">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex rounded-lg border border-hairline bg-overlay p-0.5">
                            {(["map", "list"] as ViewMode[]).map((m) => {
                                const Icon = m === "map" ? MapIcon : List
                                return (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        aria-pressed={mode === m}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                                            mode === m
                                                ? "bg-card text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {m}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-1 rounded-full bg-sky-500" /> Beginner
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-1 rounded-full bg-violet-500" /> Intermediate
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-1 rounded-full bg-rose-500" /> Advanced
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-4 rounded border border-dashed border-muted-foreground/60" /> Optional
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3" /> Has locked lessons
                    </span>
                </div>
            </div>

            {mode === "map" ? (
                <MapCanvas roadmap={roadmap} onOpenNode={handleOpenNode} />
            ) : (
                <ListView roadmap={roadmap} onOpenNode={handleOpenNode} />
            )}

            <NodeDrawer
                roadmap={roadmap}
                node={openNode}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onStatusChange={setStatus}
                checkoutHref={checkoutHref}
                isLoggedIn={data?.isLoggedIn ?? false}
            />
        </div>
    )
}
