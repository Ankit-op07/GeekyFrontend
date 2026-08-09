"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
    BellRing,
    CalendarDays,
    CalendarPlus,
    Check,
    Clock,
    ExternalLink,
    List,
    RefreshCw,
    Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CONTEST_LOGOS } from "@/lib/contests/logos"
import { ContestCalendar, type PlannedContest } from "@/components/dashboard/contest-calendar"

interface ApiContest {
    id: string
    fingerprint: string
    platform: string
    name: string
    url: string
    startsAt: string
    endsAt: string
    durationSeconds: number
}

interface ApiPlatform {
    id: string
    label: string
    chip: string
}

/* ── Formatting ───────────────────────────────────────────────────────────── */

/**
 * Everything here renders in the VIEWER'S timezone, deliberately.
 *
 * The four platforms publish in three different zones — Codeforces in UTC,
 * AtCoder in JST, CodeChef in IST — and the single most common way to miss a
 * contest is to read a time in someone else's. Every displayed time goes
 * through toLocaleString with no timezone argument, so the browser resolves it,
 * and the zone is named once on the board so the numbers are unambiguous.
 */
function formatTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })
}

function formatDayLabel(iso: string, now: number): string {
    const d = new Date(iso)
    const today = new Date(now)
    const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
    const days = Math.round((startOfDay(d) - startOfDay(today)) / 86_400_000)

    if (days === 0) return "Today"
    if (days === 1) return "Tomorrow"
    // Beyond a week, a weekday name stops being useful ("Saturday" — which one?).
    if (days > 1 && days < 7) {
        return d.toLocaleDateString(undefined, { weekday: "long" })
    }
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
}

function formatDuration(seconds: number): string {
    if (!seconds) return "—"
    const h = Math.floor(seconds / 3600)
    const m = Math.round((seconds % 3600) / 60)
    if (h >= 24) {
        const d = Math.floor(h / 24)
        return `${d}d ${h % 24}h`
    }
    if (!h) return `${m}m`
    return m ? `${h}h ${m}m` : `${h}h`
}

/** Coarse on purpose — a second-by-second countdown would need a per-second
 *  re-render for information nobody acts on more precisely than "today". */
