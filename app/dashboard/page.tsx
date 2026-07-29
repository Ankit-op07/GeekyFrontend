// app/dashboard/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard, BookOpen, TrendingUp, Award, Settings,
    LogOut, X, Menu, User, Mail, Calendar, CheckCircle2,
    Target, Clock, Star, ChevronRight, Package, Lock,
    BarChart2, Flame, RefreshCw, ShoppingBag, Building2, ArrowRight,
    Trophy, Medal, Bot, Mic, MicOff, PlayCircle, RotateCcw,
    MessageSquare, Brain, Timer, Send, Sparkles, Video,
    ClipboardCheck, FileText, Eye, ShoppingCart, Shield, Bookmark,
    Map as MapIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { CompanyQuestionsTab } from "@/components/dashboard/company-questions-tab"
import { BookmarksTab, BookmarksPreview } from "@/components/dashboard/bookmarks-tab"
import { AiInterviewTab } from "@/components/dashboard/ai-interview-tab"
import { RoadmapTab } from "@/components/dashboard/roadmap-tab"
import { KitLogo, getKitLogo } from "@/components/kit-logo"
import { getCheckoutPathForKit } from "@/lib/checkout-paths"

interface SessionUser {
    id: string
    email: string
    name: string
    profilePicture?: string
    purchasedKits?: string[]
    isAdmin?: boolean
}

/** DB Kit shape from /api/learn/kits */
import { BundleUpsell } from "@/components/bundle-upsell"
import { NewKitsBanner } from "@/components/dashboard/new-kits-banner"
import { OfferBanner } from "@/components/offer-banner"

interface DbKit {
    _id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    chaptersCount: number;
    topicsCount: number;
    hasAccess: boolean;
}

/**
 * Deep-link "Continue learning" straight to the topic the user last read in
 * this kit, falling back to the kit landing. Uses the `gf-last-topic-${slug}`
 * localStorage key the reader already writes — same client-only source the
 * dashboard uses for its "topics studied" count. These cards only render after
 * a client fetch, so reading localStorage here is safe (no SSR/hydration path).
 */
function getResumeHref(slug: string): string {
    if (typeof window !== "undefined") {
        const last = localStorage.getItem(`gf-last-topic-${slug}`)
        if (last) return `/learn/${slug}/${last}`
    }
    return `/learn/${slug}`
}


/** Time-of-day greeting. Module scope because the top bar renders it for the
 *  overview tab — it used to be a full-width banner inside OverviewTab, which
 *  pushed the actual content (kits) below the fold. */
function getGreeting() {
    const hour = new Date().getHours()
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
}

const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "kits", label: "My Kits", icon: Package },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "roadmap", label: "Roadmaps", icon: MapIcon },
    // Hidden for now — feature kept in code, just not surfaced on the dashboard yet.
    // { id: "ai-interview", label: "AI Interview", icon: Bot },
    // { id: "team-interview", label: "Team Interview", icon: Video },
    // { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
]

