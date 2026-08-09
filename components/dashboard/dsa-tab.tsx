"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
    Check,
    ChevronDown,
    ExternalLink,
    FolderOpen,
    NotebookPen,
    Pencil,
    Star,
    Search,
    Sparkles,
    Trash2,
    Trophy,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { DsaNoteEditor } from "@/components/dsa/note-editor"
import { DsaListPicker, EmptyListsHint, type DsaListDto } from "@/components/dashboard/dsa-list-picker"

/* ── Wire shapes (mirror /api/dsa) ────────────────────────────────────────── */

interface ApiProblem {
    id: string
    title: string
    difficulty: "Easy" | "Medium" | "Hard"
    platform: string
    externalUrl: string
    tags: string[]
    companies: string[]
    youtubeVideoId: string | null
    hasApproach: boolean
}

interface ApiSection {
    id: string
    title: string
    blurb: string
    goal: string
    est: string
    accent: { from: string; to: string }
    youtubeVideoId: string | null
    problems: ApiProblem[]
}

interface ProblemState {
    status?: "attempted" | "solved"
    favourite?: boolean
    solvedAt?: string
    attemptedAt?: string
}

type ProgressMap = Record<string, ProblemState>

type StatusFilter = "all" | "solved" | "unsolved" | "favourites"

/**
 * Section accent bars, as WHOLE literal class strings keyed by section id.
 *
 * Not built from `section.accent` with a template literal: Tailwind scans source
 * text, so `from-${accent.from}` produces a class that exists at runtime and was
 * never compiled into the stylesheet — the bar silently renders transparent.
 * The authored `accent` still drives the public /dsa pages (which are server
 * components and can safely inline a style attribute); here it needs to be
 * something the compiler can see.
 */
const SECTION_BAR: Record<string, string> = {
    "arrays-hashing": "from-violet-500 to-purple-500",
    "two-pointers": "from-cyan-500 to-blue-500",
    "sliding-window": "from-emerald-500 to-teal-500",
    stack: "from-amber-500 to-orange-500",
    "binary-search": "from-sky-500 to-indigo-500",
    "linked-list": "from-rose-500 to-pink-500",
    trees: "from-green-500 to-emerald-500",
    tries: "from-fuchsia-500 to-purple-500",
    heap: "from-orange-500 to-red-500",
    backtracking: "from-purple-500 to-violet-500",
    graphs: "from-blue-500 to-cyan-500",
    "dp-1d": "from-indigo-500 to-blue-500",
    "dp-2d": "from-violet-500 to-indigo-500",
    greedy: "from-lime-500 to-green-500",
    intervals: "from-teal-500 to-cyan-500",
    "bit-manipulation": "from-slate-500 to-zinc-500",
    "math-geometry": "from-amber-500 to-yellow-500",
}

const DIFFICULTY_STYLES: Record<ApiProblem["difficulty"], string> = {
    // Light-shade accent text carries a dark: variant so it keeps contrast on
    // the light dashboard surface — see the theming note in CLAUDE.md.
    Easy: "text-emerald-700 dark:text-emerald-400",
    Medium: "text-amber-700 dark:text-amber-400",
    Hard: "text-rose-700 dark:text-rose-400",
}

/**
 * The DSA section of the dashboard — the tracker half of the feature.
 *
 * The catalogue itself is authored code (lib/dsa) and is also published as
 * public pages under /dsa; this component is what turns it into YOUR sheet:
 * what you have solved, what you starred, what you wrote down.
 *
 * State model, and it matters for how this reads: `progress` is the single
 * source of truth for every tick and is updated OPTIMISTICALLY on click, then
 * reconciled with whatever the server returns. A checkbox that waits for a
 * round trip before filling in feels broken on a slow connection, and this is a
 * list people click through twenty at a time.
 */
