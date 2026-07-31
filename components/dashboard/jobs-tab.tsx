"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    ArrowUpRight,
    Bookmark,
    BookmarkCheck,
    Briefcase,
    Building2,
    CalendarDays,
    ExternalLink,
    Globe2,
    Loader2,
    MapPin,
    Rocket,
    Search,
    SlidersHorizontal,
    StickyNote,
    X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * The Jobs section of the dashboard — an India-only developer job board.
 *
 * Reads /api/jobs, which serves the aggregated `Job` cache. The fan-out to
 * company ATS boards and HN Who-is-hiring happens on a cron (lib/jobs/ingest.ts)
 * and is India-gated there, so everything this component renders is already an
 * Indian opening. There is no country filter for that reason; the location
 * filter is by metro.
 *
 * One deliberate exception to "never fetch upstream from the client": if the
 * board comes back empty, this asks the server to run an ingest once. That is
 * the difference between a board that works the moment the feature ships and a
 * blank tab until a cron fires. The endpoint refuses when the board is warm.
 */

interface ApiJob {
    id: string
    title: string
    company: string
    companyLogo: string | null
    applyUrl: string
    location: string
    isRemote: boolean
    countryCode: string | null
    city: string | null
    employmentType: string
    category: string
    level: string
    tags: string[]
    isStartup: boolean
    description: string
    salaryMin: number | null
    salaryMax: number | null
    salaryCurrency: string | null
    salaryText: string | null
    postedAt: string
    saved: boolean
    /** Tracker stage, or null when the job isn't on the user's list. */
    trackStatus: TrackStatus | null
}

type TrackStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected"

interface TrackedJob {
    id: string
    title: string
    company: string
    applyUrl: string
    location: string
    status: TrackStatus
    appliedAt: string | null
    notes: string
    savedAt: string
    stillListed: boolean
}

/**
 * The pipeline, in order, with the colour each stage carries everywhere it
 * appears. Defined once so a card badge, a tracker pill and the summary row can
 * never disagree about what "interviewing" looks like.
 */
const STATUSES: { id: TrackStatus; label: string; chip: string; dot: string }[] = [
    {
        id: "saved",
        label: "Saved",
        chip: "bg-overlay-strong text-muted-foreground",
        dot: "bg-slate-400",
    },
    {
        id: "applied",
        label: "Applied",
        chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
        dot: "bg-violet-500",
    },
    {
        id: "interviewing",
        label: "Interviewing",
        chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        dot: "bg-amber-500",
    },
    {
        id: "offer",
        label: "Offer",
        chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        dot: "bg-emerald-500",
    },
    {
        id: "rejected",
        label: "Rejected",
        chip: "bg-red-500/15 text-red-700 dark:text-red-400",
        dot: "bg-red-500",
    },
]

const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s])) as Record<
    TrackStatus,
    (typeof STATUSES)[number]
>

const CATEGORIES: { id: string; label: string }[] = [
    { id: "", label: "All roles" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "fullstack", label: "Full stack" },
    { id: "software", label: "General SWE" },
    { id: "mobile", label: "Mobile" },
    { id: "data", label: "Data / AI" },
    { id: "devops", label: "DevOps" },
    { id: "qa", label: "QA" },
]

/** Mirrors INDIAN_CITIES in lib/jobs/normalize.ts, plus Remote. */
const CITIES = [
    "Bengaluru",
    "Delhi NCR",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Mumbai",
    "Kolkata",
    "Ahmedabad",
    "Kochi",
    "Chandigarh",
    "Jaipur",
    "Indore",
    "Coimbatore",
    "Remote",
]

const LEVELS = [
    { id: "any", label: "Any experience" },
    { id: "internship", label: "Internship" },
    { id: "junior", label: "Fresher / Junior" },
    { id: "mid", label: "Mid-level" },
    { id: "senior", label: "Senior" },
    { id: "lead", label: "Lead / Staff" },
]

const LEVEL_LABELS: Record<string, string> = {
    internship: "Internship",
    junior: "Junior",
    mid: "Mid-level",
    senior: "Senior",
    lead: "Lead",
    unknown: "",
}

// ── Formatting ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
    const then = new Date(iso).getTime()
    if (!Number.isFinite(then)) return ""
    const days = Math.floor((Date.now() - then) / 86_400_000)
    if (days <= 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
}