export default function DashboardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    /**
     * THE URL IS THE ONLY SOURCE OF TRUTH FOR WHICH TAB IS OPEN.
     *
     * This used to be `useState(tabParam)` kept in sync by an effect on
     * `tabParam`, with the sidebar calling setState and never touching the URL.
     * Two failures came out of that:
     *   • the address bar never reflected the tab, so no tab but the default
     *     was linkable or reachable with Back;
     *   • state and URL could disagree, and then a tab became unreachable —
     *     open Roadmaps (URL becomes ?tab=roadmap), switch to Bookmarks (state
     *     only, URL still says roadmap), click Roadmaps again: the navigation
     *     targets the URL it is already on, `tabParam` never changes, the sync
     *     effect never fires, and the click does nothing.
     *
     * Deriving it removes the second state entirely, so the two cannot drift.
     */
    const activeTab = searchParams.get("tab") || "overview"
    /** Which roadmap is open, or null for the picker. Also in the URL (?r=)
     *  so a roadmap is linkable and Back leaves it. */
    const roadmapParam = searchParams.get("r")

    const [user, setUser] = useState<SessionUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [streak, setStreak] = useState(0)
    const [topicsStudied, setTopicsStudied] = useState(0)
    const [hoursSpent, setHoursSpent] = useState(0)

    // Company questions state (API-driven, persisted in DB)
    const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set())
    const [favorites, setFavorites] = useState<Set<string>>(new Set())

    // Load progress from API (company questions)
    const fetchProgress = useCallback(async () => {
        try {
            const res = await fetch("/api/user/progress")
            if (res.ok) {
                const data = await res.json()
                const completed = data.completedQuestions || []
                setCompletedQuestions(new Set(completed))
                setFavorites(new Set(data.favoriteQuestions || []))
            }
        } catch { /* ignore if not logged in yet */ }
    }, [])

    // Fetch streak data from API
    const fetchStreak = useCallback(async () => {
        try {
            const res = await fetch("/api/user/streak")
            if (res.ok) {
                const data = await res.json()
                setStreak(data.currentStreak || 0)
            }
        } catch { /* ignore */ }
    }, [])

    // Record streak activity on dashboard visit
    const recordStreakActivity = useCallback(async () => {
        try {
            const res = await fetch("/api/user/streak", { method: "POST" })
            if (res.ok) {
                const data = await res.json()
                setStreak(data.currentStreak || 0)
            }
        } catch { /* ignore */ }
    }, [])

    const toggleComplete = useCallback(async (qid: string) => {
        // Optimistic update
        setCompletedQuestions(prev => {
            const next = new Set(prev)
            if (next.has(qid)) { next.delete(qid); setTopicsStudied(s => s - 1) }
            else { next.add(qid); setTopicsStudied(s => s + 1) }
            return next
        })
        // Persist to DB
        try {
            await fetch("/api/user/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: qid, action: "complete" }),
            })
        } catch { /* revert would go here */ }
    }, [])

    const toggleFavorite = useCallback(async (qid: string) => {
        setFavorites(prev => {
            const next = new Set(prev)
            if (next.has(qid)) next.delete(qid); else next.add(qid)
            return next
        })
        try {
            await fetch("/api/user/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: qid, action: "favorite" }),
            })
        } catch { /* revert would go here */ }
    }, [])

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/session")
            const data = await res.json()
            if (data.user) {
                setUser(data.user)
            } else {
                router.push("/login?redirect=/dashboard")
            }
        } catch {
            router.push("/login?redirect=/dashboard")
        } finally {
            setLoading(false)
        }
    }, [router])

    // Load topics studied count from localStorage (same tracking as learn pages)
    useEffect(() => {
        let total = 0
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('gf-completed-')) {
                try {
                    const arr = JSON.parse(localStorage.getItem(key) || '[]')
                    if (Array.isArray(arr)) total += arr.length
                } catch { /* ignore parse errors */ }
            }
        }
        setTopicsStudied(total)
        setHoursSpent(Math.round((total * 3) / 60))
    }, [])

    useEffect(() => {
        checkAuth().then(() => {
            fetchProgress()
            fetchStreak()
            recordStreakActivity()
        })
    }, [checkAuth, fetchProgress, fetchStreak, recordStreakActivity])
    /**
     * Switch tabs by navigating. `activeTab` is read straight back out of the
     * URL, so there is nothing to keep in sync.
     *
     * `?r=` is dropped unless the caller passes one: it belongs to the roadmap
     * tab, and leaving it behind would make "Roadmaps" in the sidebar reopen
     * the last roadmap instead of the picker.
     */
    const selectTab = useCallback(
        (tab: string, roadmapId?: string | null) => {
            const query = new URLSearchParams({ tab })
            if (roadmapId) query.set("r", roadmapId)
            router.push(`/dashboard?${query.toString()}`)
            setSidebarOpen(false)
        },
        [router]
    )

    /** Open a roadmap, or pass null to go back to the picker. */
    const selectRoadmap = useCallback(
        (id: string | null) => selectTab("roadmap", id),
        [selectTab]
    )

    const handleLogout = async () => {
        await fetch("/api/auth/session", { method: "DELETE" })
        router.push("/")
    }

    const purchasedKits = user?.purchasedKits || []
    const initials = user?.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?"

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-purple-100 to-background dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    // ── Tab content ──────────────────────────────────────────

    const renderContent = () => {
        switch (activeTab) {
            case "overview": return <OverviewTab user={user} purchasedKits={purchasedKits} streak={streak} topicsStudied={topicsStudied} />
            case "kits": return <KitsTab purchasedKits={purchasedKits} />
            case "bookmarks": return <BookmarksTab />
            case "roadmap": return <RoadmapTab selectedId={roadmapParam} onSelect={selectRoadmap} />
            case "team-interview": return <TeamInterviewTab />
            case "ai-interview": return <AiInterviewTab user={user} />
            case "leaderboard": return <LeaderboardTab />
            case "profile": return <ProfileTab user={user} />
            default: return <OverviewTab user={user} purchasedKits={purchasedKits} streak={streak} topicsStudied={topicsStudied} />
        }
    }

    return (
        <div className="min-h-screen bg-background flex">

            {/* ── Sidebar ──
                Mobile: a fixed off-canvas drawer. Desktop: `sticky top-0 h-screen` so it
                pins to the viewport while the page scrolls — it used to be `lg:relative`,
                which made it a plain flex child that scrolled away with the content. */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-hairline flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:sticky lg:top-0 lg:bottom-auto lg:h-screen lg:self-start lg:flex-shrink-0 lg:translate-x-0
      `}>
                {/* Logo */}
                <div className="p-6 border-b border-hairline">
                    <Link href="/" className="flex items-center gap-3 group">
                        {/* The mark is blue/violet on transparent, so it needs a light
                            tile to stay legible in dark mode as well as light. */}
                        <div className="w-10 h-10 rounded-xl bg-white border border-hairline flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/GF_logo.png" alt="" className="w-7 h-7 object-contain" />
                        </div>
                        <div>
                            <p className="text-foreground font-bold text-sm">Geeky Frontend</p>
                            <p className="text-muted-foreground text-xs">Interview Prep</p>
                        </div>
                    </Link>
                </div>

                {/* User mini-card */}
                <div className="px-4 py-4 border-b border-hairline">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-overlay">
                        {user.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full border-2 border-violet-400/30 object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-medium truncate">{user.name}</p>
                            <p className="text-muted-foreground text-xs truncate">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {NAV.map(item => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => selectTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-violet-700 dark:text-violet-400 border border-violet-500/20 shadow"
                                    : "text-muted-foreground hover:bg-overlay hover:text-foreground"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-violet-700 dark:text-violet-400" : ""}`} />
                                {item.label}
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                            </button>
                        )
                    })}

                    {/* Admin — only rendered for the admin account (server-verified via /admin guard). */}
                    {user.isAdmin && (
                        <Link
                            href="/admin/platform-users"
                            onClick={() => setSidebarOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-amber-700 dark:text-amber-300/90 hover:bg-amber-500/10 hover:text-amber-200 border border-amber-500/20"
                        >
                            <Shield className="w-4 h-4 flex-shrink-0" />
                            Admin
                        </Link>
                    )}
                </nav>

                {/* Streak card */}
                <div className="px-4 py-3 border-t border-hairline">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                            <span className="text-orange-700 dark:text-orange-400 font-bold text-sm">{streak} day streak 🔥</span>
                        </div>
                        <p className="text-muted-foreground text-xs">Keep it up! Study today to maintain your streak.</p>
                    </div>
                </div>

                {/* Logout */}
                <div className="px-4 pb-6">
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-700 dark:text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Log out
                    </button>
                </div>
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-hairline px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-overlay hover:bg-overlay-strong text-muted-foreground">
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-foreground font-bold text-lg leading-none truncate">
                                    {activeTab === "overview"
                                        ? `${getGreeting()}, ${user.name.split(" ")[0]} 👋`
                                        : NAV.find(n => n.id === activeTab)?.label || "Dashboard"}
                                </h1>
                                <p className="text-muted-foreground text-xs mt-1">
                                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                <Flame className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
                                <span className="text-orange-700 dark:text-orange-400 text-xs font-semibold">{streak}d streak</span>
                            </div>
                            <div className="relative">
                                {user.profilePicture ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full border-2 border-violet-400/30 object-cover cursor-pointer"
                                        onClick={() => selectTab("profile")} />
                                ) : (
                                    <button onClick={() => selectTab("profile")}
                                        className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-violet-400/30">
                                        {initials}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    )
}

