"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

/**
 * Theme boundary for the public DSA pages.
 *
 * next-themes is mounted HERE, scoped to /dsa — not in the root layout. That is
 * not a stylistic choice: mounting it globally with a pathname-based wrapper
 * breaks styled-jsx SSR sitewide (see the theming note in CLAUDE.md), which is
 * why the Learn reader and the dashboard each mount their own. A new top-level
 * route that forgets this renders fine and then quietly ignores the toggle,
 * because there is no provider above it.
 *
 * The stored preference is the same key next-themes uses everywhere else, so a
 * learner who picked dark in the reader gets dark here too.
 */
export default function DsaLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="min-h-screen bg-reader-bg">{children}</div>
        </ThemeProvider>
    )
}