/**
 * Compact money. Indian salaries are quoted in lakhs, not thousands — "₹18L"
 * is what a candidate here reads fluently and "₹1,800k" is not — so INR gets
 * its own scale rather than a generic k/M formatter.
 */
function formatSalary(job: ApiJob): string | null {
    if (job.salaryMin || job.salaryMax) {
        const currency = job.salaryCurrency || "INR"
        const symbol = currency === "INR" ? "₹" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$"
        const compact = (value: number) =>
            currency === "INR"
                ? value >= 100_000
                    ? `${(value / 100_000).toFixed(value >= 1_000_000 ? 0 : 1).replace(/\.0$/, "")}L`
                    : `${Math.round(value / 1000)}k`
                : value >= 1000
                    ? `${Math.round(value / 1000)}k`
                    : String(Math.round(value))
        if (job.salaryMin && job.salaryMax) return `${symbol}${compact(job.salaryMin)}–${compact(job.salaryMax)}`
        return `${symbol}${compact((job.salaryMin || job.salaryMax) as number)}+`
    }
    // Prose salaries are shown verbatim but capped; some feeds put a paragraph
    // in this field.
    if (job.salaryText) return job.salaryText.length > 40 ? null : job.salaryText
    return null
}

/**
 * A stable colour per company, derived from the name.
 *
 * Most listings arrive with no logo (ATS feeds don't carry one), and a wall of
 * identical violet tiles is what makes an aggregated board look generated. A
 * deterministic hue means Swiggy is always the same colour, which reads as
 * deliberate — and unlike a third-party favicon service it costs no request and
 * leaks no user to anyone.
 */
const TILE_COLORS = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-sky-600",
    "from-fuchsia-500 to-purple-600",
    "from-lime-500 to-emerald-600",
]

function companyColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
    return TILE_COLORS[Math.abs(hash) % TILE_COLORS.length]
}

/** Two initials from the company name — "Hevo Data" → "HD", "Swiggy" → "SW". */
function companyInitials(name: string): string {
    const words = name.replace(/[^\w\s]/g, " ").trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
}

// ── Small pieces ──────────────────────────────────────────────────────────

function FilterChip({
    active,
    onClick,
    count,
    children,
}: {
    active: boolean
    onClick: () => void
    count?: number
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                active
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300"
                    : "border-hairline bg-card text-muted-foreground hover:border-violet-500/30 hover:text-foreground"
            )}
        >
            {children}
            {count !== undefined && (
                <span
                    className={cn(
                        "rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums",
                        active ? "bg-violet-500/20" : "bg-overlay-strong"
                    )}
                >
                    {count}
                </span>
            )}
        </button>
    )
}

function CompanyMark({
    job,
    size = "md",
}: {
    job: Pick<ApiJob, "company" | "companyLogo">
    size?: "md" | "lg"
}) {
    const [broken, setBroken] = useState(false)
    const box = size === "lg" ? "h-14 w-14 text-base" : "h-11 w-11 text-sm"

    if (job.companyLogo && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={job.companyLogo}
                alt=""
                onError={() => setBroken(true)}
                // These are third-party hosts. Don't hand them a Referer header
                // naming the dashboard page the learner is on.
                referrerPolicy="no-referrer"
                // A white tile behind the logo: most are dark marks on
                // transparent and vanish in dark mode otherwise.
                className={cn(
                    box,
                    "flex-shrink-0 rounded-xl border border-hairline bg-white object-contain p-1.5"
                )}
            />
        )
    }
    return (
        <div
            className={cn(
                box,
                "flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold tracking-tight text-white shadow-sm",
                companyColor(job.company)
            )}
        >
            {companyInitials(job.company)}
        </div>
    )
}

/** Loading placeholders shaped like the cards they replace, so the list doesn't
 *  jump when data lands. A spinner tells you nothing about what's coming. */