// ─── Overview Tab ────────────────────────────────────────────
function OverviewTab({ user, purchasedKits, streak, topicsStudied }: {
    user: SessionUser; purchasedKits: string[]; streak: number; topicsStudied: number
}) {
    const [dbKits, setDbKits] = useState<DbKit[]>([])

    useEffect(() => {
        fetch("/api/learn/kits").then(r => r.json()).then(d => { if (d.kits) setDbKits(d.kits) }).catch(() => { })
    }, [])

    const visibleKits = dbKits
    const ownedKits = visibleKits.filter(k => k.hasAccess)
    const previewKits = visibleKits.filter(k => !k.hasAccess)

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Announce freshly-added kits to existing users (dismissible). */}
            <NewKitsBanner />

            {/* Live public offer, if one is running. Renders nothing otherwise. */}
            <OfferBanner />

            {/* ── Active Kits ── */}
            {ownedKits.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/10">
                            <Package className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-foreground font-semibold text-base">Your Active Kits</h3>
                            <p className="text-muted-foreground text-xs">Continue learning where you left off</p>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {ownedKits.map(kit => (
                            <Link key={kit._id} href={getResumeHref(kit.slug)}
                                className="group relative overflow-hidden bg-card border border-hairline rounded-2xl p-5 hover:border-violet-500/25 transition-all duration-500 block">
                                {/* Subtle hover glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                     style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
                                <div className="relative z-10">
                                    <div className="flex items-start gap-3.5 mb-3">
                                        {getKitLogo(kit.slug || kit.name) ? (
                                            <div className="w-11 h-11 rounded-xl bg-overlay border border-hairline flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                                                <KitLogo nameKey={kit.slug || kit.name} alt={kit.name} imgClassName="w-7 h-7 object-contain" />
                                            </div>
                                        ) : (
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                                {kit.icon}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground text-sm font-semibold truncate group-hover:text-violet-700 dark:group-hover:text-violet-700 dark:group-hover:text-violet-200 transition-colors">{kit.name}</p>
                                            <p className="text-muted-foreground text-xs mt-0.5">{kit.chaptersCount} chapters · {kit.topicsCount} topics</p>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5 h-5">Owned</Badge>
                                    </div>
                                    <p className="text-muted-foreground text-xs line-clamp-1 mb-3">{kit.description}</p>
                                    <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400/70 text-xs font-medium group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                                        Continue learning
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Bookmarked topics (compact preview) ── */}
            <BookmarksPreview kits={dbKits} />

            {/* Cross-sell sits after the user's own kits — it's an offer, not the page. */}
            <BundleUpsell tone="dark" />

            {/* ── Explore / Preview Kits ── */}
            {previewKits.length > 0 && (
                <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/10">
                                <Eye className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-foreground font-semibold text-base">Explore More Kits</h3>
                                <p className="text-muted-foreground text-xs">Preview Chapter 1 free · Unlock all with purchase</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {previewKits.map(kit => (
                            <div key={kit._id}
                                className="group relative overflow-hidden bg-card border border-hairline rounded-2xl p-5 hover:border-amber-500/20 hover:bg-card transition-all duration-400">
                                <div className="relative z-10">
                                    <div className="flex items-start gap-3.5 mb-3">
                                        {getKitLogo(kit.slug || kit.name) ? (
                                            <div className="w-11 h-11 rounded-xl bg-overlay border border-hairline flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100">
                                                <KitLogo nameKey={kit.slug || kit.name} alt={kit.name} imgClassName="w-7 h-7 object-contain" />
                                            </div>
                                        ) : (
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100`}>
                                                {kit.icon}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground text-sm font-semibold truncate group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">{kit.name}</p>
                                            <p className="text-muted-foreground text-xs mt-0.5">{kit.chaptersCount} chapters · {kit.topicsCount} topics</p>
                                        </div>
                                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] px-2 py-0.5 h-5 flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" /> Preview
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-xs line-clamp-1 mb-4">{kit.description}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button size="sm" className="bg-muted hover:bg-muted text-muted-foreground hover:text-foreground border border-hairline text-xs transition-colors" asChild>
                                            <Link href={`/learn/${kit.slug}`}>
                                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                Preview
                                            </Link>
                                        </Button>
                                        <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs shadow-md shadow-violet-500/20 border-0" asChild>
                                            <Link href={getCheckoutPathForKit(`${kit.name} ${kit.slug}`)}>
                                                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                                Buy Full Kit
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Empty state (no kits at all) ── */}
            {visibleKits.length === 0 && (
                <div className="relative overflow-hidden text-center py-16 px-8 rounded-3xl border border-dashed border-hairline bg-muted dark:bg-gradient-to-br dark:from-violet-950/40 dark:to-slate-900/50">
                    <div className="absolute inset-0 opacity-[0.03]"
                         style={{
                             backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                             backgroundSize: "24px 24px",
                         }} />
                    <div className="relative z-10">
                        <div className="text-5xl mb-5">📦</div>
                        <h3 className="text-foreground font-bold text-lg mb-2">No kits yet</h3>
                        <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">Browse our interview preparation kits and start your journey toward your dream frontend role.</p>
                        <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 px-6 py-2.5" asChild>
                            <Link href="/#pricing">Browse Kits <ChevronRight className="w-4 h-4 ml-1" /></Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Progress at a glance ──
                Streak / topics / kits used to be three hero cards above the fold; they
                summarise the work rather than being the work, so they sit at the foot of
                the page as one slim row. The live streak also stays in the top bar. */}
            <ProgressStrip streak={streak} topicsStudied={topicsStudied} kitsOwned={ownedKits.length} />
        </div>
    )
}

/** Compact three-up counter row — replaces the old full-width stats grid. */
function ProgressStrip({ streak, topicsStudied, kitsOwned }: {
    streak: number; topicsStudied: number; kitsOwned: number
}) {
    const stats = [
        { label: "Day streak", value: streak, icon: Flame, accent: "text-orange-700 dark:text-orange-400", bg: "bg-orange-500/10" },
        { label: "Topics studied", value: topicsStudied, icon: BookOpen, accent: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/10" },
        { label: "Kits owned", value: kitsOwned, icon: Package, accent: "text-violet-700 dark:text-violet-400", bg: "bg-violet-500/10" },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl border border-hairline bg-card divide-y sm:divide-y-0 sm:divide-x divide-hairline">
            {stats.map(stat => {
                const Icon = stat.icon
                return (
                    <div key={stat.label} className="flex items-center gap-3 px-5 py-4">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${stat.accent}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                            <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Team Interview Tab ───────────────────────────────────────
interface TeamInterview {
    _id: string;
    kit: string;
    interviewType: string;
    preferredTime: string;
    durationMinutes: 30 | 45 | 60;
    status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
    meetingLink?: string;
    adminNotes?: string;
    report?: {
        rating?: number;
        summary?: string;
        strengths?: string;
        improvements?: string;
        nextSteps?: string;
        resources?: string;
        submittedAt?: string;
    };
    createdAt: string;
}

function TeamInterviewTab() {
    const [interviews, setInterviews] = useState<TeamInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [durationMinutes, setDurationMinutes] = useState<30 | 45 | 60>(30);
    const [interviewType, setInterviewType] = useState("React Interview");
    const [note, setNote] = useState("");

    const fetchInterviews = useCallback(() => {
        setLoading(true);
        fetch("/api/interviews")
            .then(r => r.json())
            .then(data => setInterviews(data.interviews || []))
            .catch(() => setError("Could not load interview requests."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const activeInterview = interviews.find(item => ["pending", "approved"].includes(item.status));
    const completedInterviews = interviews.filter(item => item.status === "completed");

    const submitRequest = async () => {
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const res = await fetch("/api/interviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kit: "React",
                    interviewType,
                    preferredTime,
                    durationMinutes,
                    note,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Could not submit interview request.");
                return;
            }

            setSuccess("Interview request sent. Our team will review and confirm it from admin.");
            setPreferredTime("");
            setNote("");
            fetchInterviews();
        } catch (err: any) {
            setError(err.message || "Could not submit interview request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-50 via-card to-cyan-50 dark:from-emerald-900/35 dark:via-slate-900/90 dark:to-cyan-900/35 border border-emerald-500/20">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
                            <Video className="w-3.5 h-3.5" />
                            Human-Led Interview
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Schedule a React interview with our team</h2>
                        <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
                            Pick your preferred slot and duration. After admin approval, the confirmed schedule and interview link will appear here.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                        <div className="rounded-xl bg-overlay border border-hairline p-4">
                            <p className="text-2xl font-bold text-foreground">30-60</p>
                            <p className="text-muted-foreground text-xs mt-1">Minutes</p>
                        </div>
                        <div className="rounded-xl bg-overlay border border-hairline p-4">
                            <p className="text-2xl font-bold text-foreground">{completedInterviews.length}</p>
                            <p className="text-muted-foreground text-xs mt-1">Reports</p>
                        </div>
                    </div>
                </div>
            </div>

            {activeInterview && (
                <div className={`rounded-2xl p-5 border ${activeInterview.status === "approved"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-yellow-500/10 border-yellow-500/20"}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeInterview.status === "approved" ? "bg-emerald-500/15" : "bg-yellow-500/15"}`}>
                                {activeInterview.status === "approved"
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                                    : <Clock className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />}
                            </div>
                            <div>
                                <p className="text-foreground font-semibold">
                                    {activeInterview.status === "approved" ? "Interview scheduled" : "Interview request pending"}
                                </p>
                                <p className="text-foreground text-sm mt-1">
                                    {formatInterviewDate(activeInterview.preferredTime)} · {activeInterview.durationMinutes} minutes · {activeInterview.interviewType}
                                </p>
                                {activeInterview.adminNotes && <p className="text-muted-foreground text-xs mt-2">{activeInterview.adminNotes}</p>}
                            </div>
                        </div>
                        {activeInterview.meetingLink && (
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" asChild>
                                <a href={activeInterview.meetingLink} target="_blank" rel="noopener noreferrer">
                                    Join Interview
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
                <div className="bg-card border border-hairline rounded-2xl p-5">
                    <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                        Request a Slot
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Interview Type</label>
                            <select
                                value={interviewType}
                                onChange={event => setInterviewType(event.target.value)}
                                className="w-full h-11 rounded-xl bg-overlay border border-hairline px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="React Interview">React Interview</option>
                                <option value="React + JavaScript Interview">React + JavaScript Interview</option>
                                <option value="React Machine Coding Interview">React Machine Coding Interview</option>
                                <option value="React Final Mock Interview">React Final Mock Interview</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Preferred Date & Time</label>
                            <input
                                type="datetime-local"
                                value={preferredTime}
                                onChange={event => setPreferredTime(event.target.value)}
                                className="w-full h-11 rounded-xl bg-overlay border border-hairline px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                            <p className="text-muted-foreground text-xs mt-1.5">Choose a time at least 30 minutes from now.</p>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Duration</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[30, 45, 60].map(duration => (
                                    <button
                                        key={duration}
                                        onClick={() => setDurationMinutes(duration as 30 | 45 | 60)}
                                        className={`h-10 rounded-xl border text-sm font-medium transition-all ${durationMinutes === duration
                                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                            : "bg-overlay border-hairline text-muted-foreground hover:text-foreground"}`}
                                    >
                                        {duration} min
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Anything you want us to focus on?</label>
                            <textarea
                                value={note}
                                onChange={event => setNote(event.target.value)}
                                placeholder="Example: hooks, machine coding, project explanation, performance..."
                                className="w-full min-h-[90px] resize-none rounded-xl bg-overlay border border-hairline px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                        </div>
                        {error && <p className="text-red-700 dark:text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                        {success && <p className="text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{success}</p>}
                        <Button
                            onClick={submitRequest}
                            disabled={submitting || !preferredTime || Boolean(activeInterview)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
                        >
                            {submitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {activeInterview ? "Active Request Exists" : "Request Interview"}
                        </Button>
                    </div>
                </div>

                <div className="bg-card border border-hairline rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
                        <h3 className="text-foreground font-semibold flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                            Your Interviews
                        </h3>
                        <button onClick={fetchInterviews} className="text-muted-foreground hover:text-foreground transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    {loading ? (
                        <div className="py-16 flex justify-center">
                            <RefreshCw className="w-7 h-7 animate-spin text-muted-foreground" />
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <Video className="w-11 h-11 text-muted-foreground mx-auto mb-3" />
                            <p className="text-foreground font-semibold">No interview requests yet</p>
                            <p className="text-muted-foreground text-sm mt-1">Request your first team interview from the form.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-hairline">
                            {interviews.map(interview => (
                                <div key={interview._id} className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-foreground font-medium">{interview.interviewType}</p>
                                                <InterviewStatusBadge status={interview.status} />
                                            </div>
                                            <p className="text-muted-foreground text-sm">{formatInterviewDate(interview.preferredTime)} · {interview.durationMinutes} min</p>
                                            {interview.meetingLink && interview.status === "approved" && (
                                                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 text-xs mt-2 hover:underline">
                                                    Meeting link <ArrowRight className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {interview.report && (
                                        <div className="mt-4 rounded-xl bg-overlay border border-hairline p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-foreground font-semibold flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-violet-700 dark:text-violet-300" />
                                                    Review Report
                                                </p>
                                                {interview.report.rating && <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20">{interview.report.rating}/10</Badge>}
                                            </div>
                                            {interview.report.summary && <p className="text-foreground text-sm mb-3">{interview.report.summary}</p>}
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {interview.report.strengths && <ReportBlock title="Strengths" value={interview.report.strengths} />}
                                                {interview.report.improvements && <ReportBlock title="Improve" value={interview.report.improvements} />}
                                                {interview.report.nextSteps && <ReportBlock title="Next Steps" value={interview.report.nextSteps} />}
                                                {interview.report.resources && <ReportBlock title="Resources" value={interview.report.resources} />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InterviewStatusBadge({ status }: { status: TeamInterview["status"] }) {
    const styles: Record<TeamInterview["status"], string> = {
        pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
        approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        rejected: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
        completed: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
        cancelled: "bg-muted text-foreground border-border",
    };

    return <Badge className={`${styles[status]} capitalize`}>{status}</Badge>;
}

function ReportBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-lg bg-background border border-hairline p-3">
            <p className="text-muted-foreground text-xs font-semibold mb-1">{title}</p>
            <p className="text-foreground text-sm whitespace-pre-wrap">{value}</p>
        </div>
    );
}

function formatInterviewDate(value: string) {
    return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}


// ─── Leaderboard Tab ──────────────────────────────────────────
interface LeaderboardRow {
    userId: string;
    name: string;
    initials: string;
    profilePicture?: string | null;
    completedCount: number;
    totalTopics: number;
    progressPercent: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveAt?: string | null;
    isCurrentUser: boolean;
    rank: number;
}

function LeaderboardTab() {
    const [rows, setRows] = useState<LeaderboardRow[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardRow | null>(null);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [totalTopics, setTotalTopics] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/leaderboard/react")
            .then(r => r.json())
            .then(data => {
                setRows(data.leaderboard || []);
                setCurrentUser(data.currentUser || null);
                setParticipantsCount(data.participantsCount || 0);
                setTotalTopics(data.kit?.totalTopics || 0);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const topThree = rows.slice(0, 3);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-cyan-50 via-card to-violet-50 dark:from-cyan-900/40 dark:via-slate-900/80 dark:to-violet-900/40 border border-cyan-500/20">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold mb-3">
                            <Trophy className="w-3.5 h-3.5" />
                            React Kit Leaderboard
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Climb with consistent progress</h2>
                        <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
                            Rankings are based on React kit topics completed, with streaks used to break close ties.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                        <div className="rounded-xl bg-overlay border border-hairline p-4">
                            <p className="text-2xl font-bold text-foreground">{participantsCount}</p>
                            <p className="text-muted-foreground text-xs mt-1">Students ranked</p>
                        </div>
                        <div className="rounded-xl bg-overlay border border-hairline p-4">
                            <p className="text-2xl font-bold text-foreground">{totalTopics}</p>
                            <p className="text-muted-foreground text-xs mt-1">React topics</p>
                        </div>
                    </div>
                </div>
            </div>

            {currentUser && (
                <div className="bg-card border border-violet-500/20 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                #{currentUser.rank}
                            </div>
                            <div>
                                <p className="text-foreground font-semibold">Your React rank</p>
                                <p className="text-muted-foreground text-sm">
                                    {currentUser.completedCount}/{currentUser.totalTopics} topics completed · {currentUser.currentStreak} day streak
                                </p>
                            </div>
                        </div>
                        <div className="sm:w-56">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{currentUser.progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${currentUser.progressPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {topThree.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                    {topThree.map(row => (
                        <LeaderboardCard key={row.userId} row={row} />
                    ))}
                </div>
            )}

            <div className="bg-card border border-hairline rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
                    <h3 className="text-foreground font-semibold flex items-center gap-2">
                        <Medal className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        React Rankings
                    </h3>
                    <span className="text-xs text-muted-foreground">Top 25 students</span>
                </div>

                {rows.length === 0 ? (
                    <div className="text-center py-14 px-6">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-foreground font-semibold mb-1">No React progress yet</p>
                        <p className="text-muted-foreground text-sm mb-5">Complete your first React topic to appear on the leaderboard.</p>
                        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white" asChild>
                            <Link href="/learn/react-interview-kit">Start React Kit</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-hairline">
                        {rows.map(row => (
                            <LeaderboardListRow key={row.userId} row={row} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function LeaderboardCard({ row }: { row: LeaderboardRow }) {
    const medalClass = row.rank === 1
        ? "from-amber-400 to-yellow-600"
        : row.rank === 2
            ? "from-slate-300 to-slate-500"
            : "from-orange-400 to-amber-700";

    return (
        <div className={`bg-card border rounded-2xl p-5 ${row.isCurrentUser ? "border-violet-500/30" : "border-hairline"}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${medalClass} flex items-center justify-center text-white font-bold shadow-lg`}>
                    #{row.rank}
                </div>
                {row.isCurrentUser && <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20">You</Badge>}
            </div>
            <div className="flex items-center gap-3 mb-4">
                <AvatarBubble row={row} />
                <div className="min-w-0">
                    <p className="text-foreground font-semibold truncate">{row.name}</p>
                    <p className="text-muted-foreground text-xs">{row.currentStreak} day streak</p>
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{row.completedCount}/{row.totalTopics} topics</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{row.progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${row.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

function LeaderboardListRow({ row }: { row: LeaderboardRow }) {
    return (
        <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${row.isCurrentUser ? "bg-violet-500/10" : "hover:bg-overlay"}`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-overlay border border-hairline flex items-center justify-center text-foreground text-sm font-bold flex-shrink-0">
                    {row.rank}
                </div>
                <AvatarBubble row={row} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-foreground font-medium truncate">{row.name}</p>
                        {row.isCurrentUser && <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20 text-[10px] px-1.5 py-0 h-4">You</Badge>}
                    </div>
                    <p className="text-muted-foreground text-xs">{row.completedCount}/{row.totalTopics} React topics completed</p>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[160px_90px_90px] items-center gap-3 sm:gap-4">
                <div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${row.progressPercent}%` }} />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-foreground text-sm font-semibold">{row.progressPercent}%</p>
                    <p className="text-muted-foreground text-[10px]">Progress</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-orange-700 dark:text-orange-400 text-sm font-semibold">{row.currentStreak}d</p>
                    <p className="text-muted-foreground text-[10px]">Streak</p>
                </div>
            </div>
        </div>
    );
}

function AvatarBubble({ row }: { row: LeaderboardRow }) {
    if (row.profilePicture) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.profilePicture} alt={row.name} className="w-10 h-10 rounded-full object-cover border border-hairline flex-shrink-0" />
        );
    }

    return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.initials}
        </div>
    );
}

// ─── Kits Tab (DB-driven) ────────────────────────────────────
function KitsTab({ purchasedKits }: { purchasedKits: string[] }) {
    const [allKits, setAllKits] = useState<DbKit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Name of a kit the user has finished, if any — drives the upsell eyebrow.
    // Finishing a kit is the single highest-intent moment we have. PRD-001 §3.3.
    const [finishedKitName, setFinishedKitName] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/learn/kits")
            .then(r => r.json())
            .then(d => { if (d.kits) setAllKits(d.kits); })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    // Check the owned kits for a 100% completion.
    useEffect(() => {
        const owned = allKits.filter(k => k.hasAccess);
        if (owned.length === 0) return;
        let cancelled = false;

        Promise.all(
            owned.map(k =>
                fetch(`/api/user/kit-progress?kitSlug=${encodeURIComponent(k.slug)}`)
                    .then(r => (r.ok ? r.json() : null))
                    .then(p => (p && p.progressPercent >= 100 ? k.name : null))
                    .catch(() => null)
            )
        ).then(results => {
            if (cancelled) return;
            const done = results.find(Boolean);
            if (done) setFinishedKitName(done as string);
        });

        return () => { cancelled = true; };
    }, [allKits]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const visibleKits = allKits;
    const ownedKits = visibleKits.filter(k => k.hasAccess);
    const lockedKits = visibleKits.filter(k => !k.hasAccess);
    const featuredOwnedKit = ownedKits[0];

    return (
        <div className="space-y-8 max-w-6xl">
            {/* Cross-sell at peak intent: renders nothing if they already own the bundle. */}
            <BundleUpsell
                tone="dark"
                eyebrow={
                    finishedKitName
                        ? `You finished ${finishedKitName}. Here's the natural next step.`
                        : lockedKits.length > 0
                            ? "You're missing some kits."
                            : undefined
                }
            />

            <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-50 via-card to-background dark:from-violet-950/60 dark:via-slate-900 dark:to-slate-950 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_36%)]" />
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20 mb-3">
                            Your learning library
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                            {featuredOwnedKit ? "Continue with your active kit" : "Choose a kit and start preparing"}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-2">
                            {featuredOwnedKit
                                ? `${featuredOwnedKit.name} is ready with ${featuredOwnedKit.chaptersCount} chapters and ${featuredOwnedKit.topicsCount} topics.`
                                : "Pick the kit that matches your next interview goal. Your purchased kits will appear here instantly after checkout."}
                        </p>
                    </div>

                    {featuredOwnedKit ? (
                        <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/40" asChild>
                            <Link href={getResumeHref(featuredOwnedKit.slug)}>
                                Resume Learning
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    ) : (
                        <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/40" asChild>
                            <Link href="/#products">
                                Browse Kits
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    )}
                </div>
            </section>

            {ownedKits.length > 0 && (
                <section>
                    <div className="flex items-end justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />
                                Purchased Kits
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">Your active interview prep content.</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                            {ownedKits.length} active
                        </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {ownedKits.map(kit => (
                            <Link key={kit._id} href={getResumeHref(kit.slug)}
                                className="group relative overflow-hidden rounded-2xl border border-hairline bg-card p-5 hover:border-violet-400/40 hover:bg-card transition-all">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 via-violet-400 to-cyan-400" />
                                <div className="flex items-start gap-4">
                                    {getKitLogo(kit.slug || kit.name) ? (
                                        <div className="w-14 h-14 rounded-2xl bg-overlay border border-hairline flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <KitLogo nameKey={kit.slug || kit.name} alt={kit.name} imgClassName="w-9 h-9 object-contain" />
                                        </div>
                                    ) : (
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                                            {kit.icon}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 text-[10px] px-2 py-0.5">
                                                Owned
                                            </Badge>
                                            <Badge variant="outline" className="border-hairline text-muted-foreground text-[10px] px-2 py-0.5">
                                                Lifetime access
                                            </Badge>
                                        </div>
                                        <p className="text-foreground font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-200 transition-colors">
                                            {kit.name}
                                        </p>
                                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{kit.description}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-overlay border border-hairline p-3">
                                        <p className="text-lg font-bold text-foreground">{kit.chaptersCount}</p>
                                        <p className="text-[11px] text-muted-foreground">Chapters</p>
                                    </div>
                                    <div className="rounded-xl bg-overlay border border-hairline p-3">
                                        <p className="text-lg font-bold text-foreground">{kit.topicsCount}</p>
                                        <p className="text-[11px] text-muted-foreground">Topics</p>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between text-sm">
                                    <span className="text-violet-700 dark:text-violet-300 font-medium">Start learning</span>
                                    <ArrowRight className="w-4 h-4 text-violet-700 dark:text-violet-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {lockedKits.length > 0 && (
                <section>
                    <div className="flex items-end justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-violet-700 dark:text-violet-300" />
                                Recommended Next Kits
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">Add focused prep for the rounds you still want to strengthen.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {lockedKits.map(kit => (
                            <div key={kit._id} className="group rounded-2xl border border-hairline bg-card p-5 hover:border-violet-400/40 hover:bg-card transition-all">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    {getKitLogo(kit.slug || kit.name) ? (
                                        <div className="w-12 h-12 rounded-2xl bg-overlay border border-hairline flex items-center justify-center shadow-lg">
                                            <KitLogo nameKey={kit.slug || kit.name} alt={kit.name} imgClassName="w-8 h-8 object-contain" />
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl shadow-lg`}>
                                            {kit.icon}
                                        </div>
                                    )}
                                    <Badge className="bg-overlay text-muted-foreground border-hairline text-[10px] px-2 py-0.5">
                                        <Lock className="w-2.5 h-2.5 mr-1" />
                                        Locked
                                    </Badge>
                                </div>

                                <h3 className="text-foreground font-semibold leading-snug group-hover:text-violet-700 dark:group-hover:text-violet-200 transition-colors">{kit.name}</h3>
                                <p className="text-muted-foreground text-xs mt-2 line-clamp-2 min-h-[2rem]">{kit.description}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="border-hairline text-muted-foreground text-[10px]">
                                        {kit.chaptersCount} chapters
                                    </Badge>
                                    <Badge variant="outline" className="border-hairline text-muted-foreground text-[10px]">
                                        {kit.topicsCount} topics
                                    </Badge>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    <Button size="sm" className="bg-muted hover:bg-muted text-foreground hover:text-foreground border border-hairline text-xs" asChild>
                                        <Link href={`/learn/${kit.slug}`}>
                                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                                            Preview
                                        </Link>
                                    </Button>
                                    <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs shadow-md shadow-violet-500/20 border-0" asChild>
                                        <Link href={getCheckoutPathForKit(`${kit.name} ${kit.slug}`)}>
                                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                            Buy Full Kit
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state */}
            {visibleKits.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-hairline rounded-xl">
                    <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No kits available right now.</p>
                </div>
            )}
        </div>
    )
}

// ─── Progress Tab ────────────────────────────────────────────
function ProgressTab({ purchasedKits, topicsStudied, hoursSpent }: { purchasedKits: string[]; topicsStudied: number; hoursSpent: number }) {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const weekActivity = [3, 5, 2, 6, 4, 7, 3]
    const [dbKits, setDbKits] = useState<DbKit[]>([])

    useEffect(() => {
        fetch("/api/learn/kits").then(r => r.json()).then(d => { if (d.kits) setDbKits(d.kits) }).catch(() => { })
    }, [])

    const ownedKits = dbKits.filter(k => k.hasAccess)

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: "Topics Studied", value: topicsStudied, max: 100, icon: BookOpen, color: "violet" },
                    { label: "Hours Invested", value: hoursSpent, max: 50, icon: Clock, color: "blue" },
                    { label: "Kits Active", value: ownedKits.length, max: 5, icon: Package, color: "green" },
                ].map((s, i) => {
                    const Icon = s.icon
                    const pct = Math.round((typeof s.value === 'number' ? s.value : 0) / s.max * 100)
                    return (
                        <div key={i} className="bg-card border border-hairline rounded-2xl p-5">
                            <Icon className={`w-5 h-5 text-${s.color}-400 mb-3`} />
                            <p className="text-2xl font-bold text-foreground">{s.value}</p>
                            <p className="text-muted-foreground text-xs mb-3">{s.label}</p>
                            <div className="w-full bg-muted rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full bg-${s.color}-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Weekly activity */}
            <div className="bg-card border border-hairline rounded-2xl p-6">
                <h3 className="text-foreground font-semibold mb-6 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    This Week's Activity
                </h3>
                <div className="flex items-end gap-3 h-32">
                    {weekDays.map((day, i) => {
                        const height = (weekActivity[i] / 7) * 100
                        const isToday = i === 5 // Saturday highlight for demo
                        return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex items-end justify-center" style={{ height: "80%" }}>
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${isToday
                                            ? "bg-gradient-to-t from-violet-600 to-purple-400"
                                            : "bg-muted hover:bg-muted"
                                            }`}
                                        style={{ height: `${height}%`, minHeight: 4 }}
                                    />
                                </div>
                                <span className={`text-xs ${isToday ? "text-violet-700 dark:text-violet-400 font-semibold" : "text-muted-foreground"}`}>{day}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Per-kit progress */}
            {ownedKits.length > 0 && (
                <div className="bg-card border border-hairline rounded-2xl p-6">
                    <h3 className="text-foreground font-semibold mb-5 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                        Kit Progress
                    </h3>
                    <div className="space-y-5">
                        {ownedKits.map(kit => (
                            <div key={kit._id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-foreground text-sm font-medium flex items-center gap-2">
                                        <KitLogo nameKey={kit.slug || kit.name} fallback={<span>{kit.icon}</span>} imgClassName="w-4 h-4 object-contain inline-block" alt={kit.name} /> {kit.name}
                                    </span>
                                    <span className="text-muted-foreground text-xs">{kit.chaptersCount} chapters · {kit.topicsCount} topics</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className={`h-2 rounded-full bg-gradient-to-r ${kit.color} transition-all duration-700`} style={{ width: '0%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Achievements Tab ────────────────────────────────────────
function AchievementsTab({ purchasedKits, streak, topicsStudied }: { purchasedKits: string[]; streak: number; topicsStudied: number }) {
    const badges = [
        { emoji: "🚀", title: "Early Bird", desc: "Joined in the first 1000", unlocked: true },
        { emoji: "🔥", title: "On Fire", desc: `${streak}+ day streak`, unlocked: streak >= 3 },
        { emoji: "📚", title: "Bookworm", desc: "Studied 10+ topics", unlocked: topicsStudied >= 10 },
        { emoji: "🎯", title: "First Kit", desc: "Purchased your first kit", unlocked: purchasedKits.length >= 1 },
        { emoji: "💪", title: "Committed", desc: "Purchased 2+ kits", unlocked: purchasedKits.length >= 2 },
        { emoji: "⭐", title: "Star Student", desc: "Studied 50+ topics", unlocked: topicsStudied >= 50 },
        { emoji: "🏆", title: "Champion", desc: "Completed a full kit", unlocked: false },
        { emoji: "🌟", title: "Master", desc: "30+ day streak", unlocked: streak >= 30 },
    ]

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="bg-card border border-hairline rounded-2xl p-6">
                <h3 className="text-foreground font-semibold mb-2">Your Achievements</h3>
                <p className="text-muted-foreground text-sm mb-6">{badges.filter(b => b.unlocked).length} of {badges.length} unlocked</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {badges.map((b, i) => (
                        <div key={i} className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${b.unlocked
                            ? "bg-gradient-to-b from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-slate-900/50 border-violet-500/30"
                            : "bg-card border-hairline opacity-40 grayscale"}`}>
                            <div className={`text-4xl mb-2 ${b.unlocked ? "" : "opacity-50"}`}>{b.emoji}</div>
                            <p className={`text-xs font-semibold mb-1 ${b.unlocked ? "text-violet-700 dark:text-violet-300" : "text-muted-foreground"}`}>{b.title}</p>
                            <p className="text-xs text-muted-foreground">{b.desc}</p>
                            {b.unlocked && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-hairline rounded-2xl p-6">
                <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                    Leaderboard Position
                </h3>
                <div className="text-center py-8">
                    <p className="text-5xl font-black text-foreground">#142</p>
                    <p className="text-muted-foreground text-sm mt-2">out of 12,450+ students</p>
                    <p className="text-violet-700 dark:text-violet-400 text-xs mt-1">Top 2% 🎉</p>
                </div>
            </div>
        </div>
    )
}

// ─── Profile Tab ────────────────────────────────────────────
function ProfileTab({ user }: { user: SessionUser }) {
    const initials = user.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?"
    const joinDate = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Profile card */}
            <div className="bg-card border border-hairline rounded-2xl overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
                <div className="px-6 pb-6 -mt-12">
                    <div className="flex items-end gap-4 mb-4">
                        {user.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profilePicture} alt={user.name}
                                className="w-20 h-20 rounded-2xl border-4 border-border object-cover" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl border-4 border-border bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {initials}
                            </div>
                        )}
                        <div className="pb-1">
                            <h2 className="text-foreground text-xl font-bold">{user.name}</h2>
                            <p className="text-muted-foreground text-sm">Member since {joinDate}</p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {[
                            { icon: User, label: "Full Name", value: user.name },
                            { icon: Mail, label: "Email", value: user.email },
                            { icon: Calendar, label: "Member Since", value: joinDate },
                            { icon: Package, label: "Kits Owned", value: `${user.purchasedKits?.length || 0} kit${(user.purchasedKits?.length || 0) !== 1 ? "s" : ""}` },
                        ].map((row, i) => {
                            const Icon = row.icon
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-overlay border border-hairline">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">{row.label}</p>
                                        <p className="text-foreground text-sm font-medium">{row.value}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Preferences / settings */}
            <div className="bg-card border border-hairline rounded-2xl p-6">
                <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Account
                </h3>
                <div className="space-y-2">
                    <Link href="/contact"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-overlay transition-colors text-foreground hover:text-foreground group">
                        <span className="text-sm">Contact Support</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                    <Link href="/privacy"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-overlay transition-colors text-foreground hover:text-foreground group">
                        <span className="text-sm">Privacy Policy</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                    <Link href="/terms"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-overlay transition-colors text-foreground hover:text-foreground group">
                        <span className="text-sm">Terms of Service</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
