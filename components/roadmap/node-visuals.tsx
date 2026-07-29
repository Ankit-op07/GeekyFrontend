"use client"

import { CheckCircle2, CircleDashed, Circle, MinusCircle, Lock, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApiNode, NodeKind, NodeStatus, NodeTier } from "./types"

/**
 * The one place a node's status/tier/kind turns into pixels, shared by the map
 * canvas and the list view so the two cannot drift apart.
 */

export const TIER_LABEL: Record<NodeTier, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
}

export const KIND_LABEL: Record<NodeKind, string> = {
    core: "Core",
    optional: "Optional",
    practice: "Practice",
}

/** Left accent bar — encodes tier. Deliberately not the same hue as status. */
export const TIER_BAR: Record<NodeTier, string> = {
    beginner: "bg-sky-500",
    intermediate: "bg-violet-500",
    advanced: "bg-rose-500",
}

export const STATUS_ICON: Record<NodeStatus, typeof Circle> = {
    pending: Circle,
    learning: CircleDashed,
    done: CheckCircle2,
    skipped: MinusCircle,
}

export const STATUS_ICON_CLASS: Record<NodeStatus, string> = {
    pending: "text-muted-foreground/50",
    learning: "text-amber-600 dark:text-amber-400",
    done: "text-emerald-600 dark:text-emerald-400",
    skipped: "text-muted-foreground/40",
}

/** Card chrome for a node in a given state. */
export function nodeSurfaceClass(node: ApiNode): string {
    return cn(
        "border bg-card text-left transition-all duration-150",
        node.kind === "optional" ? "border-dashed" : "border-solid",
        node.status === "done" && "border-emerald-500/50 bg-emerald-500/5",
        node.status === "learning" && "border-amber-500/50 bg-amber-500/5",
        node.status === "skipped" && "border-hairline opacity-60",
        node.status === "pending" && "border-hairline hover:border-violet-500/50"
    )
}

/** The status dot + optional lock/practice glyphs shown on a node card. */
export function NodeGlyphs({ node, compact = false }: { node: ApiNode; compact?: boolean }) {
    const Icon = STATUS_ICON[node.status]
    return (
        <span className="flex flex-shrink-0 items-center gap-1.5">
            {node.kind === "practice" && (
                <Hammer className={cn("text-violet-600 dark:text-violet-400", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            )}
            {node.hasLockedLesson && (
                <Lock className={cn("text-muted-foreground/60", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            )}
            <Icon className={cn(STATUS_ICON_CLASS[node.status], compact ? "h-4 w-4" : "h-[18px] w-[18px]")} />
        </span>
    )
}
