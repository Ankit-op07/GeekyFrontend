"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // next-themes is scoped to themed subtrees (/learn, /dashboard) rather than the
  // root. It writes its theme class to <html> but never removes it, so on a
  // client-side navigation OUT of a themed surface the `.dark` class would linger
  // and flip global tokens on un-themed marketing/checkout pages (PRD-006 keeps
  // theming off the money path). Strip it when the provider unmounts; next-themes
  // re-applies from localStorage when a themed surface mounts again.
  React.useEffect(() => {
    return () => {
      const el = document.documentElement
      el.classList.remove("light", "dark")
      el.style.colorScheme = ""
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
