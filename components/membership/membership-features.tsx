"use client"

import { BookOpen, Binary, CalendarClock, Briefcase, Map as MapIcon, Trophy } from "lucide-react"

/**
 * What a membership gets you, as a scannable list.
 *
 * Concrete numbers, not adjectives — "155 problems" and "50+ company boards" are
 * checkable claims; "comprehensive DSA content" is not, and a reader discounts
 * it accordingly.
 *
 * DESIGN: no boxes, no coloured tiles. Six rows on a hairline grid, icons in one
 * muted weight. Feature grids get noisy fast because every card competes; here
 * the type carries the hierarchy and the icons are just anchors for the eye.
 *
 * ⚠️ EVERY ENTRY MUST BE A FEATURE THAT REALLY SHIPS — the same rule as
 * BONUS_CATALOG in lib/offers.ts. If a feature is removed, remove its row in the
 * same commit. A pricing page listing something the product no longer does is a
 * refund request with extra steps.
 */

export const MEMBERSHIP_FEATURES = [
    {
        icon: BookOpen,
        title: "Every kit",
        body: "JavaScript, React, Frontend System Design, Angular, Node, Java and DevOps — plus anything added while you're a member.",
    },
    {
        icon: Binary,
        title: "DSA Sheet",
        body: "155 problems grouped by the idea they teach, each with a written approach, a video solution, your notes and progress tracking.",
    },
    {
        icon: Briefcase,
        title: "Job board",
        body: "Indian developer roles from 50+ company boards, deduplicated into one list, with a tracker that remembers where you applied.",
    },
    {
        icon: CalendarClock,
        title: "Contest tracker",
        body: "Every upcoming Codeforces, AtCoder, CodeChef and LeetCode round. Mark the ones you'll sit; we email you the morning of.",
    },
    {
        icon: MapIcon,
        title: "Interview roadmaps",
        body: "Week-by-week plans that sequence the kits and the DSA sheet into a schedule instead of a pile of links.",
    },
    {
        icon: Trophy,
        title: "Quizzes & leaderboard",
        body: "Server-graded questions at the end of every lesson, and a leaderboard ranked on what you actually got right.",
    },
] as const

export function MembershipFeatures() {
    return (
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {MEMBERSHIP_FEATURES.map((f) => (
                <div key={f.title} className="flex gap-3.5">
                    <f.icon
                        className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-violet-700 dark:text-violet-400"
                        strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{f.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
