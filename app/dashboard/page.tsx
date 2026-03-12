// app/dashboard/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard, BookOpen, TrendingUp, Award, Settings,
    LogOut, X, Menu, User, Mail, Calendar, CheckCircle2,
    Target, Zap, Clock, Star, ChevronRight, Package, Lock,
    BarChart2, Flame, RefreshCw, ShoppingBag, Building2, ArrowRight
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

const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "kits", label: "My Kits", icon: Package },
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

    // Load progress from API
    const fetchProgress = useCallback(async () => {
        try {
            const res = await fetch("/api/user/progress")
            if (res.ok) {
                const data = await res.json()
                const completed = data.completedQuestions || []
                setCompletedQuestions(new Set(completed))
                setFavorites(new Set(data.favoriteQuestions || []))
                setTopicsStudied(completed.length)
                // Rough estimate: ~3 min per topic studied
                setHoursSpent(Math.round((completed.length * 3) / 60))
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

    const ownedKits = dbKits.filter(k => k.hasAccess)

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-slate-900/50 border border-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-transparent" />
                <div className="relative">
                    <p className="text-slate-400 text-sm">{greeting},</p>
                    <h2 className="text-2xl font-bold text-white mt-1">{user.name.split(" ")[0]} 👋</h2>
                    <p className="text-slate-300 text-sm mt-2">
                        {ownedKits.length > 0
                            ? `You have ${ownedKits.length} kit${ownedKits.length > 1 ? "s" : ""} active. Keep the momentum going!`
                            : "Welcome to your dashboard! Browse our interview kits to get started."}
                    </p>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-20 pointer-events-none">🚀</div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Day Streak", value: streak, icon: Flame, color: "from-orange-500 to-red-500", suffix: "🔥" },
                    { label: "Topics Studied", value: topicsStudied, icon: BookOpen, color: "from-blue-500 to-cyan-500", suffix: "" },
                    { label: "Kits Owned", value: ownedKits.length, icon: Package, color: "from-violet-500 to-purple-500", suffix: "" },
                ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="bg-slate-900/80 border border-white/5 rounded-2xl p-4">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}{stat.suffix}</p>
                            <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
                        </div>
                    )
                })}
            </div>

            {/* My Kits — driven from DB */}
            {ownedKits.length > 0 && (
                <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-violet-400" />
                        Your Active Kits
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {ownedKits.map(kit => (
                            <Link key={kit._id} href={`/learn/${kit.slug}`}
                                className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 hover:border-violet-500/30 transition-all group block">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-lg flex-shrink-0`}>
                                        {kit.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold truncate">{kit.name}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">{kit.chaptersCount} chapters · {kit.topicsCount} topics</p>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0 h-4">Owned</Badge>
                                </div>
                                <p className="text-slate-400 text-xs line-clamp-1">{kit.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Explore kits CTA */}
            {ownedKits.length === 0 && (
                <div className="text-center py-12 px-6 rounded-2xl bg-slate-900/50 border border-dashed border-white/10">
                    <div className="text-4xl mb-4">📦</div>
                    <h3 className="text-white font-semibold mb-2">No kits yet</h3>
                    <p className="text-slate-400 text-sm mb-6">Browse our interview preparation kits and start your journey.</p>
                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white" asChild>
                        <Link href="/#pricing">Browse Kits <ChevronRight className="w-4 h-4 ml-1" /></Link>
                    </Button>
                </div>
            )}

            {/* Quick links */}
            <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Quick Links
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: "JavaScript Kit", href: "/checkout/javascript", emoji: "⚡" },
                        { label: "React Kit", href: "/checkout/react", emoji: "⚛️" },
                        { label: "Node.js Kit", href: "/checkout/nodejs", emoji: "🟢" },
                        { label: "Complete Kit", href: "/checkout/complete", emoji: "🚀" },
                        { label: "Placement Kit", href: "/checkout/placement", emoji: "🎓" },
                    ].map(q => (
                        <Link key={q.href} href={q.href}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:border-violet-500/30 hover:bg-white/5 transition-all text-slate-300 hover:text-white text-sm font-medium group">
                            <span className="text-xl">{q.emoji}</span>
                            <span className="truncate">{q.label}</span>
                            <ChevronRight className="w-3 h-3 ml-auto text-slate-600 group-hover:text-violet-400 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
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

    const ownedKits = allKits.filter(k => k.hasAccess);
    const lockedKits = allKits.filter(k => !k.hasAccess);

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Owned kits */}
            {ownedKits.length > 0 && (
                <section>
                    <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        Your Kits ({ownedKits.length})
                    </h2>
                    <div className="space-y-3">
                        {ownedKits.map(kit => (
                            <div key={kit._id} className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 hover:border-violet-500/30 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl flex-shrink-0`}>{kit.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold flex items-center gap-2">
                                            {kit.name}
                                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0 h-4">Owned</Badge>
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">{kit.chaptersCount} chapters · {kit.topicsCount} topics</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end flex-shrink-0">
                                    <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white" asChild>
                                        <Link href={`/learn/${kit.slug}`}>Start Learning <ArrowRight className="w-4 h-4 ml-1" /></Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Locked kits — available for purchase */}
            {lockedKits.length > 0 && (
                <section>
                    <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                        Available Kits ({lockedKits.length})
                    </h2>
                    <div className="space-y-3">
                        {lockedKits.map(kit => (
                            <div key={kit._id} className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center opacity-70">
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl flex-shrink-0 opacity-60`}>{kit.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold flex items-center gap-2">
                                            {kit.name}
                                            <Badge className="bg-white/5 text-slate-500 border-white/10 text-[10px] px-1.5 py-0 h-4">
                                                <Lock className="w-2.5 h-2.5 mr-0.5" /> Locked
                                            </Badge>
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">{kit.chaptersCount} chapters · {kit.topicsCount} topics</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end flex-shrink-0">
                                    <Button size="sm" variant="outline" className="text-violet-400 border-violet-500/30 hover:bg-violet-500/10" asChild>
                                        <Link href={`/checkout/${kit.slug.replace(/-interview-kit|-backend-kit|-frontend-kit|-kit/g, '')}`}>Get Access <ChevronRight className="w-4 h-4 ml-1" /></Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state */}
            {allKits.length === 0 && (
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
