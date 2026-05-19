// app/dashboard/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard, BookOpen, TrendingUp, Award, Settings,
    LogOut, X, Menu, User, Mail, Calendar, CheckCircle2,
    Target, Zap, Clock, Star, ChevronRight, Package, Lock,
    BarChart2, Flame, RefreshCw, ShoppingBag, Building2, ArrowRight,
    Trophy, Medal, Bot, Mic, MicOff, PlayCircle, RotateCcw,
    MessageSquare, Brain, Timer, Send, Sparkles, Video,
    ClipboardCheck, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompanyQuestionsTab } from "@/components/dashboard/company-questions-tab"

interface SessionUser {
    id: string
    email: string
    name: string
    profilePicture?: string
    purchasedKits?: string[]
}

/** DB Kit shape from /api/learn/kits */
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

function isNodeKit(kit: DbKit) {
    const label = `${kit.name} ${kit.slug}`.toLowerCase()
    return label.includes("node")
}

function getCheckoutPathForKit(kit: DbKit) {
    const label = `${kit.name} ${kit.slug}`.toLowerCase()
    if (label.includes("complete")) return "/checkout/complete"
    if (label.includes("react")) return "/checkout/react"
    if (label.includes("javascript") || label.includes("js")) return "/checkout/javascript"
    if (label.includes("placement")) return "/checkout/placement"
    return "/#products"
}

const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "kits", label: "My Kits", icon: Package },
    // { id: "team-interview", label: "Team Interview", icon: Video },
    // { id: "ai-interview", label: "AI Interview", icon: Bot },
    // { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
]