export function DsaTab() {
    const [sections, setSections] = useState<ApiSection[] | null>(null)
    const [progress, setProgress] = useState<ProgressMap>({})
    const [canTrack, setCanTrack] = useState(false)
    const [error, setError] = useState(false)

    const [query, setQuery] = useState("")
    const [difficulty, setDifficulty] = useState<"all" | ApiProblem["difficulty"]>("all")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [openSections, setOpenSections] = useState<Set<string>>(new Set())

    const [noteFor, setNoteFor] = useState<ApiProblem | null>(null)

    /**
     * The learner's own collections, and which one is being browsed.
     *
     * Held as the FULL list objects including their membership arrays, not as
     * counts: the row-level picker needs "is this problem in that list?" for
     * every visible row, and the filter needs the whole membership set. Both
     * are answered from this one fetch, and 30 lists x 155 ids is a few
     * kilobytes.
     */
    const [lists, setLists] = useState<DsaListDto[]>([])
    const [listFilter, setListFilter] = useState<string | null>(null)

    /**
     * `?tab=dsa&section=<id>` — where an approach page sends you "back" to.
     *
     * Read once into a plain string rather than depended on as an object:
     * useSearchParams returns a new instance on every render, so using it
     * directly as an effect dependency re-runs the fetch on every keystroke in
     * the search box.
     */
    const requestedSection = useSearchParams().get("section")

    useEffect(() => {
        let cancelled = false
        fetch("/api/dsa")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
            .then((json) => {
                if (cancelled) return
                setSections(json.sections || [])
                setProgress(json.progress || {})
                setCanTrack(Boolean(json.canTrack))

                const all: ApiSection[] = json.sections || []

                // Arriving from an approach page: open the section you came from
                // and scroll it into view, so "back" lands where you left rather
                // than at the top of a 17-section list.
                if (requestedSection && all.some((s) => s.id === requestedSection)) {
                    setOpenSections(new Set([requestedSection]))
                    // After paint — the section only exists in the DOM once
                    // `sections` has rendered.
                    requestAnimationFrame(() => {
                        document
                            .getElementById(`dsa-section-${requestedSection}`)
                            ?.scrollIntoView({ block: "start" })
                    })
                    return
                }

                // Otherwise open the first section that still has unsolved
                // problems, so a returning learner lands on where they left off
                // rather than on a wall of collapsed headers.
                const done: ProgressMap = json.progress || {}
                const next = all.find((s) =>
                    s.problems.some((p) => done[p.id]?.status !== "solved")
                )
                if (next) setOpenSections(new Set([next.id]))
            })
            .catch(() => {
                if (!cancelled) setError(true)
            })
        return () => {
            cancelled = true
        }
        // Deliberately keyed on the section string only: it is the one input that
        // should re-target the view, and it changes at most once per arrival.
    }, [requestedSection])

    // Lists are fetched separately from the sheet: a signed-out visitor gets a
    // 401 here, which is a normal state rather than a failure, and it must not
    // take the catalogue down with it.
    useEffect(() => {
        let cancelled = false
        fetch("/api/dsa/lists")
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                if (!cancelled && json) setLists(json.lists || [])
            })
            .catch(() => {
                /* no lists is a valid state; the rest of the tab is unaffected */
            })
        return () => {
            cancelled = true
        }
    }, [])

    /**
     * Add or remove one problem from one list.
     *
     * Optimistic like the ticks, and for the same reason — this is clicked while
     * scanning, not while waiting. On failure the previous membership is put
     * back rather than left in a state the server disagrees with.
     */
    const toggleListMembership = useCallback(
        async (listId: string, problemId: string, member: boolean): Promise<boolean> => {
            const previous = lists
            setLists((current) =>
                current.map((l) =>
                    l.id !== listId
                        ? l
                        : {
                              ...l,
                              problemIds: member
                                  ? [...l.problemIds, problemId]
                                  : l.problemIds.filter((id) => id !== problemId),
                          }
                )
            )
            try {
                const res = await fetch(`/api/dsa/lists/${listId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ problemId, member }),
                })
                if (!res.ok) throw new Error("failed")
                const json = await res.json()
                // The server response is authoritative — $addToSet means a
                // double-add is a no-op there but would have duplicated locally.
                setLists((current) =>
                    current.map((l) => (l.id === listId ? json.list : l))
                )
                return true
            } catch {
                setLists(previous)
                return false
            }
        },
        [lists]
    )

    /** Create a list and immediately file the problem into it. Returns an error
     *  message for the picker to show, or null on success. */
    const createListWith = useCallback(
        async (name: string, problemId: string): Promise<string | null> => {
            try {
                const res = await fetch("/api/dsa/lists", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                })
                const json = await res.json().catch(() => null)
                if (!res.ok) return json?.error || "Could not create the list"

                const created: DsaListDto = json.list
                setLists((current) => [...current, created])
                // Creating a list from a problem's picker means "put this in it" —
                // making the user tick the box they just implied would be silly.
                await toggleListMembership(created.id, problemId, true)
                return null
            } catch {
                return "Could not create the list"
            }
        },
        [toggleListMembership]
    )

    const renameList = useCallback(async (listId: string, name: string) => {
        const res = await fetch(`/api/dsa/lists/${listId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) return json?.error || "Could not rename the list"
        setLists((current) => current.map((l) => (l.id === listId ? json.list : l)))
        return null
    }, [])

    const deleteList = useCallback(
        async (listId: string) => {
            const res = await fetch(`/api/dsa/lists/${listId}`, { method: "DELETE" })
            if (!res.ok) return
            setLists((current) => current.filter((l) => l.id !== listId))
            // Stop filtering by a list that no longer exists, or the sheet would
            // render permanently empty with no obvious way out.
            setListFilter((current) => (current === listId ? null : current))
        },
        []
    )

    /**
     * Persist one tick. Optimistic: apply locally, fire the request, and on
     * failure put the previous value back.
     *
     * The server is still the authority — its response replaces the whole map,
     * which is how the no-downgrade rule (opening a solved problem must not
     * mark it merely attempted) becomes visible in the UI even though the
     * client happily asked for the downgrade.
     */
    const save = useCallback(
        async (problemId: string, patch: { status?: "pending" | "attempted" | "solved"; favourite?: boolean }) => {
            if (!canTrack) return
            const previous = progress

            setProgress((current) => {
                const next = { ...current }
                if (patch.status === "pending") {
                    delete next[problemId]
                    return next
                }
                const entry = { ...(next[problemId] || {}) }
                if (patch.status) entry.status = patch.status
                if (patch.favourite !== undefined) entry.favourite = patch.favourite || undefined
                next[problemId] = entry
                return next
            })

            try {
                const res = await fetch("/api/dsa/progress", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ problemId, ...patch }),
                })
                if (!res.ok) throw new Error("failed")
                const json = await res.json()
                setProgress(json.problems || {})
            } catch {
                setProgress(previous)
            }
        },
        [canTrack, progress]
    )

    const toggleSolved = useCallback(
        (p: ApiProblem) => {
            const solved = progress[p.id]?.status === "solved"
            save(p.id, { status: solved ? "pending" : "solved" })
        },
        [progress, save]
    )

    const toggleFavourite = useCallback(
        (p: ApiProblem) => {
            save(p.id, { favourite: !progress[p.id]?.favourite })
        },
        [progress, save]
    )

    /**
     * Clicking through to LeetCode files the problem as `attempted`.
     *
     * Fire-and-forget on purpose — the new tab opens from the anchor's own
     * default behaviour, so nothing the learner sees waits on this request, and
     * a failed write costs a breadcrumb rather than a navigation.
     */
    const markAttempted = useCallback(
        (p: ApiProblem) => {
            if (!canTrack) return
            if (progress[p.id]?.status) return // already attempted or solved
            save(p.id, { status: "attempted" })
        },
        [canTrack, progress, save]
    )

    /* ── Derived ──────────────────────────────────────────────────────────── */

    const stats = useMemo(() => {
        const all = sections?.flatMap((s) => s.problems) ?? []
        const solved = all.filter((p) => progress[p.id]?.status === "solved")
        const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 }
        const totalByDifficulty = { Easy: 0, Medium: 0, Hard: 0 }
        for (const p of all) {
            totalByDifficulty[p.difficulty]++
            if (progress[p.id]?.status === "solved") byDifficulty[p.difficulty]++
        }
        return {
            total: all.length,
            solved: solved.length,
            favourite: all.filter((p) => progress[p.id]?.favourite).length,
            byDifficulty,
            totalByDifficulty,
        }
    }, [sections, progress])

    const activeList = useMemo(
        () => lists.find((l) => l.id === listFilter) ?? null,
        [lists, listFilter]
    )

    /** Membership as a Set — the filter runs per problem, and `includes` on an
     *  array would be a linear scan inside a loop over 155 rows. */
    const activeListMembers = useMemo(
        () => (activeList ? new Set(activeList.problemIds) : null),
        [activeList]
    )

    const visibleSections = useMemo(() => {
        if (!sections) return null
        const q = query.trim().toLowerCase()
        return sections
            .map((section) => ({
                ...section,
                problems: section.problems.filter((p) => {
                    if (activeListMembers && !activeListMembers.has(p.id)) return false
                    if (difficulty !== "all" && p.difficulty !== difficulty) return false
                    const state = progress[p.id]
                    if (statusFilter === "solved" && state?.status !== "solved") return false
                    if (statusFilter === "unsolved" && state?.status === "solved") return false
                    if (statusFilter === "favourites" && !state?.favourite) return false
                    if (!q) return true
                    return (
                        p.title.toLowerCase().includes(q) ||
                        p.tags.some((t) => t.includes(q)) ||
                        p.companies.some((c) => c.toLowerCase().includes(q))
                    )
                }),
            }))
            .filter((s) => s.problems.length > 0)
    }, [sections, query, difficulty, statusFilter, progress, activeListMembers])

    // A filter that is narrower than the whole sheet should show its results,
    // not make you expand seventeen headers to find them.
    const forceOpen =
        query.trim().length > 0 ||
        difficulty !== "all" ||
        statusFilter !== "all" ||
        listFilter !== null

    const toggleSection = useCallback((id: string) => {
        setOpenSections((current) => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    /* ── Render ───────────────────────────────────────────────────────────── */

    if (error) {
        return (
            <p className="rounded-xl border border-hairline bg-card p-6 text-sm text-muted-foreground">
                We could not load the DSA sheet. Please refresh the page.
            </p>
        )
    }

    return (
        // No heading block here on purpose: the dashboard top bar already renders
        // the active tab's name ("DSA Sheet"), so a second one directly beneath it
        // was the same words twice, and the blurb pushed the progress bar — the
        // thing a returning learner actually opens this for — below the fold.
        <div className="space-y-6">
            {!sections && <SheetLoadingSkeleton />}

            {sections && (
                <>
                    <ProgressHeader stats={stats} canTrack={canTrack} />

                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search problems, tags or companies…"
                                className="w-full rounded-xl border border-hairline bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <FilterGroup
                                value={difficulty}
                                onChange={(v) => setDifficulty(v as typeof difficulty)}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "Easy", label: "Easy" },
                                    { value: "Medium", label: "Medium" },
                                    { value: "Hard", label: "Hard" },
                                ]}
                            />
                            <FilterGroup
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v as StatusFilter)}
                                options={[
                                    { value: "all", label: "Any" },
                                    { value: "unsolved", label: "To do" },
                                    { value: "solved", label: "Solved" },
                                    { value: "favourites", label: "Starred" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Collections. Only shown to someone who can actually have
                        them — for a signed-out visitor this whole row is noise. */}
                    {canTrack && (
                        <div className="flex flex-wrap items-center gap-2">
                            {lists.length === 0 ? (
                                <EmptyListsHint />
                            ) : (
                                <>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Lists
                                    </span>
                                    {lists.map((list) => (
                                        <button
                                            key={list.id}
                                            onClick={() =>
                                                setListFilter((cur) =>
                                                    cur === list.id ? null : list.id
                                                )
                                            }
                                            className={cn(
                                                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                                listFilter === list.id
                                                    ? "border-violet-500 bg-violet-500 text-white"
                                                    : "border-hairline bg-card text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <FolderOpen className="h-3 w-3" />
                                            <span className="max-w-[10rem] truncate">{list.name}</span>
                                            <span className="tabular-nums opacity-70">
                                                {list.problemIds.length}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* Management lives here rather than on the chip, so a chip
                        stays a one-click filter and cannot be renamed by accident. */}
                    {activeList && (
                        <ActiveListBar
                            list={activeList}
                            onRename={renameList}
                            onDelete={deleteList}
                            onClear={() => setListFilter(null)}
                        />
                    )}

                    {visibleSections?.length === 0 && (
                        <p className="rounded-xl border border-hairline bg-card p-6 text-center text-sm text-muted-foreground">
                            {activeList
                                ? `Nothing in “${activeList.name}” matches those filters.`
                                : "No problems match those filters."}
                        </p>
                    )}

                    <div className="space-y-3">
                        {visibleSections?.map((section) => {
                            const open = forceOpen || openSections.has(section.id)
                            const solvedHere = section.problems.filter(
                                (p) => progress[p.id]?.status === "solved"
                            ).length
                            return (
                                <section
                                    key={section.id}
                                    // Scroll target for ?tab=dsa&section=<id>. Prefixed
                                    // so it cannot collide with an id elsewhere on the
                                    // dashboard, which renders every tab from one page.
                                    id={`dsa-section-${section.id}`}
                                    className="scroll-mt-20 overflow-hidden rounded-2xl border border-hairline bg-card"
                                >
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        aria-expanded={open}
                                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 sm:p-5"
                                    >
                                        <span
                                            className={cn(
                                                "hidden h-10 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-b sm:block",
                                                SECTION_BAR[section.id] ?? "from-violet-500 to-purple-500"
                                            )}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-baseline gap-x-2">
                                                <span className="text-sm font-bold text-foreground">
                                                    {section.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {solvedHere}/{section.problems.length} · {section.est}
                                                </span>
                                            </span>
                                            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                                {section.blurb}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
                                                open && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {open && (
                                        <ul className="divide-y divide-hairline border-t border-hairline">
                                            {section.problems.map((p) => (
                                                <ProblemRow
                                                    key={p.id}
                                                    problem={p}
                                                    sectionId={section.id}
                                                    state={progress[p.id]}
                                                    canTrack={canTrack}
                                                    lists={lists}
                                                    onToggleList={toggleListMembership}
                                                    onCreateList={createListWith}
                                                    onToggleSolved={() => toggleSolved(p)}
                                                    onToggleFavourite={() => toggleFavourite(p)}
                                                    onOpenExternal={() => markAttempted(p)}
                                                    onOpenNote={() => setNoteFor(p)}
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )
                        })}
                    </div>
                </>
            )}

            {/* The same editor the approach pages use — one note, one surface. */}
            <DsaNoteEditor
                problemId={noteFor?.id ?? null}
                title={noteFor?.title}
                difficulty={noteFor?.difficulty}
                open={Boolean(noteFor)}
                onClose={() => setNoteFor(null)}
            />
        </div>
    )
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function ProgressHeader({
    stats,
    canTrack,
}: {
    stats: {
        total: number
        solved: number
        favourite: number
        byDifficulty: Record<string, number>
        totalByDifficulty: Record<string, number>
    }
    canTrack: boolean
}) {
    const pct = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0

    if (!canTrack) {
        return (
            <div className="rounded-2xl border border-hairline bg-card p-5">
                <p className="text-sm text-muted-foreground">
                    <a href="/login" className="font-medium text-violet-700 underline dark:text-violet-400">
                        Log in
                    </a>{" "}
                    to track what you have solved, star the ones worth returning to and keep notes. The
                    sheet and every approach page are free either way.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-hairline bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
                        <Trophy className="h-5 w-5 text-white" />
                    </span>
                    <div>
                        <p className="text-2xl font-bold leading-none text-foreground">
                            {stats.solved}
                            <span className="text-base font-medium text-muted-foreground">
                                /{stats.total}
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">problems solved</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    {(["Easy", "Medium", "Hard"] as const).map((d) => (
                        <span key={d} className="flex items-center gap-1.5">
                            <span className={cn("font-semibold", DIFFICULTY_STYLES[d])}>{d}</span>
                            <span className="text-muted-foreground">
                                {stats.byDifficulty[d]}/{stats.totalByDifficulty[d]}
                            </span>
                        </span>
                    ))}
                    {stats.favourite > 0 && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Star className="h-3.5 w-3.5" />
                            {stats.favourite} starred
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-overlay-strong">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

/**
 * The bar shown while a list is being browsed: what you are looking at, and the
 * two things you can do to it.
 *
 * Rename and delete live HERE rather than on the chip itself, so a chip stays a
 * single-purpose one-click filter. Putting a kebab menu on every chip would put
 * "delete" one slip away from "show me this list", and there is no undo.
 */
function ActiveListBar({
    list,
    onRename,
    onDelete,
    onClear,
}: {
    list: DsaListDto
    onRename: (listId: string, name: string) => Promise<string | null>
    onDelete: (listId: string) => Promise<void>
    onClear: () => void
}) {
    const [renaming, setRenaming] = useState(false)
    const [name, setName] = useState(list.name)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const submitRename = useCallback(async () => {
        const trimmed = name.trim()
        if (!trimmed || busy) return
        if (trimmed === list.name) {
            setRenaming(false)
            return
        }
        setBusy(true)
        const err = await onRename(list.id, trimmed)
        setBusy(false)
        if (err) {
            setError(err)
            return
        }
        setRenaming(false)
        setError(null)
    }, [name, busy, list.id, list.name, onRename])

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-3">
            {renaming ? (
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") submitRename()
                                if (e.key === "Escape") {
                                    setRenaming(false)
                                    setName(list.name)
                                    setError(null)
                                }
                            }}
                            maxLength={40}
                            autoFocus
                            className="h-8 max-w-xs text-sm"
                        />
                        <button
                            onClick={submitRename}
                            disabled={busy}
                            className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setRenaming(false)
                                setName(list.name)
                                setError(null)
                            }}
                            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>
                    {error && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
                    )}
                </div>
            ) : (
                <>
                    <span className="min-w-0 flex-1 text-sm">
                        <span className="font-semibold text-foreground">{list.name}</span>
                        <span className="ml-2 text-muted-foreground">
                            {list.problemIds.length}{" "}
                            {list.problemIds.length === 1 ? "problem" : "problems"}
                        </span>
                    </span>

                    {confirmingDelete ? (
                        // Inline confirm rather than a dialog: the destructive
                        // action is small and local, and a modal for it would be
                        // heavier than the thing being deleted.
                        <span className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Delete this list?</span>
                            <button
                                onClick={() => onDelete(list.id)}
                                className="rounded-md bg-rose-600 px-2.5 py-1 font-medium text-white"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setConfirmingDelete(false)}
                                className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
                            >
                                Keep
                            </button>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <button
                                onClick={() => setRenaming(true)}
                                aria-label="Rename this list"
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setConfirmingDelete(true)}
                                aria-label="Delete this list"
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-overlay hover:text-rose-600 dark:hover:text-rose-400"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={onClear}
                                aria-label="Stop filtering by this list"
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                </>
            )}
        </div>
    )
}

function FilterGroup({
    value,
    onChange,
    options,
}: {
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <div className="flex rounded-xl border border-hairline bg-card p-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                        value === o.value
                            ? "bg-violet-600 text-white"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
}

function ProblemRow({
    problem,
    sectionId,
    state,
    canTrack,
    lists,
    onToggleList,
    onCreateList,
    onToggleSolved,
    onToggleFavourite,
    onOpenExternal,
    onOpenNote,
}: {
    problem: ApiProblem
    sectionId: string
    state?: ProblemState
    canTrack: boolean
    lists: DsaListDto[]
    onToggleList: (listId: string, problemId: string, member: boolean) => Promise<boolean>
    onCreateList: (name: string, problemId: string) => Promise<string | null>
    onToggleSolved: () => void
    onToggleFavourite: () => void
    onOpenExternal: () => void
    onOpenNote: () => void
}) {
    const solved = state?.status === "solved"
    // Drives the folder icon's filled state: any membership at all counts.
    const inAnyList = lists.some((l) => l.problemIds.includes(problem.id))

    return (
        <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-overlay sm:px-5">
            <button
                onClick={onToggleSolved}
                disabled={!canTrack}
                aria-label={solved ? `Mark ${problem.title} unsolved` : `Mark ${problem.title} solved`}
                aria-pressed={solved}
                className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    solved
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-border hover:border-violet-500",
                    !canTrack && "cursor-not-allowed opacity-40"
                )}
            >
                {solved && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>

            <div className="min-w-0 flex-1">
                <a
                    href={problem.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onOpenExternal}
                    className={cn(
                        "group inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-violet-700 dark:hover:text-violet-400",
                        solved ? "text-muted-foreground" : "text-foreground"
                    )}
                >
                    <span className="truncate">{problem.title}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                    <span className={cn("font-semibold", DIFFICULTY_STYLES[problem.difficulty])}>
                        {problem.difficulty}
                    </span>
                    {state?.status === "attempted" && (
                        <span className="text-muted-foreground">attempted</span>
                    )}
                    {problem.companies.slice(0, 2).map((c) => (
                        <span key={c} className="text-muted-foreground">
                            {c}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1">
                {problem.hasApproach ? (
                    <a
                        href={`/dsa/${sectionId}/${problem.id}`}
                        className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-overlay dark:text-violet-400 sm:inline-flex"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Approach
                    </a>
                ) : (
                    <span
                        className="hidden px-2 py-1.5 text-xs text-muted-foreground/60 sm:inline"
                        title="We have not written this one up yet"
                    >
                        Soon
                    </span>
                )}

                <DsaListPicker
                    problemId={problem.id}
                    lists={lists}
                    disabled={!canTrack}
                    onToggle={(listId, member) => onToggleList(listId, problem.id, member)}
                    onCreate={(name) => onCreateList(name, problem.id)}
                >
                    <button
                        aria-label={`Save ${problem.title} to a list`}
                        disabled={!canTrack}
                        className={cn(
                            "rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                            inAnyList
                                ? "text-violet-700 dark:text-violet-400"
                                : "text-muted-foreground hover:text-foreground",
                            canTrack ? "hover:bg-overlay" : "cursor-not-allowed opacity-40"
                        )}
                    >
                        <FolderOpen className="h-4 w-4" />
                    </button>
                </DsaListPicker>

                <IconToggle
                    active={Boolean(state?.favourite)}
                    disabled={!canTrack}
                    onClick={onToggleFavourite}
                    label={`Star ${problem.title}`}
                    activeClass="text-amber-500 dark:text-amber-400"
                >
                    <Star className={cn("h-4 w-4", state?.favourite && "fill-current")} />
                </IconToggle>

                <IconToggle
                    active={false}
                    disabled={!canTrack}
                    onClick={onOpenNote}
                    label={`Notes for ${problem.title}`}
                    activeClass=""
                >
                    <NotebookPen className="h-4 w-4" />
                </IconToggle>
            </div>
        </li>
    )
}

function IconToggle({
    active,
    disabled,
    onClick,
    label,
    activeClass,
    children,
}: {
    active: boolean
    disabled: boolean
    onClick: () => void
    label: string
    activeClass: string
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
                "rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                active ? activeClass : "text-muted-foreground hover:text-foreground",
                disabled ? "cursor-not-allowed opacity-40" : "hover:bg-overlay"
            )}
        >
            {children}
        </button>
    )
}


function SheetLoadingSkeleton() {
    return (
        <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-2xl border border-hairline bg-card" />
            {Array.from({ length: 5 }, (_, i) => (
                <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl border border-hairline bg-card"
                />
            ))}
        </div>
    )
}
