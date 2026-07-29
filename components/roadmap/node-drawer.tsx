"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    BookOpen, Lock, ExternalLink, Youtube, MessageSquareQuote, Hammer,
    Clock, CheckCircle2, CircleDashed, Circle, MinusCircle, ShoppingCart, Loader2,
} from "lucide-react"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ApiNode, ApiRef, ApiRoadmap, NodeStatus } from "./types"
import { TIER_LABEL, KIND_LABEL } from "./node-visuals"

/** The four markers a learner can put on a node, in cycle order. */
const STATUS_OPTIONS: { value: NodeStatus; label: string; icon: typeof Circle; className: string }[] = [
    { value: "pending", label: "Not started", icon: Circle, className: "text-muted-foreground" },
    { value: "learning", label: "Learning", icon: CircleDashed, className: "text-amber-600 dark:text-amber-400" },
    { value: "done", label: "Done", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
    { value: "skipped", label: "Skipping", icon: MinusCircle, className: "text-muted-foreground" },
]

function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "")
    } catch {
        return "link"
    }
}

function RefRow({ link }: { link: ApiRef }) {
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 rounded-lg border border-hairline bg-overlay px-3 py-2.5 transition-colors hover:bg-overlay-strong"
        >
            {link.videoId ? (
                <Youtube className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            ) : (
                <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1">
                <span className="block text-sm text-foreground group-hover:underline">{link.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                    {link.channel || link.source || hostOf(link.url)}
                </span>
            </span>
        </a>
    )
}

function Section({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof BookOpen
    title: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {title}
            </h3>
            {children}
        </section>
    )
}

export function NodeDrawer({
    roadmap,
    node,
    open,
    onOpenChange,
    onStatusChange,
    checkoutHref,
    isLoggedIn,
}: {
    roadmap: ApiRoadmap
    node: ApiNode | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusChange: (nodeId: string, status: NodeStatus) => void
    /** Where an unpurchased kit's "unlock" button goes. */
    checkoutHref: string
    isLoggedIn: boolean
}) {
    // Curated articles/videos live in a ~1900-line server-side table, so they
    // are fetched per open node rather than shipped with the roadmap payload.
    // Cached per node id for the life of the drawer instance.
    const [refs, setRefs] = useState<Record<string, { articles: ApiRef[]; videos: ApiRef[] }>>({})
    const [loadingRefs, setLoadingRefs] = useState(false)

    const nodeId = node?.id ?? null

    useEffect(() => {
        if (!open || !nodeId || refs[nodeId]) return
        let cancelled = false
        setLoadingRefs(true)
        fetch(`/api/roadmap/${roadmap.id}/${nodeId}/refs`)
            .then((r) => (r.ok ? r.json() : { articles: [], videos: [] }))
            .then((data) => {
                if (cancelled) return
                setRefs((prev) => ({
                    ...prev,
                    [nodeId]: { articles: data.articles || [], videos: data.videos || [] },
                }))
            })
            .catch(() => {
                if (!cancelled) setRefs((prev) => ({ ...prev, [nodeId]: { articles: [], videos: [] } }))
            })
            .finally(() => {
                if (!cancelled) setLoadingRefs(false)
            })
        return () => {
            cancelled = true
        }
    }, [open, nodeId, roadmap.id, refs])

    if (!node) return null

    const nodeRefs = refs[node.id]
    const lessons = node.lessons

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-hairline bg-overlay px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {TIER_LABEL[node.tier]}
                        </span>
                        {node.kind !== "core" && (
                            <span className="rounded-full border border-hairline bg-overlay px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {KIND_LABEL[node.kind]}
                            </span>
                        )}
                        {node.est && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {node.est}
                            </span>
                        )}
                    </div>
                    <SheetTitle className="text-left text-xl leading-tight">{node.title}</SheetTitle>
                    <SheetDescription className="text-left text-sm leading-relaxed">
                        {node.summary}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-7 px-4 pb-10">
                    {/* Progress markers */}
                    {isLoggedIn && (
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((option) => {
                                const Icon = option.icon
                                const active = node.status === option.value
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => onStatusChange(node.id, option.value)}
                                        aria-pressed={active}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                            active
                                                ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                                                : "border-hairline bg-overlay text-muted-foreground hover:bg-overlay-strong hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", active ? "" : option.className)} />
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Lessons in the kits */}
                    {lessons.length > 0 && (
                        <Section icon={BookOpen} title={`In your kit · ${lessons.length} lesson${lessons.length > 1 ? "s" : ""}`}>
                            <div className="space-y-2">
                                {lessons.map((lesson) =>
                                    lesson.canRead ? (
                                        <Link
                                            key={`${lesson.kitSlug}-${lesson.slug}`}
                                            href={`/learn/${lesson.kitSlug}/${lesson.slug}`}
                                            className="group flex items-start gap-2.5 rounded-lg border border-hairline bg-overlay px-3 py-2.5 transition-colors hover:bg-overlay-strong"
                                        >
                                            <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600 dark:text-violet-400" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm text-foreground group-hover:underline">
                                                    {lesson.title}
                                                </span>
                                                {lesson.kitSlug !== roadmap.kitSlug && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        from the {lesson.kitName}
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    ) : (
                                        <div
                                            key={`${lesson.kitSlug}-${lesson.slug}`}
                                            className="flex items-start gap-2.5 rounded-lg border border-dashed border-hairline bg-overlay/50 px-3 py-2.5"
                                        >
                                            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm text-muted-foreground">{lesson.title}</span>
                                                <span className="block text-xs text-muted-foreground/70">
                                                    {lesson.kitName} — locked
                                                </span>
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>

                            {node.hasLockedLesson && (
                                <Link href={checkoutHref} className="block pt-1">
                                    <Button size="sm" className="w-full gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Unlock the {roadmap.kitName}
                                    </Button>
                                </Link>
                            )}
                        </Section>
                    )}

                    {/* Free resources — authored links first, then curated per-topic ones. */}
                    {(node.external.length > 0 || loadingRefs || nodeRefs) && (
                        <Section icon={ExternalLink} title="Free resources">
                            <div className="space-y-2">
                                {node.external.map((link) => (
                                    <RefRow key={link.url} link={link} />
                                ))}
                                {nodeRefs?.articles
                                    .filter((a) => !node.external.some((e) => e.url === a.url))
                                    .map((link) => (
                                        <RefRow key={link.url} link={link} />
                                    ))}
                                {nodeRefs?.videos.map((link) => (
                                    <RefRow key={link.url} link={link} />
                                ))}
                                {loadingRefs && !nodeRefs && (
                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Finding articles and videos…
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Interview questions */}
                    {node.interview.length > 0 && (
                        <Section icon={MessageSquareQuote} title="You should be able to answer">
                            <ul className="space-y-2">
                                {node.interview.map((question) => (
                                    <li
                                        key={question}
                                        className="rounded-lg border-l-2 border-violet-500/50 bg-overlay py-2 pl-3 pr-3 text-sm leading-relaxed text-foreground"
                                    >
                                        {question}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Build task */}
                    {node.build && (
                        <Section icon={Hammer} title="Build it">
                            <p className="rounded-lg border border-hairline bg-overlay px-3 py-2.5 text-sm leading-relaxed text-foreground">
                                {node.build}
                            </p>
                        </Section>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
