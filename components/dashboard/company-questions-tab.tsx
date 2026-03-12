// components/dashboard/company-questions-tab.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Search, ChevronRight, ArrowLeft, Star, BookmarkPlus,
    Bookmark, BarChart2, PieChart, CheckCircle2, Circle,
    ChevronDown, Loader2, ExternalLink
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

// ─── Types (from API) ────────────────────────────────────

interface ApiCompany {
    _id: string
    name: string
    slug: string
    logo: string
    color: string
    totalQuestions: number
    difficulty: { easy: number; medium: number; hard: number }
    patterns: { name: string; count: number }[]
}

interface ApiQuestion {
    _id: string
    companyId: string
    title: string
    link?: string
    difficulty: "Easy" | "Medium" | "Hard"
    platform: string
    popularity: string
    tags: string[]
    frequency: number
}

// ─── Helpers ─────────────────────────────────────────────

/** Returns true if the logo string is a URL (http/https or starts with /) */
function isImageUrl(logo: string): boolean {
    return logo.startsWith("http") || logo.startsWith("/")
}

/** Renders a company logo — image or emoji fallback */
function CompanyLogo({ logo, color, size = 48, className = "" }: {
    logo: string; color: string; size?: number; className?: string
}) {
    if (isImageUrl(logo)) {
        return (
            <div className={`flex-shrink-0 overflow-hidden rounded-xl bg-white/10 ${className}`}
                style={{ width: size, height: size }}>
                <Image src={logo} alt="logo" width={size} height={size}
                    className="w-full h-full object-cover" unoptimized />
            </div>
        )
    }
    return (
        <div className={`flex items-center justify-center flex-shrink-0 rounded-xl bg-gradient-to-br ${color} shadow-lg ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.5 }}>
            {logo}
        </div>
    )
}

// ─── Platform logos ──────────────────────────────────────

const PLATFORM_INFO: Record<string, { label: string; icon: string; bg: string }> = {
    leetcode: { label: "LeetCode", icon: "/platforms/leetcode.svg", bg: "bg-[#FFA116]/10" },
    gfg: { label: "GeeksForGeeks", icon: "/platforms/gfg.svg", bg: "bg-[#2F8D46]/10" },
    hackerrank: { label: "HackerRank", icon: "/platforms/hackerrank.svg", bg: "bg-[#00EA64]/10" },
    codechef: { label: "CodeChef", icon: "/platforms/codechef.svg", bg: "bg-[#5B4638]/10" },
    interviewbit: { label: "InterviewBit", icon: "/platforms/interviewbit.svg", bg: "bg-[#3B86F7]/10" },
}

function PlatformIcon({ platform, size = 20 }: { platform: string; size?: number }) {
    const info = PLATFORM_INFO[platform]
    if (!info) return <span className="text-xs text-slate-500">{platform}</span>
    return (
        <div className={`inline-flex items-center justify-center rounded-md ${info.bg} p-1`}
            title={info.label} style={{ width: size + 8, height: size + 8 }}>
            <Image src={info.icon} alt={info.label} width={size} height={size} unoptimized />
        </div>
    )
}

// ─── Constants ───────────────────────────────────────────

const DIFF_COLOR: Record<string, { bg: string; text: string; border: string }> = {
    Easy: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
    Medium: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    Hard: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
}

const POP_COLOR: Record<string, { bg: string; text: string }> = {
    "Very Hot": { bg: "bg-red-500", text: "text-white" },
    "Hot": { bg: "bg-orange-500", text: "text-white" },
    "Warm": { bg: "bg-yellow-500/80", text: "text-black" },
}

// ─── Main Export ─────────────────────────────────────────

interface Props {
    completedQuestions: Set<string>
    onToggleComplete: (qid: string) => void
    favorites: Set<string>
    onToggleFavorite: (qid: string) => void
}

export function CompanyQuestionsTab({
    completedQuestions, onToggleComplete, favorites, onToggleFavorite,
}: Props) {
    const [companies, setCompanies] = useState<ApiCompany[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch("/api/companies")
                const data = await res.json()
                if (res.ok) setCompanies(data.companies)
            } catch (e) { console.error(e) }
            setLoading(false)
        }
        fetchCompanies()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
        )
    }

    if (selectedCompanyId) {
        const company = companies.find(c => c._id === selectedCompanyId)
        if (!company) return null
        return (
            <CompanyDetailView
                company={company}
                onBack={() => setSelectedCompanyId(null)}
                completedQuestions={completedQuestions}
                onToggleComplete={onToggleComplete}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
            />
        )
    }

    return (
        <CompanyListView
            companies={companies}
            onCompanySelect={setSelectedCompanyId}
            completedQuestions={completedQuestions}
        />
    )
}

// ═══════════════════════════════════════════════════════════
// COMPANY LIST VIEW
// ═══════════════════════════════════════════════════════════

function CompanyListView({ companies, onCompanySelect }: {
    companies: ApiCompany[]
    onCompanySelect: (id: string) => void
    completedQuestions: Set<string>
}) {
    const [search, setSearch] = useState("")

    const filtered = useMemo(() => {
        if (!search) return companies
        return companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    }, [search, companies])

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Company-Wise Questions</h2>
                <p className="text-slate-400 text-sm">Practice questions most frequently asked at top companies</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="Search company..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-violet-500"
                />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(company => (
                    <button
                        key={company._id}
                        onClick={() => onCompanySelect(company._id)}
                        className="group relative bg-slate-900/80 border border-white/5 rounded-2xl p-5 hover:border-violet-500/30 hover:bg-slate-800/50 transition-all text-left"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <CompanyLogo logo={company.logo} color={company.color} size={48}
                                className="group-hover:scale-105 transition-transform" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate group-hover:text-violet-300 transition-colors">{company.name}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{company.totalQuestions} questions</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all mt-1" />
                        </div>

                        <div className="flex gap-2 mb-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{company.difficulty.easy} Easy</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{company.difficulty.medium} Med</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{company.difficulty.hard} Hard</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full bg-gradient-to-r ${company.color} transition-all`} style={{ width: "0%" }} />
                            </div>
                            <span className="text-xs text-slate-500 flex-shrink-0">0%</span>
                        </div>
                    </button>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">No companies found</p>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════
// COMPANY DETAIL VIEW — Charts + Question Table
// ═══════════════════════════════════════════════════════════

function CompanyDetailView({ company, onBack, completedQuestions, onToggleComplete, favorites, onToggleFavorite }: {
    company: ApiCompany
    onBack: () => void
    completedQuestions: Set<string>
    onToggleComplete: (qid: string) => void
    favorites: Set<string>
    onToggleFavorite: (qid: string) => void
}) {
    const [questions, setQuestions] = useState<ApiQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [diffFilter, setDiffFilter] = useState<string>("All")
    const [platFilter, setPlatFilter] = useState<string>("All")
    const [topicFilter, setTopicFilter] = useState<string>("All")
    const [popFilter, setPopFilter] = useState<string>("All")
    const [showFavOnly, setShowFavOnly] = useState(false)

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`/api/companies/${company._id}/questions`)
                const data = await res.json()
                if (res.ok) setQuestions(data.questions)
            } catch (e) { console.error(e) }
            setLoading(false)
        }
        fetchQuestions()
    }, [company._id])

    const allTags = useMemo(() => {
        const tags = new Set<string>()
        questions.forEach(q => q.tags.forEach(t => tags.add(t)))
        return Array.from(tags).sort()
    }, [questions])

    const allPlatforms = useMemo(() => {
        return Array.from(new Set(questions.map(q => q.platform)))
    }, [questions])

    const filtered = useMemo(() => {
        return questions.filter(q => {
            if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
            if (diffFilter !== "All" && q.difficulty !== diffFilter) return false
            if (platFilter !== "All" && q.platform !== platFilter) return false
            if (topicFilter !== "All" && !q.tags.includes(topicFilter)) return false
            if (popFilter !== "All" && q.popularity !== popFilter) return false
            if (showFavOnly && !favorites.has(q._id)) return false
            return true
        })
    }, [search, diffFilter, platFilter, topicFilter, popFilter, showFavOnly, questions, favorites])

    const doneCount = questions.filter(q => completedQuestions.has(q._id)).length
    const pct = questions.length > 0 ? Math.round((doneCount / questions.length) * 100) : 0

    const diffColors = [
        { key: "Easy", count: company.difficulty.easy, bg: "bg-green-500" },
        { key: "Medium", count: company.difficulty.medium, bg: "bg-yellow-500" },
        { key: "Hard", count: company.difficulty.hard, bg: "bg-red-500" },
    ]

    const totalQ = company.totalQuestions || 1
    const maxPattern = Math.max(...(company.patterns || []).map(p => p.count), 1)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <CompanyLogo logo={company.logo} color={company.color} size={48} />
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white">{company.name}</h2>
                    <p className="text-slate-400 text-sm">{questions.length} questions · {doneCount} completed ({pct}%)</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Interview Pattern Distribution */}
                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                        <BarChart2 className="w-4 h-4 text-violet-400" />
                        Interview Pattern Distribution
                    </h3>
                    <div className="space-y-3">
                        {(company.patterns || []).map(p => (
                            <div key={p.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-slate-300 text-xs">{p.name}</span>
                                    <span className="text-slate-500 text-xs">{p.count}</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700"
                                        style={{ width: `${(p.count / maxPattern) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {(!company.patterns || company.patterns.length === 0) && (
                            <p className="text-slate-500 text-xs">No patterns data yet</p>
                        )}
                    </div>
                </div>

                {/* Difficulty Distribution (Donut) */}
                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                        <PieChart className="w-4 h-4 text-violet-400" />
                        Difficulty-Wise Distribution
                    </h3>
                    <div className="flex items-center gap-6">
                        <div className="relative w-28 h-28 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#22c55e"
                                    strokeWidth="3" strokeDasharray={`${(company.difficulty.easy / totalQ) * 100} ${100 - (company.difficulty.easy / totalQ) * 100}`}
                                    strokeDashoffset="0" strokeLinecap="round" />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eab308"
                                    strokeWidth="3" strokeDasharray={`${(company.difficulty.medium / totalQ) * 100} ${100 - (company.difficulty.medium / totalQ) * 100}`}
                                    strokeDashoffset={`-${(company.difficulty.easy / totalQ) * 100}`} strokeLinecap="round" />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444"
                                    strokeWidth="3" strokeDasharray={`${(company.difficulty.hard / totalQ) * 100} ${100 - (company.difficulty.hard / totalQ) * 100}`}
                                    strokeDashoffset={`-${((company.difficulty.easy + company.difficulty.medium) / totalQ) * 100}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg leading-none">{totalQ}</p>
                                    <p className="text-slate-500 text-[10px]">Total</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            {diffColors.map(d => (
                                <div key={d.key} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${d.bg}`} />
                                    <span className="text-slate-300 text-sm flex-1">{d.key}</span>
                                    <span className="text-white text-sm font-semibold">{d.count}</span>
                                    <span className="text-slate-500 text-xs w-10 text-right">{Math.round((d.count / totalQ) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search question..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-slate-600 focus-visible:ring-violet-500"
                        />
                    </div>
                    <FilterDropdown label="Difficulty" value={diffFilter} options={["All", "Easy", "Medium", "Hard"]} onChange={setDiffFilter}
                        colorMap={{ Easy: "text-green-400", Medium: "text-yellow-400", Hard: "text-red-400" }} />
                    <FilterDropdown label="Platforms" value={platFilter} options={["All", ...allPlatforms]} onChange={setPlatFilter} />
                    <FilterDropdown label="Topics" value={topicFilter} options={["All", ...allTags]} onChange={setTopicFilter} />
                    <FilterDropdown label="Popularity" value={popFilter} options={["All", "Very Hot", "Hot", "Warm"]} onChange={setPopFilter}
                        colorMap={{ "Very Hot": "text-red-400", "Hot": "text-orange-400", "Warm": "text-yellow-400" }} />
                    <button
                        onClick={() => setShowFavOnly(!showFavOnly)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${showFavOnly ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                    >
                        <Star className={`w-3 h-3 ${showFavOnly ? "fill-yellow-400" : ""}`} />
                        Favourites
                    </button>
                </div>
            </div>

            {/* Question Table */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_50px_80px_90px_1fr_90px] gap-2 px-5 py-3 border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-900/60 hidden md:grid">
                    <div></div>
                    <div>Question</div>
                    <div className="text-center">Platform</div>
                    <div className="text-center">Difficulty</div>
                    <div className="text-center">Popularity</div>
                    <div>Tags</div>
                    <div className="text-center">Actions</div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-sm">No questions match your filters</p>
                    </div>
                ) : (
                    filtered.map(q => {
                        const isDone = completedQuestions.has(q._id)
                        const isFav = favorites.has(q._id)
                        const diff = DIFF_COLOR[q.difficulty] || DIFF_COLOR.Medium
                        const pop = POP_COLOR[q.popularity] || POP_COLOR.Hot

                        return (
                            <div
                                key={q._id}
                                className={`grid grid-cols-1 md:grid-cols-[40px_1fr_50px_80px_90px_1fr_90px] gap-2 md:gap-2 px-5 py-3.5 items-center border-b border-white/5 last:border-0 transition-colors ${isDone ? "bg-green-500/5" : "hover:bg-white/3"}`}
                            >
                                <button onClick={() => onToggleComplete(q._id)} className="flex-shrink-0">
                                    {isDone ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />}
                                </button>

                                {/* Question title — clickable link if link exists */}
                                <div className={`text-sm font-medium ${isDone ? "text-slate-500 line-through" : "text-white"}`}>
                                    {q.link ? (
                                        <a href={q.link} target="_blank" rel="noopener noreferrer"
                                            className="hover:text-violet-400 transition-colors inline-flex items-center gap-1.5 group/link">
                                            {q.title}
                                            <ExternalLink className="w-3 h-3 text-violet-400/50 group-hover/link:text-violet-400 transition-colors" />
                                        </a>
                                    ) : q.title}
                                </div>

                                {/* Platform icon */}
                                <div className="text-center hidden md:flex justify-center">
                                    <PlatformIcon platform={q.platform} size={18} />
                                </div>

                                <div className="text-center hidden md:flex justify-center">
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${diff.bg} ${diff.text} ${diff.border} border`}>{q.difficulty}</span>
                                </div>
                                <div className="text-center hidden md:flex justify-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${pop.bg} ${pop.text}`}>{q.popularity}</span>
                                </div>
                                <div className="flex-wrap gap-1 hidden md:flex">
                                    {q.tags.map(tag => (
                                        <span key={tag} className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{tag}</span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center gap-2 hidden md:flex">
                                    <button onClick={() => onToggleFavorite(q._id)} title="Favourite" className="text-slate-600 hover:text-yellow-400 transition-colors">
                                        {isFav ? <Bookmark className="w-4 h-4 text-yellow-400 fill-yellow-400" /> : <BookmarkPlus className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Mobile extra info */}
                                <div className="flex flex-wrap items-center gap-2 md:hidden col-span-1 mt-1">
                                    <PlatformIcon platform={q.platform} size={16} />
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.text} ${diff.border} border`}>{q.difficulty}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pop.bg} ${pop.text}`}>{q.popularity}</span>
                                    {q.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                    <button onClick={() => onToggleFavorite(q._id)} className="ml-auto">
                                        {isFav ? <Bookmark className="w-4 h-4 text-yellow-400 fill-yellow-400" /> : <BookmarkPlus className="w-4 h-4 text-slate-600" />}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}

                <div className="px-5 py-3 bg-slate-900/60 border-t border-white/5 flex items-center justify-between">
                    <p className="text-slate-500 text-xs">Showing {filtered.length} of {questions.length} questions</p>
                    <p className="text-slate-500 text-xs">{doneCount}/{questions.length} completed</p>
                </div>
            </div>
        </div>
    )
}

// ─── Filter Dropdown ─────────────────────────────────────

function FilterDropdown({ label, value, options, onChange, colorMap }: {
    label: string; value: string; options: string[]
    onChange: (v: string) => void
    colorMap?: Record<string, string>
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
          ${value !== "All"
                        ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
            >
                {label}{value !== "All" ? `: ${value}` : ""}
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-1 min-w-[140px] max-h-[250px] overflow-y-auto">
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setOpen(false) }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${value === opt ? "text-violet-400 font-semibold" : colorMap?.[opt] || "text-slate-300"}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
