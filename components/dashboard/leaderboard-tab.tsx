"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Medal, Target, CheckCircle2, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RowListSkeleton } from "@/components/dashboard/skeletons"
import { cn } from "@/lib/utils"

/**
 * The LEARNING-KIT QUIZ leaderboard — question completion across the
 * end-of-topic quizzes in the kits.
 *
 * The platform has two separate things a learner "solves" and this board counts
 * only one of them. The DSA sheet is the other, and it is excluded on purpose:
 * its solved state is a checkbox the learner ticks themselves, so ranking on it
 * would rank willingness to tick boxes. A DSA board would need its own verified
 * signal, not this one widened.
 *
 * That distinction is carried by the nav label ("Quiz Leaderboard") and the
 * list header ("Kit quiz rankings"), not by a banner — an explanatory hero was
 * built here and removed as clutter. Keep those two labels honest if the source
 * of the ranking ever changes.
 *
 * Ranks learners by quiz questions answered correctly. It replaced a board that
 * ranked by React-kit topics completed, which had two problems this one does
 * not: a completed topic is a self-ticked checkbox (no verification at all), and
 * ranking by *percentage* of a kit meant whoever started earliest stayed on top
 * regardless of recent effort.
 *
 * Quiz questions are graded on the server and recorded once per person per
 * question, so this number cannot be inflated by re-answering. See the route at
 * app/api/leaderboard/quiz/route.ts for how that is enforced — twice, and for
 * good reason.
 */

interface Row {
    rank: number
    userId: string
    name: string
    initials: string
    profilePicture: string | null
    streak: number
    /** Distinct questions attempted. One row per question, so this is people-work, not clicks. */
    completed: number
    /** Of those, how many were right. This is what the ranking is on. */
    correct: number
    accuracy: number
    lastActiveAt: string
}

