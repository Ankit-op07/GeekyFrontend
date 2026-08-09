"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONTEST_LOGOS } from "@/lib/contests/logos"

export interface PlannedContest {
    fingerprint: string
    platform: string
    name: string
    url: string
    startsAt: string
    endsAt: string
    reminded: boolean
}

/** Local calendar day key. Deliberately NOT toISOString().slice(0,10) — that is
 *  the UTC date, so an 01:00 IST contest would land on the previous day for
 *  every Indian learner. */
function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/**
 * A month view of what the learner has planned.
 *
 * WHY A MONTH GRID AND NOT A LIST. The plans list is already the list — the
 * calendar exists to answer a different question: "how does this sit against
 * the rest of my week?" Two contests on the same evening, or three in one
 * weekend, are invisible in a chronological list and obvious in a grid.
 *
 * The week starts on MONDAY. Contests cluster on weekends, and a Sunday-first
 * grid splits every weekend across two rows, which is precisely the thing this
 * view is meant to make visible.
 */
export function ContestCalendar({
    plans,
    onSelect,
}: {
    plans: PlannedContest[]
    /** Opens a day's detail below the grid. */
    onSelect: (day: Date | null) => void
}) {
    const [monthOffset, setMonthOffset] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)

    const { cells, monthLabel, monthStart } = useMemo(() => {
        const today = new Date()
        const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)

        // Monday-first offset: getDay() is 0=Sunday, so Sunday must map to 6.
        const lead = (monthStart.getDay() + 6) % 7
        const daysInMonth = new Date(
            monthStart.getFullYear(),
            monthStart.getMonth() + 1,
            0
        ).getDate()

        const cells: (Date | null)[] = []
        for (let i = 0; i < lead; i++) cells.push(null)
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), d))
        }
        // Pad to whole weeks so the grid does not reflow as months change length.
        while (cells.length % 7 !== 0) cells.push(null)

        return {
            cells,
            monthStart,
            monthLabel: monthStart.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
            }),
        }
    }, [monthOffset])

    const byDay = useMemo(() => {
        const map = new Map<string, PlannedContest[]>()
        for (const p of plans) {
            const key = dayKey(new Date(p.startsAt))
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(p)
        }
        return map
    }, [plans])

    const todayKey = dayKey(new Date())
    const selectedPlans = selected ? byDay.get(selected) || [] : []

    return (
        <div className="rounded-2xl border border-hairline bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">{monthLabel}</h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMonthOffset((m) => m - 1)}
                        aria-label="Previous month"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {monthOffset !== 0 && (
                        <button
                            onClick={() => setMonthOffset(0)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-overlay dark:text-violet-400"
                        >
                            Today
                        </button>
                    )}
                    <button
                        onClick={() => setMonthOffset((m) => m + 1)}
                        aria-label="Next month"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-overlay hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                    >
                        {d}
                    </div>
                ))}

                {cells.map((date, i) => {
                    if (!date) return <div key={`pad-${i}`} />

                    const key = dayKey(date)
                    const dayPlans = byDay.get(key) || []
                    const isToday = key === todayKey
                    const isSelected = key === selected

                    return (
                        <button
                            key={key}
                            onClick={() => {
                                const next = isSelected ? null : key
                                setSelected(next)
                                onSelect(next ? date : null)
                            }}
                            disabled={dayPlans.length === 0}
                            className={cn(
                                "flex min-h-[3.25rem] flex-col items-center gap-1 rounded-lg p-1.5 transition-colors",
                                dayPlans.length > 0
                                    ? "hover:bg-overlay"
                                    : "cursor-default opacity-60",
                                isSelected && "bg-violet-500/10 ring-1 ring-violet-500"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                                    isToday
                                        ? "bg-violet-600 font-semibold text-white"
                                        : "text-foreground"
                                )}
                            >
                                {date.getDate()}
                            </span>

                            {/* Platform marks rather than a count: which contest
                                it is matters more than how many, and at three
                                marks the day is visibly busy anyway. */}
                            {dayPlans.length > 0 && (
                                <span className="flex flex-wrap items-center justify-center gap-0.5">
                                    {dayPlans.slice(0, 3).map((p) => {
                                        const logo = CONTEST_LOGOS[p.platform]
                                        return logo ? (
                                            <span
                                                key={p.fingerprint}
                                                className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white p-[1px]"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={logo}
                                                    alt=""
                                                    aria-hidden
                                                    className="h-full w-full object-contain"
                                                />
                                            </span>
                                        ) : (
                                            <span
                                                key={p.fingerprint}
                                                className="h-1.5 w-1.5 rounded-full bg-violet-500"
                                            />
                                        )
                                    })}
                                    {dayPlans.length > 3 && (
                                        <span className="text-[9px] font-semibold text-muted-foreground">
                                            +{dayPlans.length - 3}
                                        </span>
                                    )}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {selected && selectedPlans.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-hairline pt-4">
                    {selectedPlans
                        .slice()
                        .sort(
                            (a, b) =>
                                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
                        )
                        .map((p) => (
                            <a
                                key={p.fingerprint}
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 rounded-xl border border-hairline p-3 transition-colors hover:border-violet-500/40"
                            >
                                <span className="w-14 flex-shrink-0 text-xs font-semibold tabular-nums text-foreground">
                                    {new Date(p.startsAt).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                    {p.name}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </a>
                        ))}
                </div>
            )}

            {plans.length === 0 && (
                <p className="mt-4 border-t border-hairline pt-4 text-center text-xs text-muted-foreground">
                    Mark a contest as planned and it will appear here.
                </p>
            )}
        </div>
    )
}