function JobCardSkeleton() {
    return (
        <div className="rounded-2xl border border-hairline bg-card p-4 sm:p-5">
            <div className="flex gap-3">
                <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-xl bg-overlay-strong" />
                <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-overlay-strong" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-overlay" />
                    <div className="flex gap-2 pt-1">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-overlay" />
                        <div className="h-5 w-14 animate-pulse rounded-full bg-overlay" />
                        <div className="h-5 w-20 animate-pulse rounded-full bg-overlay" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function JobCard({
    job,
    active,
    onOpen,
    onToggleSave,
}: {
    job: ApiJob
    active: boolean
    onOpen: () => void
    onToggleSave: () => void
}) {
    const salary = formatSalary(job)
    const level = LEVEL_LABELS[job.level]
    const stage = job.trackStatus && job.trackStatus !== "saved" ? STATUS_BY_ID[job.trackStatus] : null

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onOpen()
                }
            }}
            className={cn(
                "group relative cursor-pointer rounded-2xl border bg-card p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-5",
                active
                    ? "border-violet-500/50 shadow-md"
                    : "border-hairline hover:border-violet-500/40 hover:shadow-md"
            )}
        >
            <div className="flex items-start gap-3.5">
                <CompanyMark job={job} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-[15px] font-semibold leading-snug text-foreground">
                                {job.title}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                <span className="truncate font-medium">{job.company}</span>
                                {job.isStartup && (
                                    <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                        <Rocket className="h-2.5 w-2.5" />
                                        Startup
                                    </span>
                                )}
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label={job.saved ? "Remove from tracker" : "Save job"}
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleSave()
                            }}
                            className={cn(
                                "-mr-1 -mt-1 flex-shrink-0 rounded-lg p-2 transition-colors",
                                job.saved
                                    ? "text-violet-600 dark:text-violet-400"
                                    : "text-muted-foreground/60 hover:bg-overlay hover:text-foreground"
                            )}
                        >
                            {job.saved ? (
                                <BookmarkCheck className="h-[18px] w-[18px]" />
                            ) : (
                                <Bookmark className="h-[18px] w-[18px]" />
                            )}
                        </button>
                    </div>

                    {/* Facts row — location, level, pay, age. Everything a
                        candidate scans for before opening anything. */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            {job.isRemote ? (
                                <Globe2 className="h-3.5 w-3.5 flex-shrink-0" />
                            ) : (
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            )}
                            <span className="max-w-[15rem] truncate">{job.city || job.location}</span>
                        </span>
                        {level && (
                            <span className="inline-flex items-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                                {level}
                            </span>
                        )}
                        {salary && (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {salary}
                            </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground/80">
                            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                            {relativeTime(job.postedAt)}
                        </span>
                    </div>

                    {(job.tags.length > 0 || stage) && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {/* Stage first: while browsing, "you already applied
                                here" is the most useful thing on the card. */}
                            {stage && (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                        stage.chip
                                    )}
                                >
                                    <span className={cn("h-1.5 w-1.5 rounded-full", stage.dot)} />
                                    {stage.label}
                                </span>
                            )}
                            {job.tags.slice(0, 5).map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-md border border-hairline bg-overlay px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/** One labelled fact in the detail sheet's summary grid. */
function DetailFact({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MapPin
    label: string
    value: string
}) {
    return (
        <div className="rounded-xl border border-hairline bg-overlay p-3">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3 w-3" />
                {label}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
        </div>
    )
}

function JobDetail({
    job,
    onToggleSave,
    onApply,
}: {
    job: ApiJob
    onToggleSave: () => void
    onApply: () => void
}) {
    const salary = formatSalary(job)
    const stage = job.trackStatus && job.trackStatus !== "saved" ? STATUS_BY_ID[job.trackStatus] : null

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <CompanyMark job={job} size="lg" />
                <div className="min-w-0 pt-0.5">
                    <p className="text-base font-semibold text-foreground">{job.company}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {job.location}
                        {job.isStartup && " · Startup"}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
                <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={onApply}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
                >
                    Apply now
                    <ArrowUpRight className="h-4 w-4" />
                </a>
                <button
                    type="button"
                    onClick={onToggleSave}
                    className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-overlay px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-strong"
                >
                    {job.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {job.saved ? "Saved" : "Save"}
                </button>
            </div>

            {stage && (
                <p className="flex items-center gap-2 rounded-xl border border-hairline bg-overlay px-3.5 py-2.5 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", stage.dot)} />
                    Tracked as <span className="font-semibold text-foreground">{stage.label}</span> — change
                    the stage any time from the Tracker.
                </p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
                <DetailFact icon={MapPin} label="Location" value={job.city || job.location} />
                <DetailFact
                    icon={Briefcase}
                    label="Experience"
                    value={LEVEL_LABELS[job.level] || "Not specified"}
                />
                <DetailFact
                    icon={CalendarDays}
                    label="Posted"
                    value={relativeTime(job.postedAt)}
                />
                <DetailFact
                    icon={Building2}
                    label="Type"
                    value={
                        job.employmentType && job.employmentType !== "unknown"
                            ? job.employmentType
                            : "Full-time"
                    }
                />
            </div>

            {salary && (
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {salary} per year
                </p>
            )}

            {job.tags.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {job.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md border border-hairline bg-overlay px-2.5 py-1 text-xs text-foreground"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {job.description ? (
                <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        About the role
                    </h4>
                    {/* The stored description is plain text (HTML is stripped at
                        ingest), so `whitespace-pre-line` is what preserves the
                        posting's paragraphing. Never render it as markup. */}
                    <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                        {job.description}
                    </p>
                </div>
            ) : (
                <p className="rounded-xl border border-hairline bg-overlay p-3.5 text-[13px] text-muted-foreground">
                    No description was published with this listing. Open the role on the
                    employer&apos;s site for the full brief.
                </p>
            )}

            {/* The "verify on the employer's site" line stays — it is a real
                caution for a listing we did not author, and the reason it is
                there does not require naming our plumbing. */}
            <p className="border-t border-hairline pt-4 text-[11px] leading-relaxed text-muted-foreground">
                Always confirm the role and its details on the employer&apos;s own careers page before
                applying.
            </p>
        </div>
    )
}

// ── Tracker ───────────────────────────────────────────────────────────────

/**
 * The application tracker.
 *
 * Same rows as the shortlist — a tracked application IS a saved job that moved
 * past `saved` — so there is one list, one API and one place a job can be. A
 * separate "applications" list would immediately raise "what happens when you
 * apply to something you never saved", and the answer would have to be "it gets
 * saved", which is this.
 */
function TrackerView({
    onStatusChange,
    onRemove,
}: {
    /** Mirrors the change back onto the browse list, which renders the same jobs. */
    onStatusChange: (jobId: string, status: TrackStatus) => void
    onRemove: (jobId: string) => void
}) {
    const [jobs, setJobs] = useState<TrackedJob[] | null>(null)
    const [filter, setFilter] = useState<TrackStatus | "all">("all")
    const [openNotes, setOpenNotes] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        fetch("/api/jobs/saved")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
            .then((data) => {
                if (!cancelled) setJobs(data.jobs || [])
            })
            .catch(() => {
                if (!cancelled) setJobs([])
            })
        return () => {
            cancelled = true
        }
    }, [])

    /** Optimistic; the row reverts if the server rejects it. */
    const setStatus = useCallback(
        async (job: TrackedJob, status: TrackStatus) => {
            const previous = job.status
            setJobs((prev) => (prev ? prev.map((j) => (j.id === job.id ? { ...j, status } : j)) : prev))
            onStatusChange(job.id, status)
            try {
                const res = await fetch("/api/jobs/saved", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobId: job.id, status }),
                })
                if (!res.ok) throw new Error("failed")
            } catch {
                setJobs((prev) =>
                    prev ? prev.map((j) => (j.id === job.id ? { ...j, status: previous } : j)) : prev
                )
                onStatusChange(job.id, previous)
            }
        },
        [onStatusChange]
    )

    const saveNotes = useCallback(async (jobId: string, notes: string) => {
        setJobs((prev) => (prev ? prev.map((j) => (j.id === jobId ? { ...j, notes } : j)) : prev))
        try {
            await fetch("/api/jobs/saved", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, notes }),
            })
        } catch { /* the text is still on screen; a failed note is not worth a modal */ }
    }, [])

    const remove = useCallback(
        (jobId: string) => {
            setJobs((prev) => (prev ? prev.filter((j) => j.id !== jobId) : prev))
            onRemove(jobId)
        },
        [onRemove]
    )

    // Counts come from the rows on screen, not a server field, so they stay
    // correct the instant a status changes without a refetch.
    const counts = useMemo(() => {
        const map: Record<string, number> = {}
        for (const job of jobs || []) map[job.status] = (map[job.status] || 0) + 1
        return map
    }, [jobs])

    if (!jobs) {
        return (
            <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                    <JobCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (!jobs.length) {
        return (
            <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-overlay">
                    <Bookmark className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">Nothing tracked yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                    Bookmark a listing to shortlist it, or hit Apply — anything you apply to lands here
                    automatically so you can follow it through to an offer.
                </p>
            </div>
        )
    }

    const visible = filter === "all" ? jobs : jobs.filter((j) => j.status === filter)
    const applications = jobs.filter((j) => j.status !== "saved").length

    return (
        <div className="space-y-5">
            {/* Pipeline */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {STATUSES.map((status) => {
                    const isActive = filter === status.id
                    return (
                        <button
                            key={status.id}
                            type="button"
                            onClick={() => setFilter(isActive ? "all" : status.id)}
                            className={cn(
                                "rounded-xl border p-3.5 text-left transition-all duration-150",
                                isActive
                                    ? "border-violet-500/50 bg-violet-500/5 shadow-sm"
                                    : "border-hairline bg-card hover:border-violet-500/30"
                            )}
                        >
                            <p className="text-2xl font-bold tabular-nums leading-none text-foreground">
                                {counts[status.id] || 0}
                            </p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                                {status.label}
                            </p>
                        </button>
                    )
                })}
            </div>

            <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{applications}</span> application
                {applications === 1 ? "" : "s"} out of {jobs.length} tracked
                {filter !== "all" && (
                    <button
                        type="button"
                        onClick={() => setFilter("all")}
                        className="ml-2 font-medium text-violet-700 underline underline-offset-2 dark:text-violet-400"
                    >
                        show all
                    </button>
                )}
            </p>

            {visible.length === 0 && (
                <p className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                    Nothing at the {STATUS_BY_ID[filter as TrackStatus]?.label.toLowerCase()} stage yet.
                </p>
            )}

            <div className="space-y-3">
                {visible.map((job) => (
                    <div
                        key={job.id}
                        className="rounded-2xl border border-hairline bg-card p-4 transition-colors hover:border-violet-500/30"
                    >
                        <div className="flex items-start gap-3.5">
                            <CompanyMark job={{ company: job.company, companyLogo: null }} />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold leading-snug text-foreground">
                                    {job.title}
                                </p>
                                <p className="mt-1 truncate text-[13px] text-muted-foreground">
                                    {job.company}
                                    {job.location ? ` · ${job.location}` : ""}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                    {job.appliedAt && (
                                        <span>Applied {relativeTime(job.appliedAt).toLowerCase()}</span>
                                    )}
                                    {!job.stillListed && (
                                        <span className="text-amber-700 dark:text-amber-400">
                                            No longer on the board — the role may have closed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-shrink-0 items-center gap-0.5">
                                <a
                                    href={job.applyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="rounded-lg p-2 text-muted-foreground/70 transition-colors hover:bg-overlay hover:text-foreground"
                                    aria-label="Open listing"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setOpenNotes(openNotes === job.id ? null : job.id)}
                                    aria-label="Notes"
                                    className={cn(
                                        "rounded-lg p-2 transition-colors",
                                        job.notes
                                            ? "text-violet-600 dark:text-violet-400"
                                            : "text-muted-foreground/70 hover:bg-overlay hover:text-foreground"
                                    )}
                                >
                                    <StickyNote className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(job.id)}
                                    aria-label="Remove from tracker"
                                    className="rounded-lg p-2 text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stage picker — the whole point of the tracker, so it is
                            one tap rather than buried in a dropdown. */}
                        <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-hairline pt-3.5">
                            {STATUSES.map((status) => (
                                <button
                                    key={status.id}
                                    type="button"
                                    onClick={() => setStatus(job, status.id)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                                        job.status === status.id
                                            ? status.chip
                                            : "text-muted-foreground hover:bg-overlay"
                                    )}
                                >
                                    {job.status === status.id && (
                                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                                    )}
                                    {status.label}
                                </button>
                            ))}
                        </div>

                        {openNotes === job.id && (
                            <textarea
                                defaultValue={job.notes}
                                placeholder="Recruiter name, round dates, comp discussed…"
                                rows={3}
                                // Saved on blur, not per keystroke: this is a free-text
                                // field and one write per character would be absurd.
                                onBlur={(e) => saveNotes(job.id, e.target.value)}
                                className="mt-3 w-full rounded-xl border border-hairline bg-overlay p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── The tab ───────────────────────────────────────────────────────────────

export function JobsTab() {
    const [view, setView] = useState<"browse" | "tracker">("browse")

    const [searchInput, setSearchInput] = useState("")
    const [q, setQ] = useState("")
    const [category, setCategory] = useState("")
    const [city, setCity] = useState("")
    const [level, setLevel] = useState("any")
    const [startupOnly, setStartupOnly] = useState(false)
    const [sort, setSort] = useState<"recent" | "relevant">("recent")

    const [jobs, setJobs] = useState<ApiJob[]>([])
    const [total, setTotal] = useState(0)
    const [companyCount, setCompanyCount] = useState(0)
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
    const [cityCounts, setCityCounts] = useState<Record<string, number>>({})
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(false)
    const [seeding, setSeeding] = useState(false)

    const [selected, setSelected] = useState<ApiJob | null>(null)

    /** Guards the one-shot "board is empty, ask the server to fill it" call. */
    const seedAttempted = useRef(false)
    /** Only the newest request may write state — filters change faster than
     *  these round-trips finish, and a slow earlier response must not overwrite
     *  a fast later one. */
    const requestId = useRef(0)

    // Debounce the search box: one request per pause, not one per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => setQ(searchInput.trim()), 350)
        return () => clearTimeout(timer)
    }, [searchInput])

    const queryString = useMemo(() => {
        const params = new URLSearchParams()
        if (q) params.set("q", q)
        if (category) params.set("category", category)
        if (city) params.set("city", city)
        if (level !== "any") params.set("level", level)
        if (startupOnly) params.set("startup", "1")
        if (sort !== "recent") params.set("sort", sort)
        return params.toString()
    }, [q, category, city, level, startupOnly, sort])

    const load = useCallback(
        async (targetPage: number) => {
            const id = ++requestId.current
            if (targetPage === 1) setLoading(true)
            else setLoadingMore(true)
            setError(false)
            try {
                const res = await fetch(`/api/jobs?${queryString}&page=${targetPage}`)
                if (!res.ok) throw new Error("failed")
                const data = await res.json()
                if (id !== requestId.current) return
                setJobs((prev) => (targetPage === 1 ? data.jobs : [...prev, ...data.jobs]))
                setTotal(data.total || 0)
                setCompanyCount(data.companyCount || 0)
                setHasMore(!!data.hasMore)
                setPage(targetPage)
                setCategoryCounts(data.categoryCounts || {})
                setCityCounts(data.cityCounts || {})
                setLastUpdatedAt(data.lastUpdatedAt || null)
            } catch {
                if (id === requestId.current) setError(true)
            } finally {
                if (id === requestId.current) {
                    setLoading(false)
                    setLoadingMore(false)
                }
            }
        },
        [queryString]
    )

    useEffect(() => {
        load(1)
    }, [load])

    /**
     * First-run seeding. An empty board with NO filters applied means the cache
     * has never been built (or the deploy is new) — ask the server for an
     * ingest, once. An empty board *with* filters is just a narrow search, and
     * refetching would do nothing.
     */
    useEffect(() => {
        if (loading || error || total > 0 || queryString || seedAttempted.current) return
        seedAttempted.current = true
        setSeeding(true)
        fetch("/api/jobs/refresh", { method: "POST" })
            .then(() => load(1))
            .catch(() => { /* the empty state already says what to do */ })
            .finally(() => setSeeding(false))
    }, [loading, error, total, queryString, load])

    /** Writes a job's tracker state into both the list and the open sheet — they
     *  render the same job, so every mutation has to touch both. */
    const patchJob = useCallback((jobId: string, patch: Partial<ApiJob>) => {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)))
        setSelected((prev) => (prev && prev.id === jobId ? { ...prev, ...patch } : prev))
    }, [])

    const toggleSave = useCallback(
        async (job: ApiJob) => {
            const nextSaved = !job.saved
            const before = { saved: job.saved, trackStatus: job.trackStatus }
            patchJob(job.id, { saved: nextSaved, trackStatus: nextSaved ? "saved" : null })
            try {
                const res = nextSaved
                    ? await fetch("/api/jobs/saved", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jobId: job.id }),
                    })
                    : await fetch(`/api/jobs/saved?jobId=${encodeURIComponent(job.id)}`, { method: "DELETE" })
                if (!res.ok) throw new Error("failed")
            } catch {
                // Roll back rather than leave a bookmark that isn't really there.
                patchJob(job.id, before)
            }
        },
        [patchJob]
    )

    /**
     * Clicking Apply files the job under "applied".
     *
     * The link still opens — this runs alongside it, not instead of it. Asking
     * "did you apply?" after the fact is the step every job tracker loses people
     * on, and the guess is a good one: you clicked through to the application
     * form. It is one tap to correct in the tracker, and an already-tracked job
     * is never demoted (clicking Apply again while "interviewing" must not send
     * you back to "applied").
     */
    const markApplied = useCallback(
        (job: ApiJob) => {
            if (job.trackStatus && job.trackStatus !== "saved") return
            patchJob(job.id, { saved: true, trackStatus: "applied" })
            fetch("/api/jobs/saved", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId: job.id, status: "applied" }),
            }).catch(() => patchJob(job.id, { saved: job.saved, trackStatus: job.trackStatus }))
        },
        [patchJob]
    )

    /** Mirrors a tracker edit back onto the browse list. */
    const handleTrackerStatus = useCallback(
        (jobId: string, status: TrackStatus) => patchJob(jobId, { saved: true, trackStatus: status }),
        [patchJob]
    )

    const handleTrackerRemove = useCallback(
        (jobId: string) => {
            patchJob(jobId, { saved: false, trackStatus: null })
            fetch(`/api/jobs/saved?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" }).catch(() => { })
        },
        [patchJob]
    )

    const activeFilterCount =
        (category ? 1 : 0) + (city ? 1 : 0) + (level !== "any" ? 1 : 0) + (startupOnly ? 1 : 0)

    const clearFilters = useCallback(() => {
        setCategory("")
        setCity("")
        setLevel("any")
        setStartupOnly(false)
        setSearchInput("")
    }, [])

    /**
     * Only cities with openings become chips — a "Kolkata 0" chip is a dead end,
     * and a board offering filters that lead nowhere reads as fake.
     *
     * The SELECTED city is always kept, even at zero. Without that exception it
     * disappears the moment another filter empties it, leaving the filter
     * applied and no control to switch it off — the list says "no jobs match"
     * and the thing causing it is invisible.
     */
    const cityChips = useMemo(
        () => CITIES.filter((name) => (cityCounts[name] || 0) > 0 || name === city),
        [cityCounts, city]
    )

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">Jobs in India</h2>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            Live
                        </span>
                    </div>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        Live engineering roles at India&apos;s top product companies and startups —
                        refreshed through the day, with closed roles removed automatically.
                    </p>
                    {!loading && !error && total > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {total.toLocaleString("en-IN")}
                                </span>{" "}
                                open roles
                            </span>
                            <span className="h-3 w-px bg-hairline" />
                            <span>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {companyCount}
                                </span>{" "}
                                companies hiring
                            </span>
                            {lastUpdatedAt && (
                                <>
                                    <span className="h-3 w-px bg-hairline" />
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        Updated {relativeTime(lastUpdatedAt).toLowerCase()}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-hairline bg-overlay p-1">
                    <button
                        type="button"
                        onClick={() => setView("browse")}
                        className={cn(
                            "rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                            view === "browse"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Briefcase className="mr-1.5 inline h-3.5 w-3.5" />
                        Browse
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("tracker")}
                        className={cn(
                            "rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                            view === "tracker"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Bookmark className="mr-1.5 inline h-3.5 w-3.5" />
                        Tracker
                    </button>
                </div>
            </div>

            {view === "tracker" ? (
                <TrackerView onStatusChange={handleTrackerStatus} onRemove={handleTrackerRemove} />
            ) : (
                <>
                    {/* ── Filters ── */}
                    <div className="space-y-3.5 rounded-2xl border border-hairline bg-card/60 p-4">
                        <div className="flex flex-col gap-2.5 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search role, company or skill — “react”, “Swiggy”, “node”"
                                    className="h-11 rounded-xl border-hairline bg-background pl-10"
                                />
                            </div>
                            <div className="flex gap-2.5">
                                <Select value={level} onValueChange={setLevel}>
                                    <SelectTrigger className="h-11 w-[10rem] rounded-xl border-hairline bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LEVELS.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={sort}
                                    onValueChange={(value) => setSort(value as "recent" | "relevant")}
                                >
                                    <SelectTrigger className="h-11 w-[9rem] rounded-xl border-hairline bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recent">Newest first</SelectItem>
                                        <SelectItem value="relevant">Most relevant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {CATEGORIES.map((option) => (
                                <FilterChip
                                    key={option.id || "all"}
                                    active={category === option.id}
                                    count={option.id ? categoryCounts[option.id] : undefined}
                                    onClick={() => setCategory(option.id)}
                                >
                                    {option.label}
                                </FilterChip>
                            ))}
                        </div>

                        {/* City + startups */}
                        {(cityChips.length > 0 || activeFilterCount > 0) && (
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3.5">
                                <span className="mr-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    City
                                </span>
                                {cityChips.map((name) => (
                                    <FilterChip
                                        key={name}
                                        active={city === name}
                                        count={cityCounts[name]}
                                        onClick={() => setCity(city === name ? "" : name)}
                                    >
                                        {name === "Remote" ? (
                                            <>
                                                <Globe2 className="h-3 w-3" />
                                                Remote
                                            </>
                                        ) : (
                                            name
                                        )}
                                    </FilterChip>
                                ))}
                                <span className="mx-1 hidden h-4 w-px bg-hairline sm:block" />
                                <FilterChip active={startupOnly} onClick={() => setStartupOnly((v) => !v)}>
                                    <Rocket className="h-3 w-3" />
                                    Startups
                                </FilterChip>
                                {activeFilterCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                        Clear {activeFilterCount}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Results ── */}
                    {loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <JobCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-hairline bg-card px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-foreground">
                                We couldn&apos;t load the job board
                            </p>
                            <p className="mt-1.5 text-[13px] text-muted-foreground">
                                Something went wrong on our side. Please refresh the page.
                            </p>
                        </div>
                    ) : seeding ? (
                        <div className="rounded-2xl border border-hairline bg-card px-6 py-14 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600 dark:text-violet-400" />
                            <p className="mt-4 text-sm font-semibold text-foreground">
                                Building your job board…
                            </p>
                            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                                Setting up your board for the first time. This takes about a minute.
                            </p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-overlay">
                                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-foreground">
                                No jobs match these filters
                            </p>
                            <p className="mt-1.5 text-[13px] text-muted-foreground">
                                Try a different role, city or experience level.
                            </p>
                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-5 rounded-xl border border-hairline bg-overlay px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-overlay-strong"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {jobs.map((job) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        active={selected?.id === job.id}
                                        onOpen={() => setSelected(job)}
                                        onToggleSave={() => toggleSave(job)}
                                    />
                                ))}
                            </div>

                            {hasMore ? (
                                <div className="flex justify-center pt-1">
                                    <button
                                        type="button"
                                        disabled={loadingMore}
                                        onClick={() => load(page + 1)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-violet-500/40 hover:shadow-sm disabled:opacity-60"
                                    >
                                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Show more jobs
                                    </button>
                                </div>
                            ) : (
                                <p className="pt-1 text-center text-xs text-muted-foreground">
                                    That&apos;s all {total.toLocaleString("en-IN")} matching{" "}
                                    {total === 1 ? "role" : "roles"}.
                                </p>
                            )}
                        </>
                    )}
                </>
            )}

            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
                    {selected && (
                        <>
                            <SheetHeader className="border-b border-hairline">
                                <SheetTitle className="pr-6 text-left text-lg leading-snug">
                                    {selected.title}
                                </SheetTitle>
                                <SheetDescription className="text-left">
                                    {selected.company} · {selected.city || selected.location}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="px-4 pb-10 pt-5">
                                <JobDetail
                                    job={selected}
                                    onToggleSave={() => toggleSave(selected)}
                                    onApply={() => markApplied(selected)}
                                />
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