export function LeaderboardTab() {
    const [rows, setRows] = useState<Row[]>([])
    const [me, setMe] = useState<Row | null>(null)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/leaderboard/quiz")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!data) return
                setRows(data.leaderboard || [])
                setMe(data.me || null)
                setTotalQuestions(data.totalQuestions || 0)
            })
            .catch(() => {
                /* an empty board is a valid state */
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="max-w-5xl space-y-6">
                <RowListSkeleton count={7} />
            </div>
        )
    }

    const topThree = rows.slice(0, 3)
    // Someone ranked 61st still needs to see themselves. The API returns `me`
    // independently of the top-50 slice for exactly this case; pinning it again
    // above the list would just duplicate a row already visible.
    const meIsInList = me ? rows.some((r) => r.userId === me.userId) : false

    return (
        <div className="max-w-5xl space-y-6">
            {/* ── Your rank ────────────────────────────────────────────── */}
            {me && (
                <div className="rounded-2xl border border-violet-500/20 bg-card p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 font-bold text-white">
                                #{me.rank}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Your quiz rank</p>
                                <p className="text-sm text-muted-foreground">
                                    {me.correct} correct of {me.completed} quiz questions answered
                                    {totalQuestions > 0 && ` · ${totalQuestions - me.completed} left to try`}
                                </p>
                            </div>
                        </div>
                        <div className="sm:w-56">
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Accuracy</span>
                                <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                                    {me.accuracy}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                                    style={{ width: `${me.accuracy}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Podium ───────────────────────────────────────────────── */}
            {topThree.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {topThree.map((row) => (
                        <PodiumCard key={row.userId} row={row} isMe={row.userId === me?.userId} />
                    ))}
                </div>
            )}

            {/* ── Full list ────────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
                {/* No participant count here, deliberately. "Top 50 of 189"
                    published the size of the user base on a page any learner can
                    open — and the `${participants} ranked` fallback leaked the
                    same number, so both went. The API still returns
                    `participants`; it just is not displayed. */}
                <div className="border-b border-hairline px-5 py-4">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                        <Medal className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                        Kit quiz rankings
                    </h3>
                </div>

                {rows.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-1 font-semibold text-foreground">Nobody is ranked yet</p>
                        <p className="mb-5 text-sm text-muted-foreground">
                            Answer the quiz at the end of any kit lesson to put yourself on the
                            board.
                        </p>
                        <Button className="bg-cyan-600 text-white hover:bg-cyan-500" asChild>
                            <Link href="/dashboard?tab=kits">Open a kit</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-hairline">
                            {rows.map((row) => (
                                <ListRow
                                    key={row.userId}
                                    row={row}
                                    isMe={row.userId === me?.userId}
                                />
                            ))}
                        </div>
                        {/* Ranked, but below the cut. Shown as its own row so the
                            board is never a page you cannot find yourself on. */}
                        {me && !meIsInList && (
                            <div className="border-t border-hairline">
                                <ListRow row={me} isMe />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function PodiumCard({ row, isMe }: { row: Row; isMe: boolean }) {
    // Literal class strings, not `from-${...}` — Tailwind cannot see an
    // interpolated class name and purges it.
    const medal =
        row.rank === 1
            ? "from-amber-400 to-yellow-600"
            : row.rank === 2
              ? "from-slate-300 to-slate-500"
              : "from-orange-400 to-amber-700"

    return (
        <div
            className={cn(
                "rounded-2xl border bg-card p-5",
                isMe ? "border-violet-500/30" : "border-hairline"
            )}
        >
            <div className="mb-4 flex items-start justify-between">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg",
                        medal
                    )}
                >
                    #{row.rank}
                </div>
                {isMe && (
                    <Badge className="border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300">
                        You
                    </Badge>
                )}
            </div>

            <div className="mb-4 flex items-center gap-3">
                <Avatar row={row} />
                <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.accuracy}% accuracy</p>
                </div>
            </div>

            <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-foreground">{row.correct}</span>
                <span className="text-xs text-muted-foreground">
                    correct · {row.completed} answered
                </span>
                {/* `correct` is the ranked number; the podium reads top-down as
                    "103 correct of 127 answered", matching the list rows. */}
            </div>
        </div>
    )
}

function ListRow({ row, isMe }: { row: Row; isMe: boolean }) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center",
                isMe ? "bg-violet-500/10" : "hover:bg-overlay"
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-hairline bg-overlay text-sm font-bold tabular-nums text-foreground">
                    {row.rank}
                </div>
                <Avatar row={row} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">{row.name}</p>
                        {isMe && (
                            <Badge className="h-4 border-violet-500/20 bg-violet-500/10 px-1.5 py-0 text-[10px] text-violet-700 dark:text-violet-300">
                                You
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {row.completed} quiz questions answered
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-3 sm:w-[280px] sm:gap-4">
                <Stat
                    icon={<CheckCircle2 className="h-3 w-3" />}
                    value={String(row.correct)}
                    label="Correct"
                    tone="text-emerald-700 dark:text-emerald-400"
                />
                <Stat
                    icon={<Target className="h-3 w-3" />}
                    value={`${row.accuracy}%`}
                    label="Accuracy"
                    tone="text-cyan-700 dark:text-cyan-300"
                />
                <Stat
                    icon={<Flame className="h-3 w-3" />}
                    value={`${row.streak}d`}
                    label="Streak"
                    tone="text-orange-700 dark:text-orange-400"
                />
            </div>
        </div>
    )
}

function Stat({
    icon,
    value,
    label,
    tone,
}: {
    icon: React.ReactNode
    value: string
    label: string
    tone: string
}) {
    return (
        <div className="text-right">
            <p className={cn("flex items-center justify-end gap-1 text-sm font-semibold tabular-nums", tone)}>
                {icon}
                {value}
            </p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    )
}

function Avatar({ row }: { row: Row }) {
    if (row.profilePicture) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={row.profilePicture}
                alt={row.name}
                className="h-10 w-10 flex-shrink-0 rounded-full border border-hairline object-cover"
            />
        )
    }
    return (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
            {row.initials}
        </div>
    )
}