export default function DashboardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab") || "overview"

    const [user, setUser] = useState<SessionUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(tabParam)
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
                // Fallback: check legacy token
                const token = localStorage.getItem("companyKitToken")
                if (token) {
                    const r = await fetch("/api/company-kit/check-subscription", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionToken: token })
                    })
                    const d = await r.json()
                    if (d.user) {
                        setUser({ id: d.user.id, email: d.user.email, name: d.user.name, purchasedKits: d.user.purchasedKits || [] })
                    } else {
                        router.push("/login?redirect=/dashboard")
                    }
                } else {
                    router.push("/login?redirect=/dashboard")
                }
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
    useEffect(() => { setActiveTab(tabParam) }, [tabParam])

    const handleLogout = async () => {
        await fetch("/api/auth/session", { method: "DELETE" })
        localStorage.removeItem("companyKitToken")
        router.push("/")
    }

    const purchasedKits = user?.purchasedKits || []
    const initials = user?.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?"

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 text-sm">Loading your dashboard…</p>
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
            case "team-interview": return <TeamInterviewTab />
            case "ai-interview": return <LiveAIInterviewTab user={user} />
            case "leaderboard": return <LeaderboardTab />
            case "profile": return <ProfileTab user={user} />
            default: return <OverviewTab user={user} purchasedKits={purchasedKits} streak={streak} topicsStudied={topicsStudied} />
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">

            {/* ── Sidebar ── */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
      `}>
                {/* Logo */}
                <div className="p-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Geeky Frontend</p>
                            <p className="text-slate-500 text-xs">Interview Prep</p>
                        </div>
                    </Link>
                </div>

                {/* User mini-card */}
                <div className="px-4 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        {user.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full border-2 border-violet-400/30 object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user.name}</p>
                            <p className="text-slate-500 text-xs truncate">{user.email}</p>
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
                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-violet-400 border border-violet-500/20 shadow"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-violet-400" : ""}`} />
                                {item.label}
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                            </button>
                        )
                    })}
                </nav>

                {/* Streak card */}
                <div className="px-4 py-3 border-t border-white/5">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400 font-bold text-sm">{streak} day streak 🔥</span>
                        </div>
                        <p className="text-slate-500 text-xs">Keep it up! Study today to maintain your streak.</p>
                    </div>
                </div>

                {/* Logout */}
                <div className="px-4 pb-6">
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-white font-bold text-lg leading-none">
                                    {NAV.find(n => n.id === activeTab)?.label || "Dashboard"}
                                </h1>
                                <p className="text-slate-500 text-xs mt-0.5">
                                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                <Flame className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-orange-400 text-xs font-semibold">{streak}d streak</span>
                            </div>
                            <div className="relative">
                                {user.profilePicture ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full border-2 border-violet-400/30 object-cover cursor-pointer"
                                        onClick={() => setActiveTab("profile")} />
                                ) : (
                                    <button onClick={() => setActiveTab("profile")}
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
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    const [dbKits, setDbKits] = useState<DbKit[]>([])

    useEffect(() => {
        fetch("/api/learn/kits").then(r => r.json()).then(d => { if (d.kits) setDbKits(d.kits) }).catch(() => { })
    }, [])

    const ownedKits = dbKits.filter(k => k.hasAccess && !isNodeKit(k))

    return (
        <div className="space-y-8 max-w-5xl">
            {/* ── Welcome Banner ── */}
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10"
                 style={{
                     background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(99,102,241,0.15) 40%, rgba(14,165,233,0.12) 70%, rgba(20,20,40,0.6) 100%)",
                 }}>
                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 opacity-30"
                     style={{
                         background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.04) 37%, transparent 63%)",
                         backgroundSize: "200% 100%",
                         animation: "shimmer 3s ease-in-out infinite",
                     }} />
                {/* Decorative orbs */}
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                     style={{
                         backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                         backgroundSize: "32px 32px",
                     }} />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <p className="text-violet-300/80 text-sm font-medium tracking-wide uppercase">{greeting},</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                            {user.name.split(" ")[0]} <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
                        </h2>
                        <p className="text-slate-300/80 text-sm sm:text-base mt-3 max-w-md leading-relaxed">
                            {ownedKits.length > 0
                                ? `You have ${ownedKits.length} kit${ownedKits.length > 1 ? "s" : ""} active. Keep the momentum going!`
                                : "Welcome to your dashboard! Browse our interview kits to get started."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {streak > 0 && (
                            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/10 border border-orange-400/20 backdrop-blur-sm">
                                <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                                <div>
                                    <p className="text-orange-300 font-bold text-lg leading-none">{streak}</p>
                                    <p className="text-orange-400/60 text-[10px] font-medium uppercase tracking-wider mt-0.5">day streak</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                    { label: "Day Streak", value: streak, icon: Flame, gradient: "from-orange-500 to-amber-500", bgGlow: "rgba(249,115,22,0.08)", suffix: "🔥", description: "consecutive days" },
                    { label: "Topics Studied", value: topicsStudied, icon: BookOpen, gradient: "from-blue-500 to-cyan-400", bgGlow: "rgba(59,130,246,0.08)", suffix: "", description: "topics completed" },
                    { label: "Kits Owned", value: ownedKits.length, icon: Package, gradient: "from-violet-500 to-purple-500", bgGlow: "rgba(139,92,246,0.08)", suffix: "", description: "active kits" },
                ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i}
                             className="group relative overflow-hidden rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 cursor-default"
                             style={{ background: `linear-gradient(135deg, ${stat.bgGlow} 0%, rgba(15,23,42,0.9) 100%)` }}>
                            {/* Hover glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                 style={{ background: `radial-gradient(circle at 50% 50%, ${stat.bgGlow} 0%, transparent 70%)` }} />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    {stat.suffix && <span className="text-2xl">{stat.suffix}</span>}
                                </div>
                                <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
                                <p className="text-slate-400 text-xs mt-1.5 font-medium">{stat.label}</p>
                                <p className="text-slate-500/70 text-[11px] mt-0.5">{stat.description}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Active Kits ── */}
            {ownedKits.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/10">
                            <Package className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base">Your Active Kits</h3>
                            <p className="text-slate-500 text-xs">Continue learning where you left off</p>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {ownedKits.map(kit => (
                            <Link key={kit._id} href={`/learn/${kit.slug}`}
                                className="group relative overflow-hidden bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 hover:border-violet-500/25 transition-all duration-500 block">
                                {/* Subtle hover glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                     style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
                                <div className="relative z-10">
                                    <div className="flex items-start gap-3.5 mb-3">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                            {kit.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate group-hover:text-violet-200 transition-colors">{kit.name}</p>
                                            <p className="text-slate-500 text-xs mt-0.5">{kit.chaptersCount} chapters · {kit.topicsCount} topics</p>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5 h-5">Owned</Badge>
                                    </div>
                                    <p className="text-slate-400 text-xs line-clamp-1 mb-3">{kit.description}</p>
                                    <div className="flex items-center gap-2 text-violet-400/70 text-xs font-medium group-hover:text-violet-300 transition-colors">
                                        Continue learning
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Empty state ── */}
            {ownedKits.length === 0 && (
                <div className="relative overflow-hidden text-center py-16 px-8 rounded-3xl border border-dashed border-white/10"
                     style={{ background: "linear-gradient(135deg, rgba(30,20,50,0.5) 0%, rgba(15,23,42,0.5) 100%)" }}>
                    <div className="absolute inset-0 opacity-[0.03]"
                         style={{
                             backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                             backgroundSize: "24px 24px",
                         }} />
                    <div className="relative z-10">
                        <div className="text-5xl mb-5">📦</div>
                        <h3 className="text-white font-bold text-lg mb-2">No kits yet</h3>
                        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">Browse our interview preparation kits and start your journey toward your dream frontend role.</p>
                        <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 px-6 py-2.5" asChild>
                            <Link href="/#pricing">Browse Kits <ChevronRight className="w-4 h-4 ml-1" /></Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Quick Links ── */}
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/10">
                        <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-base">Quick Links</h3>
                        <p className="text-slate-500 text-xs">Jump to interview prep kits</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "JavaScript Kit", href: "/checkout/javascript", emoji: "⚡", desc: "Master JS fundamentals", gradient: "from-yellow-500/8 to-amber-500/5" },
                        { label: "React Kit", href: "/checkout/react", emoji: "⚛️", desc: "Component mastery", gradient: "from-cyan-500/8 to-blue-500/5" },
                        { label: "Complete Kit", href: "/checkout/complete", emoji: "🚀", desc: "Full interview prep", gradient: "from-violet-500/8 to-purple-500/5" },
                    ].map(q => (
                        <Link key={q.href} href={q.href}
                            className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-400 text-sm"
                            style={{ background: `linear-gradient(135deg, ${q.gradient.includes("yellow") ? "rgba(234,179,8,0.04)" : q.gradient.includes("cyan") ? "rgba(6,182,212,0.04)" : "rgba(139,92,246,0.04)"} 0%, rgba(15,23,42,0.6) 100%)` }}>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{q.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate group-hover:text-violet-200 transition-colors">{q.label}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{q.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Inline keyframes for shimmer & wave animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    0%, 100% { background-position: 200% 0; }
                    50% { background-position: -200% 0; }
                }
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-10deg); }
                }
            `}} />
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
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-900/35 via-slate-900/90 to-cyan-900/35 border border-emerald-500/20">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                            <Video className="w-3.5 h-3.5" />
                            Human-Led Interview
                        </div>
                        <h2 className="text-2xl font-bold text-white">Schedule a React interview with our team</h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                            Pick your preferred slot and duration. After admin approval, the confirmed schedule and interview link will appear here.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <p className="text-2xl font-bold text-white">30-60</p>
                            <p className="text-slate-500 text-xs mt-1">Minutes</p>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <p className="text-2xl font-bold text-white">{completedInterviews.length}</p>
                            <p className="text-slate-500 text-xs mt-1">Reports</p>
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
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                                    : <Clock className="w-5 h-5 text-yellow-300" />}
                            </div>
                            <div>
                                <p className="text-white font-semibold">
                                    {activeInterview.status === "approved" ? "Interview scheduled" : "Interview request pending"}
                                </p>
                                <p className="text-slate-300 text-sm mt-1">
                                    {formatInterviewDate(activeInterview.preferredTime)} · {activeInterview.durationMinutes} minutes · {activeInterview.interviewType}
                                </p>
                                {activeInterview.adminNotes && <p className="text-slate-500 text-xs mt-2">{activeInterview.adminNotes}</p>}
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
                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-300" />
                        Request a Slot
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 block">Interview Type</label>
                            <select
                                value={interviewType}
                                onChange={event => setInterviewType(event.target.value)}
                                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="React Interview">React Interview</option>
                                <option value="React + JavaScript Interview">React + JavaScript Interview</option>
                                <option value="React Machine Coding Interview">React Machine Coding Interview</option>
                                <option value="React Final Mock Interview">React Final Mock Interview</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 block">Preferred Date & Time</label>
                            <input
                                type="datetime-local"
                                value={preferredTime}
                                onChange={event => setPreferredTime(event.target.value)}
                                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                            <p className="text-slate-600 text-xs mt-1.5">Choose a time at least 30 minutes from now.</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 block">Duration</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[30, 45, 60].map(duration => (
                                    <button
                                        key={duration}
                                        onClick={() => setDurationMinutes(duration as 30 | 45 | 60)}
                                        className={`h-10 rounded-xl border text-sm font-medium transition-all ${durationMinutes === duration
                                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                                    >
                                        {duration} min
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 block">Anything you want us to focus on?</label>
                            <textarea
                                value={note}
                                onChange={event => setNote(event.target.value)}
                                placeholder="Example: hooks, machine coding, project explanation, performance..."
                                className="w-full min-h-[90px] resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                        </div>
                        {error && <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                        {success && <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{success}</p>}
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

                <div className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-emerald-300" />
                            Your Interviews
                        </h3>
                        <button onClick={fetchInterviews} className="text-slate-500 hover:text-white transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    {loading ? (
                        <div className="py-16 flex justify-center">
                            <RefreshCw className="w-7 h-7 animate-spin text-slate-600" />
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <Video className="w-11 h-11 text-slate-700 mx-auto mb-3" />
                            <p className="text-white font-semibold">No interview requests yet</p>
                            <p className="text-slate-500 text-sm mt-1">Request your first team interview from the form.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {interviews.map(interview => (
                                <div key={interview._id} className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-white font-medium">{interview.interviewType}</p>
                                                <InterviewStatusBadge status={interview.status} />
                                            </div>
                                            <p className="text-slate-400 text-sm">{formatInterviewDate(interview.preferredTime)} · {interview.durationMinutes} min</p>
                                            {interview.meetingLink && interview.status === "approved" && (
                                                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-300 text-xs mt-2 hover:underline">
                                                    Meeting link <ArrowRight className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {interview.report && (
                                        <div className="mt-4 rounded-xl bg-white/5 border border-white/5 p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-white font-semibold flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-violet-300" />
                                                    Review Report
                                                </p>
                                                {interview.report.rating && <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20">{interview.report.rating}/10</Badge>}
                                            </div>
                                            {interview.report.summary && <p className="text-slate-300 text-sm mb-3">{interview.report.summary}</p>}
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
        pending: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
        approved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        rejected: "bg-red-500/10 text-red-300 border-red-500/20",
        completed: "bg-violet-500/10 text-violet-300 border-violet-500/20",
        cancelled: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    };

    return <Badge className={`${styles[status]} capitalize`}>{status}</Badge>;
}

function ReportBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-lg bg-slate-950/40 border border-white/5 p-3">
            <p className="text-slate-500 text-xs font-semibold mb-1">{title}</p>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{value}</p>
        </div>
    );
}

function formatInterviewDate(value: string) {
    return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

// ─── Live AI Interview Tab ────────────────────────────────────
type InterviewRoundId = "react" | "javascript" | "machine-coding" | "hr";
type InterviewPhase = "setup" | "live" | "summary";

interface InterviewQuestion {
    prompt: string;
    followUp: string;
    keywords: string[];
}

interface InterviewRound {
    id: InterviewRoundId;
    title: string;
    description: string;
    duration: number;
    icon: string;
    questions: InterviewQuestion[];
}

interface InterviewAnswer {
    question: string;
    answer: string;
    score: number;
    feedback: string[];
    missingKeywords: string[];
}

const INTERVIEW_ROUNDS: InterviewRound[] = [
    {
        id: "react",
        title: "React Technical",
        description: "Hooks, rendering, performance, state, and production patterns.",
        duration: 12,
        icon: "⚛️",
        questions: [
            {
                prompt: "Explain how React reconciliation works and why keys matter in lists.",
                followUp: "What can go wrong if you use array index as a key?",
                keywords: ["virtual dom", "diff", "fiber", "key", "state", "re-render", "identity"],
            },
            {
                prompt: "When would you use useMemo, useCallback, and React.memo?",
                followUp: "How do you decide whether the optimization is worth it?",
                keywords: ["memoization", "reference", "props", "expensive", "render", "profiler", "dependency"],
            },
            {
                prompt: "Describe a safe way to fetch data inside useEffect.",
                followUp: "How would you avoid race conditions or setting state after unmount?",
                keywords: ["dependency", "cleanup", "abortcontroller", "loading", "error", "race", "async"],
            },
            {
                prompt: "How would you structure state for a complex multi-step form?",
                followUp: "What would you keep local versus global?",
                keywords: ["useReducer", "validation", "controlled", "state", "context", "schema", "submit"],
            },
        ],
    },
    {
        id: "javascript",
        title: "JavaScript Deep Dive",
        description: "Event loop, closures, promises, prototypes, and tricky output questions.",
        duration: 10,
        icon: "⚡",
        questions: [
            {
                prompt: "Explain the event loop using microtasks and macrotasks.",
                followUp: "Where do Promise callbacks and setTimeout callbacks run?",
                keywords: ["call stack", "microtask", "macrotask", "promise", "queue", "settimeout", "async"],
            },
            {
                prompt: "What is a closure, and where have you used one practically?",
                followUp: "Can closures cause memory issues?",
                keywords: ["lexical", "scope", "function", "private", "factory", "memory", "reference"],
            },
            {
                prompt: "Compare Promise.all and Promise.allSettled.",
                followUp: "Which one would you use for independent API calls?",
                keywords: ["parallel", "reject", "fulfilled", "settled", "error", "array", "fail"],
            },
        ],
    },
    {
        id: "machine-coding",
        title: "Machine Coding",
        description: "Frontend component design, edge cases, accessibility, and tradeoffs.",
        duration: 15,
        icon: "🧩",
        questions: [
            {
                prompt: "Design an autocomplete component from scratch. Walk through state, API calls, keyboard behavior, and accessibility.",
                followUp: "How would you handle slow responses and duplicate requests?",
                keywords: ["debounce", "keyboard", "aria", "loading", "cache", "abort", "highlight"],
            },
            {
                prompt: "Build a reusable modal component. What requirements would you cover?",
                followUp: "How would you handle focus trap and body scroll locking?",
                keywords: ["portal", "escape", "overlay", "focus", "scroll", "accessibility", "cleanup"],
            },
            {
                prompt: "How would you implement an infinite scrolling feed?",
                followUp: "What edge cases appear on mobile or slow networks?",
                keywords: ["intersectionobserver", "pagination", "cursor", "loading", "error", "virtualization", "cache"],
            },
        ],
    },
    {
        id: "hr",
        title: "HR + Communication",
        description: "Project explanation, behavioral answers, ownership, and clarity.",
        duration: 8,
        icon: "💬",
        questions: [
            {
                prompt: "Tell me about yourself for a frontend interview.",
                followUp: "Can you connect your answer to the role you are applying for?",
                keywords: ["experience", "frontend", "project", "impact", "skills", "role", "learning"],
            },
            {
                prompt: "Explain your best project like you would to an interviewer.",
                followUp: "What was the hardest technical problem in that project?",
                keywords: ["problem", "architecture", "tradeoff", "performance", "users", "challenge", "result"],
            },
            {
                prompt: "Tell me about a time you received feedback and improved.",
                followUp: "What changed in your process after that?",
                keywords: ["feedback", "improved", "learned", "example", "action", "result", "reflection"],
            },
        ],
    },
];

function LiveAIInterviewTab({ user }: { user: SessionUser }) {
    const [selectedRoundId, setSelectedRoundId] = useState<InterviewRoundId>("react");
    const [phase, setPhase] = useState<InterviewPhase>("setup");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
    const [secondsLeft, setSecondsLeft] = useState(INTERVIEW_ROUNDS[0].duration * 60);
    const [listening, setListening] = useState(false);

    const selectedRound = useMemo(
        () => INTERVIEW_ROUNDS.find(round => round.id === selectedRoundId) || INTERVIEW_ROUNDS[0],
        [selectedRoundId]
    );
    const currentQuestion = selectedRound.questions[questionIndex];
    const averageScore = answers.length
        ? Math.round(answers.reduce((sum, item) => sum + item.score, 0) / answers.length)
        : 0;

    useEffect(() => {
        if (phase !== "live") return;
        if (secondsLeft <= 0) {
            setPhase("summary");
            return;
        }

        const timer = window.setInterval(() => setSecondsLeft(value => value - 1), 1000);
        return () => window.clearInterval(timer);
    }, [phase, secondsLeft]);

    const resetInterview = useCallback((round = selectedRound) => {
        setQuestionIndex(0);
        setAnswer("");
        setAnswers([]);
        setSecondsLeft(round.duration * 60);
        setPhase("setup");
        setListening(false);
    }, [selectedRound]);

    const startInterview = () => {
        setQuestionIndex(0);
        setAnswer("");
        setAnswers([]);
        setSecondsLeft(selectedRound.duration * 60);
        setPhase("live");
        speakQuestion(selectedRound.questions[0].prompt);
    };

    const submitAnswer = () => {
        if (!currentQuestion) return;

        const evaluated = evaluateInterviewAnswer(currentQuestion, answer);
        const nextAnswers = [...answers, evaluated];
        setAnswers(nextAnswers);

        if (questionIndex >= selectedRound.questions.length - 1) {
            setPhase("summary");
            saveInterviewAttempt(selectedRound.id, nextAnswers);
            return;
        }

        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        setAnswer("");
        speakQuestion(selectedRound.questions[nextIndex].prompt);
    };

    const toggleVoiceInput = () => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setAnswer(value => `${value}${value ? "\n\n" : ""}Voice input is not supported in this browser. You can type your answer here.`);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = () => setListening(false);
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0]?.transcript)
                .filter(Boolean)
                .join(" ");
            setAnswer(value => `${value}${value ? " " : ""}${transcript}`);
        };

        recognition.start();
    };

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, "0");

    if (phase === "summary") {
        return (
            <div className="space-y-6 max-w-5xl">
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/30 via-slate-900/90 to-cyan-900/30 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                                <Sparkles className="w-3.5 h-3.5" />
                                Interview complete
                            </div>
                            <h2 className="text-2xl font-bold text-white">{selectedRound.title} report</h2>
                            <p className="text-slate-400 text-sm mt-2">Nice work, {user.name.split(" ")[0]}. Review the feedback, then retry the weak answers.</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-5xl font-black text-white">{averageScore}</p>
                            <p className="text-slate-500 text-xs">average score</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <InterviewScoreCard label="Questions answered" value={`${answers.length}/${selectedRound.questions.length}`} icon={MessageSquare} />
                    <InterviewScoreCard label="Strongest answer" value={`${Math.max(...answers.map(item => item.score), 0)}/100`} icon={Award} />
                    <InterviewScoreCard label="Retry focus" value={getRetryFocus(answers)} icon={Target} />
                </div>

                <div className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-white font-semibold">AI Feedback</h3>
                        <Button size="sm" variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5" onClick={() => resetInterview()}>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Practice Again
                        </Button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {answers.map((item, index) => (
                            <div key={index} className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Question {index + 1}</p>
                                        <p className="text-white font-medium">{item.question}</p>
                                    </div>
                                    <Badge className={`${item.score >= 75 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : item.score >= 50 ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
                                        {item.score}/100
                                    </Badge>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                        <p className="text-slate-400 text-xs font-semibold mb-2">Feedback</p>
                                        <ul className="space-y-1.5">
                                            {item.feedback.map(point => (
                                                <li key={point} className="text-sm text-slate-300 flex gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                        <p className="text-slate-400 text-xs font-semibold mb-2">Missing Signals</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.missingKeywords.length > 0 ? item.missingKeywords.map(keyword => (
                                                <span key={keyword} className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">{keyword}</span>
                                            )) : <span className="text-sm text-slate-500">You covered the important signals.</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-900/40 via-slate-900/90 to-cyan-900/40 border border-violet-500/20">
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
                            <Bot className="w-3.5 h-3.5" />
                            Live AI Interview
                        </div>
                        <h2 className="text-2xl font-bold text-white">Practice like a real interview</h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                            Answer timed questions, use voice input if your browser supports it, and get instant scoring with improvement points.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                            <Timer className="w-5 h-5 text-cyan-300 mx-auto mb-2" />
                            <p className="text-white font-bold">{minutes}:{seconds}</p>
                            <p className="text-slate-500 text-[10px]">Time left</p>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                            <MessageSquare className="w-5 h-5 text-violet-300 mx-auto mb-2" />
                            <p className="text-white font-bold">{phase === "live" ? questionIndex + 1 : 0}/{selectedRound.questions.length}</p>
                            <p className="text-slate-500 text-[10px]">Questions</p>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                            <Brain className="w-5 h-5 text-emerald-300 mx-auto mb-2" />
                            <p className="text-white font-bold">AI</p>
                            <p className="text-slate-500 text-[10px]">Feedback</p>
                        </div>
                    </div>
                </div>
            </div>

            {phase === "setup" ? (
                <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                        <h3 className="text-white font-semibold mb-4">Choose Interview Round</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {INTERVIEW_ROUNDS.map(round => (
                                <button
                                    key={round.id}
                                    onClick={() => { setSelectedRoundId(round.id); resetInterview(round); }}
                                    className={`text-left rounded-2xl border p-5 transition-all ${selectedRoundId === round.id
                                        ? "bg-violet-500/10 border-violet-500/30"
                                        : "bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10"}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-3xl">{round.icon}</span>
                                        <Badge className="bg-white/5 text-slate-400 border-white/10">{round.duration} min</Badge>
                                    </div>
                                    <p className="text-white font-semibold">{round.title}</p>
                                    <p className="text-slate-500 text-sm mt-1">{round.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                        <h3 className="text-white font-semibold mb-4">Session Preview</h3>
                        <div className="space-y-4">
                            {selectedRound.questions.map((question, index) => (
                                <div key={question.prompt} className="flex gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <p className="text-slate-300 text-sm">{question.prompt}</p>
                                </div>
                            ))}
                        </div>
                        <Button onClick={startInterview} className="w-full mt-6 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Live Interview
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-5">
                            <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20">{selectedRound.title}</Badge>
                            <span className="text-slate-500 text-xs">Question {questionIndex + 1} of {selectedRound.questions.length}</span>
                        </div>
                        <div className="min-h-[260px] flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-white text-xl font-bold leading-snug">{currentQuestion.prompt}</h3>
                                <p className="text-slate-400 text-sm mt-4 border-l-2 border-cyan-500/40 pl-3">{currentQuestion.followUp}</p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5" onClick={() => speakQuestion(currentQuestion.prompt)}>
                                    <Bot className="w-4 h-4 mr-2" />
                                    Repeat
                                </Button>
                                <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5" onClick={() => resetInterview()}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold">Your Answer</h3>
                            <button
                                onClick={toggleVoiceInput}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${listening
                                    ? "bg-red-500/10 border-red-500/20 text-red-300"
                                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                            >
                                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                {listening ? "Listening" : "Voice"}
                            </button>
                        </div>
                        <textarea
                            value={answer}
                            onChange={event => setAnswer(event.target.value)}
                            placeholder="Speak or type your answer. Try to explain the concept, tradeoffs, edge cases, and one real example."
                            className="w-full min-h-[260px] resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                            <p className="text-xs text-slate-500">{answer.trim().split(/\s+/).filter(Boolean).length} words · aim for 80+ words</p>
                            <Button onClick={submitAnswer} disabled={answer.trim().length < 20} className="bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40">
                                {questionIndex >= selectedRound.questions.length - 1 ? "Finish Interview" : "Submit Answer"}
                                <Send className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InterviewScoreCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
    return (
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
            <Icon className="w-5 h-5 text-violet-300 mb-3" />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
        </div>
    );
}

function evaluateInterviewAnswer(question: InterviewQuestion, answer: string): InterviewAnswer {
    const normalized = answer.toLowerCase();
    const words = answer.trim().split(/\s+/).filter(Boolean);
    const coveredKeywords = question.keywords.filter(keyword => normalized.includes(keyword.toLowerCase()));
    const missingKeywords = question.keywords.filter(keyword => !normalized.includes(keyword.toLowerCase())).slice(0, 5);
    const hasExample = /example|for instance|in my project|i used|scenario|case/i.test(answer);
    const hasTradeoff = /tradeoff|depends|however|but|cost|risk|pros|cons/i.test(answer);
    const hasStructure = /first|second|third|because|therefore|finally|step/i.test(answer);

    const lengthScore = Math.min(30, Math.round((words.length / 90) * 30));
    const keywordScore = Math.round((coveredKeywords.length / Math.max(question.keywords.length, 1)) * 45);
    const clarityScore = (hasExample ? 10 : 0) + (hasTradeoff ? 8 : 0) + (hasStructure ? 7 : 0);
    const score = Math.min(100, Math.max(10, lengthScore + keywordScore + clarityScore));

    const feedback = [
        words.length >= 80 ? "Good depth for a spoken interview answer." : "Add more depth: define the concept, explain why it matters, and include a small example.",
        coveredKeywords.length >= 3 ? "You covered several important technical signals." : "Mention more interview keywords so the answer sounds technically complete.",
        hasExample ? "The answer includes practical context, which helps interviewers trust your experience." : "Add one concrete project or code example.",
        hasTradeoff ? "Good: you mentioned tradeoffs or conditions." : "Add tradeoffs, edge cases, or when not to use this approach.",
    ];

    return {
        question: question.prompt,
        answer,
        score,
        feedback,
        missingKeywords,
    };
}

function getRetryFocus(answers: InterviewAnswer[]) {
    if (!answers.length) return "Start";
    const weakest = answers.reduce((low, item) => item.score < low.score ? item : low, answers[0]);
    return weakest.missingKeywords[0] || "Clarity";
}

function saveInterviewAttempt(roundId: InterviewRoundId, answers: InterviewAnswer[]) {
    if (typeof window === "undefined") return;
    const attempts = JSON.parse(localStorage.getItem("gf-ai-interview-attempts") || "[]");
    const averageScore = answers.length
        ? Math.round(answers.reduce((sum, item) => sum + item.score, 0) / answers.length)
        : 0;

    localStorage.setItem("gf-ai-interview-attempts", JSON.stringify([
        { roundId, averageScore, answersCount: answers.length, createdAt: new Date().toISOString() },
        ...attempts,
    ].slice(0, 20)));
}

function speakQuestion(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
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
                <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-cyan-900/40 via-slate-900/80 to-violet-900/40 border border-cyan-500/20">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
                            <Trophy className="w-3.5 h-3.5" />
                            React Kit Leaderboard
                        </div>
                        <h2 className="text-2xl font-bold text-white">Climb with consistent progress</h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                            Rankings are based on React kit topics completed, with streaks used to break close ties.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <p className="text-2xl font-bold text-white">{participantsCount}</p>
                            <p className="text-slate-500 text-xs mt-1">Students ranked</p>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <p className="text-2xl font-bold text-white">{totalTopics}</p>
                            <p className="text-slate-500 text-xs mt-1">React topics</p>
                        </div>
                    </div>
                </div>
            </div>

            {currentUser && (
                <div className="bg-slate-900/80 border border-violet-500/20 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                #{currentUser.rank}
                            </div>
                            <div>
                                <p className="text-white font-semibold">Your React rank</p>
                                <p className="text-slate-500 text-sm">
                                    {currentUser.completedCount}/{currentUser.totalTopics} topics completed · {currentUser.currentStreak} day streak
                                </p>
                            </div>
                        </div>
                        <div className="sm:w-56">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500">Progress</span>
                                <span className="text-cyan-300 font-semibold">{currentUser.progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
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

            <div className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Medal className="w-4 h-4 text-amber-400" />
                        React Rankings
                    </h3>
                    <span className="text-xs text-slate-500">Top 25 students</span>
                </div>

                {rows.length === 0 ? (
                    <div className="text-center py-14 px-6">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                        <p className="text-white font-semibold mb-1">No React progress yet</p>
                        <p className="text-slate-500 text-sm mb-5">Complete your first React topic to appear on the leaderboard.</p>
                        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white" asChild>
                            <Link href="/learn/react-interview-kit">Start React Kit</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
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
        <div className={`bg-slate-900/80 border rounded-2xl p-5 ${row.isCurrentUser ? "border-violet-500/30" : "border-white/5"}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${medalClass} flex items-center justify-center text-white font-bold shadow-lg`}>
                    #{row.rank}
                </div>
                {row.isCurrentUser && <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20">You</Badge>}
            </div>
            <div className="flex items-center gap-3 mb-4">
                <AvatarBubble row={row} />
                <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{row.name}</p>
                    <p className="text-slate-500 text-xs">{row.currentStreak} day streak</p>
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">{row.completedCount}/{row.totalTopics} topics</span>
                    <span className="text-cyan-300 font-semibold">{row.progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${row.progressPercent}%` }} />
                </div>
            </div>
        </div>
    );
}

function LeaderboardListRow({ row }: { row: LeaderboardRow }) {
    return (
        <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${row.isCurrentUser ? "bg-violet-500/10" : "hover:bg-white/3"}`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 text-sm font-bold flex-shrink-0">
                    {row.rank}
                </div>
                <AvatarBubble row={row} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">{row.name}</p>
                        {row.isCurrentUser && <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px] px-1.5 py-0 h-4">You</Badge>}
                    </div>
                    <p className="text-slate-500 text-xs">{row.completedCount}/{row.totalTopics} React topics completed</p>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[160px_90px_90px] items-center gap-3 sm:gap-4">
                <div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${row.progressPercent}%` }} />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white text-sm font-semibold">{row.progressPercent}%</p>
                    <p className="text-slate-600 text-[10px]">Progress</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-orange-400 text-sm font-semibold">{row.currentStreak}d</p>
                    <p className="text-slate-600 text-[10px]">Streak</p>
                </div>
            </div>
        </div>
    );
}

function AvatarBubble({ row }: { row: LeaderboardRow }) {
    if (row.profilePicture) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.profilePicture} alt={row.name} className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0" />
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

    useEffect(() => {
        fetch("/api/learn/kits")
            .then(r => r.json())
            .then(d => { if (d.kits) setAllKits(d.kits); })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        );
    }

    const visibleKits = allKits.filter(kit => !isNodeKit(kit));
    const ownedKits = visibleKits.filter(k => k.hasAccess);
    const lockedKits = visibleKits.filter(k => !k.hasAccess);
    const featuredOwnedKit = ownedKits[0];

    return (
        <div className="space-y-8 max-w-6xl">
            <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-950 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_36%)]" />
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 mb-3">
                            Your learning library
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                            {featuredOwnedKit ? "Continue with your active kit" : "Choose a kit and start preparing"}
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                            {featuredOwnedKit
                                ? `${featuredOwnedKit.name} is ready with ${featuredOwnedKit.chaptersCount} chapters and ${featuredOwnedKit.topicsCount} topics.`
                                : "Pick the kit that matches your next interview goal. Your purchased kits will appear here instantly after checkout."}
                        </p>
                    </div>

                    {featuredOwnedKit ? (
                        <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/40" asChild>
                            <Link href={`/learn/${featuredOwnedKit.slug}`}>
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
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                Purchased Kits
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Your active interview prep content.</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                            {ownedKits.length} active
                        </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {ownedKits.map(kit => (
                            <Link key={kit._id} href={`/learn/${kit.slug}`}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5 hover:border-violet-400/40 hover:bg-slate-900 transition-all">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 via-violet-400 to-cyan-400" />
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                                        {kit.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Badge className="bg-green-500/10 text-green-300 border-green-500/20 text-[10px] px-2 py-0.5">
                                                Owned
                                            </Badge>
                                            <Badge variant="outline" className="border-white/10 text-slate-400 text-[10px] px-2 py-0.5">
                                                Lifetime access
                                            </Badge>
                                        </div>
                                        <p className="text-white font-semibold group-hover:text-violet-200 transition-colors">
                                            {kit.name}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{kit.description}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                                        <p className="text-lg font-bold text-white">{kit.chaptersCount}</p>
                                        <p className="text-[11px] text-slate-500">Chapters</p>
                                    </div>
                                    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                                        <p className="text-lg font-bold text-white">{kit.topicsCount}</p>
                                        <p className="text-[11px] text-slate-500">Topics</p>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between text-sm">
                                    <span className="text-violet-300 font-medium">Start learning</span>
                                    <ArrowRight className="w-4 h-4 text-violet-300 group-hover:translate-x-1 transition-transform" />
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
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-violet-300" />
                                Recommended Next Kits
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Add focused prep for the rounds you still want to strengthen.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {lockedKits.map(kit => (
                            <div key={kit._id} className="group rounded-2xl border border-white/5 bg-slate-900/70 p-5 hover:border-violet-400/40 hover:bg-slate-900 transition-all">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl shadow-lg`}>
                                        {kit.icon}
                                    </div>
                                    <Badge className="bg-white/5 text-slate-400 border-white/10 text-[10px] px-2 py-0.5">
                                        <Lock className="w-2.5 h-2.5 mr-1" />
                                        Locked
                                    </Badge>
                                </div>

                                <h3 className="text-white font-semibold leading-snug group-hover:text-violet-200 transition-colors">{kit.name}</h3>
                                <p className="text-slate-500 text-xs mt-2 line-clamp-2 min-h-[2rem]">{kit.description}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="border-white/10 text-slate-400 text-[10px]">
                                        {kit.chaptersCount} chapters
                                    </Badge>
                                    <Badge variant="outline" className="border-white/10 text-slate-400 text-[10px]">
                                        {kit.topicsCount} topics
                                    </Badge>
                                </div>

                                <div className="mt-5">
                                    <Button size="sm" className="w-full bg-white text-slate-950 hover:bg-violet-100" asChild>
                                        <Link href={getCheckoutPathForKit(kit)}>
                                            View Kit
                                            <ChevronRight className="w-4 h-4 ml-1" />
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
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No kits available right now.</p>
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
                        <div key={i} className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                            <Icon className={`w-5 h-5 text-${s.color}-400 mb-3`} />
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-slate-500 text-xs mb-3">{s.label}</p>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full bg-${s.color}-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Weekly activity */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-400" />
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
                                            : "bg-slate-700 hover:bg-slate-600"
                                            }`}
                                        style={{ height: `${height}%`, minHeight: 4 }}
                                    />
                                </div>
                                <span className={`text-xs ${isToday ? "text-violet-400 font-semibold" : "text-slate-600"}`}>{day}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Per-kit progress */}
            {ownedKits.length > 0 && (
                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-400" />
                        Kit Progress
                    </h3>
                    <div className="space-y-5">
                        {ownedKits.map(kit => (
                            <div key={kit._id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                        <span>{kit.icon}</span> {kit.name}
                                    </span>
                                    <span className="text-slate-500 text-xs">{kit.chaptersCount} chapters · {kit.topicsCount} topics</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
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
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-2">Your Achievements</h3>
                <p className="text-slate-500 text-sm mb-6">{badges.filter(b => b.unlocked).length} of {badges.length} unlocked</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {badges.map((b, i) => (
                        <div key={i} className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${b.unlocked
                            ? "bg-gradient-to-b from-violet-900/30 to-slate-900/50 border-violet-500/30"
                            : "bg-slate-900/30 border-white/5 opacity-40 grayscale"}`}>
                            <div className={`text-4xl mb-2 ${b.unlocked ? "" : "opacity-50"}`}>{b.emoji}</div>
                            <p className={`text-xs font-semibold mb-1 ${b.unlocked ? "text-violet-300" : "text-slate-500"}`}>{b.title}</p>
                            <p className="text-xs text-slate-600">{b.desc}</p>
                            {b.unlocked && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Leaderboard Position
                </h3>
                <div className="text-center py-8">
                    <p className="text-5xl font-black text-white">#142</p>
                    <p className="text-slate-400 text-sm mt-2">out of 12,450+ students</p>
                    <p className="text-violet-400 text-xs mt-1">Top 2% 🎉</p>
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
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
                <div className="px-6 pb-6 -mt-12">
                    <div className="flex items-end gap-4 mb-4">
                        {user.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profilePicture} alt={user.name}
                                className="w-20 h-20 rounded-2xl border-4 border-slate-900 object-cover" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {initials}
                            </div>
                        )}
                        <div className="pb-1">
                            <h2 className="text-white text-xl font-bold">{user.name}</h2>
                            <p className="text-slate-400 text-sm">Member since {joinDate}</p>
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
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">{row.label}</p>
                                        <p className="text-white text-sm font-medium">{row.value}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Preferences / settings */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account
                </h3>
                <div className="space-y-2">
                    <Link href="/contact"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-white group">
                        <span className="text-sm">Contact Support</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                    </Link>
                    <Link href="/privacy"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-white group">
                        <span className="text-sm">Privacy Policy</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                    </Link>
                    <Link href="/terms"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-white group">
                        <span className="text-sm">Terms of Service</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
