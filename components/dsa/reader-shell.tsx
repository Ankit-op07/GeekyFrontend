"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Lock,
    Menu,
    Binary,
    X,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { DsaNavSection } from "@/lib/dsa/nav"

/**
 * The reading shell for /dsa approach pages.
 *
 * Deliberately the SAME layout as the Learn reader (app/learn/[kitSlug]/layout):
 * a fixed 18rem sidebar listing the whole catalogue, a mobile top bar with a
 * drawer, the theme toggle in the sidebar footer, and content offset by
 * `lg:ml-72`. Two reasons for matching it rather than inventing a second
 * reading layout — a learner who moves between a lesson and an approach page
 * should not have to re-learn where things are, and the reader's shell has
 * already been through the theming and contrast work described in CLAUDE.md.
 *
 * Nav data arrives as props from the server (see lib/dsa/nav.ts) so that no
 * approach markdown reaches the client bundle.
 */
export function DsaReaderShell({
    nav,
    currentSectionId,
    currentProblemId,
    children,
}: {
    nav: DsaNavSection[]
    currentSectionId: string
    currentProblemId: string
    children: React.ReactNode
}) {
    const [mobileOpen, setMobileOpen] = useState(false)
    // Only the section you are reading starts open. Seventeen expanded sections
    // is a 155-row scroll with no shape to it; one open section shows where you
    // are and keeps the other sixteen one click away.
    const [expanded, setExpanded] = useState<Set<string>>(new Set([currentSectionId]))

    // Following prev/next across a section boundary should open the section you
    // landed in, the same way the reader re-opens the active chapter.
    useEffect(() => {
        setExpanded(new Set([currentSectionId]))
    }, [currentSectionId])

    // Navigating from inside the drawer must close it, or the new page renders
    // underneath the overlay on mobile.
    useEffect(() => {
        setMobileOpen(false)
    }, [currentProblemId])

    const toggle = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const renderSection = (section: DsaNavSection, index: number) => {
        const isOpen = expanded.has(section.id)
        const isCurrent = section.id === currentSectionId

        return (
            <div key={section.id}>
                <button
                    onClick={() => toggle(section.id)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-reader-surface-hover"
                >
                    {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-reader-faint" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-reader-faint" />
                    )}
                    <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-reader-muted">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                        className={`truncate text-sm font-medium transition-colors ${
                            isCurrent
                                ? "text-reader-heading"
                                : "text-reader-text group-hover:text-reader-heading"
                        }`}
                    >
                        {section.title}
                    </span>
                    {/* Coverage, not progress: this is how much of the section WE
                        have written, and it is why some rows below are dead. */}
                    <span className="ml-auto flex-shrink-0 text-[10px] tabular-nums text-reader-faint">
                        {section.writtenCount}/{section.problems.length}
                    </span>
                </button>

                {isOpen && (
                    <div className="mb-1 ml-5 space-y-0.5 border-l border-reader-border pl-3">
                        {section.problems.map((problem) => {
                            const isActive = problem.id === currentProblemId

                            if (!problem.written) {
                                return (
                                    <div
                                        key={problem.id}
                                        title="We have not written this one up yet"
                                        className="flex cursor-not-allowed select-none items-center gap-1.5 px-3 py-1.5 text-sm text-reader-faint opacity-70"
                                    >
                                        <span className="min-w-0 flex-1 truncate">
                                            {problem.title}
                                        </span>
                                        <Lock className="h-3 w-3 flex-shrink-0" />
                                    </div>
                                )
                            }

                            return (
                                <Link
                                    key={problem.id}
                                    href={`/dsa/${section.id}/${problem.id}`}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`block truncate rounded-md px-3 py-1.5 text-sm transition-all ${
                                        isActive
                                            ? "-ml-[1px] border-l-2 border-reader-accent bg-reader-accent-soft font-medium text-reader-accent-hover"
                                            : "text-reader-faint hover:bg-reader-surface-hover hover:text-reader-text"
                                    }`}
                                >
                                    {problem.title}
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-reader-bg">
            {/* ─── Sidebar (desktop) ─── */}
            <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-72 flex-col border-r border-reader-border bg-reader-surface lg:flex">
                <Link
                    href="/dashboard?tab=dsa"
                    className="group flex items-center gap-3 border-b border-reader-border px-5 py-4 transition-colors hover:bg-reader-surface-hover"
                >
                    <ArrowLeft className="h-4 w-4 flex-shrink-0 text-reader-faint transition-colors group-hover:text-reader-accent" />
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                        <Binary className="h-4 w-4 text-white" />
                    </span>
                    <span className="truncate text-sm font-semibold text-reader-heading">
                        DSA Sheet
                    </span>
                </Link>

                <nav
                    aria-label="All problems"
                    className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3"
                >
                    {nav.map(renderSection)}
                </nav>

                <div className="flex items-center justify-between gap-2 border-t border-reader-border px-4 py-3">
                    <span className="text-xs font-medium text-reader-faint">Appearance</span>
                    <ThemeToggle />
                </div>
            </aside>

            {/* ─── Mobile top bar ─── */}
            <div className="fixed left-0 right-0 top-0 z-40 border-b border-reader-border bg-reader-surface/95 backdrop-blur lg:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open the problem list"
                            className="rounded-lg p-1.5 hover:bg-reader-surface-hover"
                        >
                            <Menu className="h-5 w-5 text-reader-muted" />
                        </button>
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                            <Binary className="h-3.5 w-3.5 text-white" />
                        </span>
                        <span className="truncate text-sm font-semibold text-reader-heading">
                            DSA Sheet
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            {/* ─── Mobile drawer ─── */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-reader-border bg-reader-surface lg:hidden">
                        <div className="flex items-center justify-between border-b border-reader-border px-4 py-3">
                            <Link
                                href="/dashboard?tab=dsa"
                                className="flex items-center gap-2 text-sm font-semibold text-reader-heading"
                            >
                                <ArrowLeft className="h-4 w-4 text-reader-faint" />
                                DSA Sheet
                            </Link>
                            <button
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close the problem list"
                                className="rounded p-1 hover:bg-reader-surface-hover"
                            >
                                <X className="h-5 w-5 text-reader-muted" />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-0.5 px-2 py-3">
                            {nav.map(renderSection)}
                        </nav>
                    </aside>
                </>
            )}

            <main className="min-h-screen max-w-full flex-1 overflow-x-clip pt-14 lg:ml-72 lg:pt-0">
                {children}
            </main>
        </div>
    )
}
