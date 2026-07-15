"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  // Avoid hydration mismatch: don't render theme-dependent icon until mounted.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative text-muted-foreground hover:text-foreground", className)}
          aria-label="Toggle theme"
        >
          {/* Sun in light, Moon in dark — cross-fade via dark: variant */}
          <Sun
            className={cn(
              "size-5 transition-all",
              mounted && "dark:-rotate-90 dark:scale-0"
            )}
          />
          <Moon
            className={cn(
              "absolute size-5 rotate-90 scale-0 transition-all",
              mounted && "dark:rotate-0 dark:scale-100"
            )}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="gap-2"
          >
            <Icon className="size-4" />
            <span>{label}</span>
            {mounted && theme === value && (
              <Check className="ml-auto size-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