function formatCountdown(startsAt: string, endsAt: string, now: number): string {
    const start = new Date(startsAt).getTime()
    const end = new Date(endsAt).getTime()
    if (now >= start && now < end) {
        const left = Math.floor((end - now) / 60000)
        return left < 60 ? `${left}m left` : `${Math.floor(left / 60)}h ${left % 60}m left`
    }
    const ms = start - now
    if (ms <= 0) return "starting"
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `in ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `in ${hours}h ${mins % 60}m`
    return `in ${Math.floor(hours / 24)}d ${hours % 24}h`
}

/* ── Calendar ─────────────────────────────────────────────────────────────── */

/** Calendar wants UTC basic format: 20260808T120000Z. */
function toCalendarStamp(iso: string): string {
    return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function googleCalendarUrl(c: ApiContest): string {
    return `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: "TEMPLATE",
        text: c.name,
        dates: `${toCalendarStamp(c.startsAt)}/${toCalendarStamp(c.endsAt)}`,
        details: `Contest page: ${c.url}`,
    })}`
}

/* ── Platform mark ────────────────────────────────────────────────────────── */

/**
 * The platform's own favicon, inlined (see lib/contests/logos.ts).
 *
 * Falls back to a coloured lettermark when a mark is missing, so adding a
 * platform never requires sourcing artwork first — the adapter can ship and the
 * logo can follow.
 */
function PlatformLogo({ platform, label }: { platform: string; label: string }) {
    const src = CONTEST_LOGOS[platform]

    if (!src) {
        return (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-hairline bg-overlay text-xs font-bold text-muted-foreground">
                {label.slice(0, 2).toUpperCase()}
            </span>
        )
    }

    return (
        // A white plate behind every mark: several of these favicons are dark
        // artwork on transparency, which vanishes on the dark dashboard. The
        // plate is what makes one container work for all four.
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-hairline bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URI
                has nothing for next/image to optimise. */}
            <img src={src} alt="" aria-hidden className="h-full w-full object-contain" />
        </span>
    )
}

/* ── Board ────────────────────────────────────────────────────────────────── */

/**
 * The contests board — every upcoming round from Codeforces, AtCoder, CodeChef
 * and LeetCode in one place.
 *
 * WHAT "TRACK" MEANS HERE, because it was a real design decision. The obvious
 * feature is a "remind me" toggle. We did not build one, because we cannot send
 * the reminder: there is no push infrastructure, and an email an hour before a
 * contest is a scheduled-job problem this app has no runner for. A toggle that
 * silently does nothing is worse than no toggle.
 *
 * So tracking is calendar export — one click into the calendar the learner
 * already gets notified by. That reminder actually fires, on a device they
 * already check, and it keeps working if this page is down.
 *
 * Rows are GROUPED BY DAY rather than listed flat. A flat list of eighteen
 * timestamps makes "what is on this week" a reading exercise; day headers make
 * it a glance, which is the only question this board exists to answer.
 */
export function ContestsTab() {
    const [contests, setContests] = useState<ApiContest[] | null>(null)
    const [platforms, setPlatforms] = useState<ApiPlatform[]>([])
    const [platform, setPlatform] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    /**
     * What the learner has marked as "I am sitting this one".
     *
     * A fingerprint -> plan Map rather than an array: every row asks "am I
     * planning this?" on each render, and a linear scan inside a list of
     * eighteen rows is work for nothing.
     */
    const [plans, setPlans] = useState<Map<string, PlannedContest>>(new Map())
    const [canPlan, setCanPlan] = useState(false)
    const [view, setView] = useState<"list" | "calendar">("list")

    // Re-rendered once a minute so countdowns stay honest without a per-second
    // timer.
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 60_000)
        return () => clearInterval(t)
    }, [])

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/contests")
            if (!res.ok) throw new Error("failed")
            const json = await res.json()
            setPlatforms(json.platforms || [])
            setContests(json.contests || [])
            return (json.contests || []).length as number
        } catch {
            setError(true)
            return 0
        }
    }, [])

    const refresh = useCallback(async () => {
        setRefreshing(true)
        try {
            // A 429 means "already fresh", which is a success from the board's
            // point of view — reload either way.
            await fetch("/api/contests/refresh", { method: "POST" })
            await load()
        } finally {
            setRefreshing(false)
        }
    }, [load])

    useEffect(() => {
        let cancelled = false
        load().then((count) => {
            // Cold cache: between a deploy and the first cron tick the board is
            // empty, and on an install with no cron it would stay that way. One
            // automatic refresh on an EMPTY board fixes both without turning the
            // read path into a general-purpose trigger.
            if (!cancelled && count === 0) refresh()
        })
        return () => {
            cancelled = true
        }
    }, [load, refresh])

    // Plans load independently of the board: a signed-out visitor gets
    // canPlan false here, which is a normal state and must not affect the
    // schedule they can still read.
    const loadPlans = useCallback(async () => {
        try {
            const res = await fetch("/api/contests/plans")
            if (!res.ok) return
            const json = await res.json()
            setCanPlan(Boolean(json.canPlan))
            setPlans(new Map((json.plans || []).map((p: PlannedContest) => [p.fingerprint, p])))
        } catch {
            /* no plans is a valid state */
        }
    }, [])

    useEffect(() => {
        loadPlans()
    }, [loadPlans])

    /**
     * Toggle a plan. Optimistic, and reverted on failure — this is clicked
     * while scanning a list, not while waiting on a spinner.
     */
    const togglePlan = useCallback(
        async (contest: ApiContest, planned: boolean) => {
            const previous = plans
            setPlans((current) => {
                const next = new Map(current)
                if (planned) {
                    next.set(contest.fingerprint, {
                        fingerprint: contest.fingerprint,
                        platform: contest.platform,
                        name: contest.name,
                        url: contest.url,
                        startsAt: contest.startsAt,
                        endsAt: contest.endsAt,
                        reminded: false,
                    })
                } else {
                    next.delete(contest.fingerprint)
                }
                return next
            })

            try {
                const res = await fetch("/api/contests/plans", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fingerprint: contest.fingerprint, planned }),
                })
                if (!res.ok) throw new Error("failed")
            } catch {
                setPlans(previous)
            }
        },
        [plans]
    )

    const timezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
            return null
        }
    }, [])

    const visible = useMemo(
        () => (contests || []).filter((c) => !platform || c.platform === platform),
        [contests, platform]
    )

    const live = visible.filter(
        (c) => now >= new Date(c.startsAt).getTime() && now < new Date(c.endsAt).getTime()
    )

    /** Upcoming rounds bucketed by calendar day, in order. */
    const byDay = useMemo(() => {
        const upcoming = visible.filter((c) => now < new Date(c.startsAt).getTime())
        const groups = new Map<string, ApiContest[]>()
        for (const c of upcoming) {
            const key = new Date(c.startsAt).toDateString()
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(c)
        }
        return [...groups.entries()]
    }, [visible, now])

    const platformOf = (id: string) => platforms.find((p) => p.id === id)

    if (error && !contests) {
        return (
            <p className="rounded-xl border border-hairline bg-card p-6 text-sm text-muted-foreground">
                We could not load the contest schedule. Please refresh the page.
            </p>
        )
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Upcoming rounds from Codeforces, AtCoder, CodeChef and LeetCode.
                        {timezone && (
                            <>
                                {" "}
                                Times shown in{" "}
                                <span className="font-medium text-foreground">{timezone}</span>.
                            </>
                        )}
                    </p>

                    <div className="flex items-center gap-2">
                        {/* Only offered to someone who can have plans — for a
                            signed-out visitor the calendar is always empty. */}
                        {canPlan && (
                            <div className="flex rounded-lg border border-hairline bg-card p-0.5">
                                <ViewTab
                                    active={view === "list"}
                                    onClick={() => setView("list")}
                                    icon={<List className="h-3.5 w-3.5" />}
                                    label="Schedule"
                                />
                                <ViewTab
                                    active={view === "calendar"}
                                    onClick={() => setView("calendar")}
                                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                                    label="My plan"
                                    badge={plans.size || undefined}
                                />
                            </div>
                        )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={refresh}
                                disabled={refreshing}
                                aria-label="Refresh the contest schedule"
                                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                                />
                                Refresh
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Fetch the latest schedule now</TooltipContent>
                    </Tooltip>
                    </div>
                </div>

                {view === "calendar" ? (
                    <>
                        <ContestCalendar plans={[...plans.values()]} onSelect={() => {}} />
                        <ReminderNote hasPlans={plans.size > 0} />
                    </>
                ) : (
                <>
                {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <FilterChip
                            active={platform === null}
                            onClick={() => setPlatform(null)}
                            label="All"
                            count={contests?.length ?? 0}
                        />
                        {platforms.map((p) => (
                            <FilterChip
                                key={p.id}
                                active={platform === p.id}
                                onClick={() => setPlatform(p.id)}
                                label={p.label}
                                logo={CONTEST_LOGOS[p.id]}
                                count={(contests || []).filter((c) => c.platform === p.id).length}
                            />
                        ))}
                    </div>
                )}

                {!contests && (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div
                                key={i}
                                className="h-[4.5rem] animate-pulse rounded-2xl border border-hairline bg-card"
                            />
                        ))}
                    </div>
                )}

                {contests && visible.length === 0 && (
                    <div className="rounded-2xl border border-hairline bg-card p-10 text-center">
                        <Trophy className="mx-auto h-7 w-7 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            {refreshing
                                ? "Fetching the latest schedule…"
                                : platform
                                  ? `No ${platformOf(platform)?.label ?? ""} contests scheduled.`
                                  : "No contests scheduled right now."}
                        </p>
                    </div>
                )}

                {live.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            Running now
                        </h3>
                        <div className="space-y-2">
                            {live.map((c) => (
                                <ContestRow
                                    key={c.id}
                                    contest={c}
                                    now={now}
                                    platform={platformOf(c.platform)}
                                    canPlan={canPlan}
                                    planned={plans.has(c.fingerprint)}
                                    onTogglePlan={togglePlan}
                                    live
                                />
                            ))}
                        </div>
                    </section>
                )}

                {byDay.map(([day, rows]) => (
                    <section key={day} className="space-y-2">
                        <h3 className="flex items-baseline gap-2 px-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                {formatDayLabel(rows[0].startsAt, now)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(rows[0].startsAt).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {rows.map((c) => (
                                <ContestRow
                                    key={c.id}
                                    contest={c}
                                    now={now}
                                    platform={platformOf(c.platform)}
                                    canPlan={canPlan}
                                    planned={plans.has(c.fingerprint)}
                                    onTogglePlan={togglePlan}
                                />
                            ))}
                        </div>
                    </section>
                ))}
                </>
                )}
            </div>
        </TooltipProvider>
    )
}

function ViewTab({
    active,
    onClick,
    icon,
    label,
    badge,
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    badge?: number
}) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                    ? "bg-overlay-strong text-foreground"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {icon}
            {label}
            {badge !== undefined && (
                <span className="rounded-full bg-violet-600 px-1.5 text-[10px] font-semibold tabular-nums text-white">
                    {badge}
                </span>
            )}
        </button>
    )
}

/**
 * What we actually promise about reminders.
 *
 * Stated plainly and in the right place — beside the plan, where someone is
 * deciding whether to rely on it. Reminders go out from a daily cron, so
 * "morning of" is the finest granularity the infrastructure can honestly
 * offer; claiming "we'll ping you an hour before" would be a lie the first
 * time someone counted on it.
 */
function ReminderNote({ hasPlans }: { hasPlans: boolean }) {
    if (!hasPlans) return null
    return (
        <p className="flex items-start gap-2 rounded-xl border border-hairline bg-card px-4 py-3 text-xs text-muted-foreground">
            <BellRing className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-700 dark:text-violet-400" />
            <span>
                We email you on the <span className="font-medium text-foreground">morning of</span>{" "}
                each contest you have planned. Add it to your calendar too if you want a reminder
                closer to the start.
            </span>
        </p>
    )
}

function FilterChip({
    active,
    onClick,
    label,
    count,
    logo,
}: {
    active: boolean
    onClick: () => void
    label: string
    count: number
    logo?: string
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-medium transition-colors",
                active
                    ? "border-violet-500 bg-violet-500 text-white"
                    : "border-hairline bg-card text-muted-foreground hover:text-foreground"
            )}
        >
            {logo ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white p-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" aria-hidden className="h-full w-full object-contain" />
                </span>
            ) : (
                <span className="w-1" />
            )}
            {label}
            <span className="tabular-nums opacity-70">{count}</span>
        </button>
    )
}

function ContestRow({
    contest,
    now,
    platform,
    live,
    canPlan,
    planned,
    onTogglePlan,
}: {
    contest: ApiContest
    now: number
    platform?: ApiPlatform
    live?: boolean
    canPlan: boolean
    planned: boolean
    onTogglePlan: (contest: ApiContest, planned: boolean) => void
}) {
    const label = platform?.label ?? contest.platform

    return (
        <article
            className={cn(
                "group flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors sm:gap-4 sm:p-4",
                live
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : "border-hairline hover:border-violet-500/40"
            )}
        >
            <PlatformLogo platform={contest.platform} label={label} />

            {/* The time is the column people scan, so it gets a fixed lane on the
                left rather than being buried in a metadata line. */}
            <div className="hidden w-16 flex-shrink-0 flex-col sm:flex">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatTime(contest.startsAt)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                    {formatDuration(contest.durationSeconds)}
                </span>
            </div>

            <div className="min-w-0 flex-1">
                <a
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-violet-700 dark:hover:text-violet-400"
                >
                    <span className="line-clamp-2">{contest.name}</span>
                    <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className={cn("sm:hidden", "tabular-nums")}>
                        {formatTime(contest.startsAt)}
                    </span>
                    <span className="flex items-center gap-1 sm:hidden">
                        <Clock className="h-3 w-3" />
                        {formatDuration(contest.durationSeconds)}
                    </span>
                    <span
                        className={cn(
                            "font-medium",
                            live && "text-emerald-700 dark:text-emerald-400"
                        )}
                    >
                        {formatCountdown(contest.startsAt, contest.endsAt, now)}
                    </span>
                </div>
            </div>

            {canPlan && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => onTogglePlan(contest, !planned)}
                            aria-pressed={planned}
                            aria-label={
                                planned
                                    ? `Remove ${contest.name} from your plan`
                                    : `Plan to take part in ${contest.name}`
                            }
                            className={cn(
                                "flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                                planned
                                    ? "border-violet-500 bg-violet-500 text-white"
                                    : "border-hairline text-muted-foreground hover:border-violet-500/50 hover:text-foreground"
                            )}
                        >
                            {planned ? (
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                                <BellRing className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">
                                {planned ? "Planned" : "Plan"}
                            </span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {planned
                            ? "You will get an email the morning of this contest"
                            : "Mark this as planned and we will email you on the day"}
                    </TooltipContent>
                </Tooltip>
            )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={googleCalendarUrl(contest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Add ${contest.name} to your calendar`}
                        className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-overlay hover:text-violet-700 dark:hover:text-violet-400"
                    >
                        <CalendarPlus className="h-4 w-4" />
                    </a>
                </TooltipTrigger>
                <TooltipContent>Add to Google Calendar</TooltipContent>
            </Tooltip>
        </article>
    )
}
