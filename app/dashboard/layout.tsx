"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

/**
 * Theme boundary for the dashboard (PRD-006 Phase 2).
 *
 * Like the reader, next-themes is scoped here rather than in the root layout
 * (a global provider using usePathname breaks styled-jsx SSR sitewide). The
 * stored preference (next-themes default `theme` key) is shared with the
 * reader, so a user's light/dark choice carries across both surfaces.
 *
 */
export default function DashboardLayout({
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
