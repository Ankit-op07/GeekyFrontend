"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

/**
 * Theme boundary for the Learn reader (PRD-006 Phase 1).
 *
 * next-themes is mounted here — scoped to the `/learn` tree — rather than in
 * the root layout. This keeps light/dark theming confined to the migrated
 * reader surface: checkout, marketing, dashboard and admin are untouched until
 * their own phases, honouring the PRD guardrail of keeping a cosmetic refactor
 * away from the money path. Default is `system`; the reader toolbar toggle
 * lets a user override it.
 */
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
