// app/learn/[kitSlug]/layout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronDown, ChevronRight, Menu, X, ArrowLeft,
    FileText, Loader2, Lock
} from 'lucide-react';
import { SidebarContext } from './sidebar-context';
import type { SidebarChapter } from './sidebar-context';

// ─── Types ───────────────────────────────────────────────

interface KitInfo {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description: string;
}

// ─── Layout ──────────────────────────────────────────────

export default function KitLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const kitSlug = params.kitSlug as string;

    const [kit, setKit] = useState<KitInfo | null>(null);
    const [sidebar, setSidebar] = useState<SidebarChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

    // Auth guard — check session first
    useEffect(() => {
        fetch('/api/auth/session')
            .then(r => r.json())
            .then(d => {
                if (!d.user) {
                    router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
                } else {
                    setAuthChecked(true);
                }
            })
            .catch(() => router.replace('/login'));
    }, [pathname, router]);

    // Load kit data (only after auth check passes)
    useEffect(() => {
        if (!authChecked) return;
        fetch(`/api/learn/kits/${kitSlug}`)
            .then(r => {
                if (r.status === 401) { router.replace('/login'); return null; }
                if (r.status === 403) { setAccessDenied(true); setLoading(false); return null; }
                return r.json();
            })
            .then(d => {
                if (!d) return;
                if (d.kit) setKit(d.kit);
                if (d.sidebar) {
                    setSidebar(d.sidebar);
                    setExpandedChapters(new Set(d.sidebar.map((ch: SidebarChapter) => ch._id)));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [kitSlug, authChecked, router]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const toggleChapter = useCallback((id: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const allTopics = sidebar.flatMap(ch =>
        ch.topics.map(t => ({
            slug: t.slug,
            title: t.title,
            chapterTitle: ch.title,
        }))
    );

    const currentTopicSlug = pathname.split('/').pop();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                    <h2 className="text-white text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-slate-400 mb-6">
                        You don&apos;t have access to this kit. Purchase it to start learning.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard?tab=kits" className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors text-sm">
                            View Available Kits
                        </Link>
                        <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors text-sm">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!kit) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 text-lg mb-4">Kit not found</p>
                    <Link href="/dashboard?tab=kits" className="text-violet-400 hover:text-violet-300 text-sm underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <SidebarContext.Provider value={{ kit, sidebar, allTopics }}>
            <div className="min-h-screen bg-[#0a0a0f] flex">
                {/* ─── Sidebar (desktop) ─── */}
                <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 bg-[#0d0d14] fixed top-0 left-0 bottom-0 z-30">
                    <Link href="/dashboard?tab=kits" className="flex items-center gap-3 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors group">
                        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kit.color} flex items-center justify-center text-base flex-shrink-0`}>
                            {kit.icon}
                        </div>
                        <span className="text-white font-semibold text-sm truncate">{kit.name}</span>
                    </Link>

                    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/5">
                        {sidebar.map((ch, ci) => (
                            <div key={ch._id}>
                                <button
                                    onClick={() => toggleChapter(ch._id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
                                >
                                    {expandedChapters.has(ch._id)
                                        ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                                        {String(ci + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-slate-300 text-sm font-medium truncate group-hover:text-white transition-colors">
                                        {ch.title}
                                    </span>
                                </button>

                                {expandedChapters.has(ch._id) && ch.topics.length > 0 && (
                                    <div className="ml-5 pl-3 border-l border-white/5 space-y-0.5 mb-1">
                                        {ch.topics.map(t => {
                                            const isActive = currentTopicSlug === t.slug;
                                            return (
                                                <Link
                                                    key={t._id}
                                                    href={`/learn/${kitSlug}/${t.slug}`}
                                                    className={`block px-3 py-1.5 rounded-md text-sm transition-all ${isActive
                                                        ? 'bg-violet-500/15 text-violet-300 font-medium border-l-2 border-violet-400 -ml-[1px]'
                                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/3'
                                                        }`}
                                                >
                                                    {t.title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {sidebar.length === 0 && (
                            <div className="text-center py-8 text-slate-600 text-xs">
                                <FileText className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                No chapters yet
                            </div>
                        )}
                    </nav>
                </aside>

                {/* ─── Mobile Top Bar ─── */}
                <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d0d14]/95 backdrop-blur border-b border-white/5">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5">
                                <Menu className="w-5 h-5 text-slate-400" />
                            </button>
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${kit.color} flex items-center justify-center text-sm`}>
                                {kit.icon}
                            </div>
                            <span className="text-white font-semibold text-sm truncate max-w-[200px]">{kit.name}</span>
                        </div>
                    </div>
                </div>

                {/* ─── Mobile Sidebar Overlay ─── */}
                {mobileOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
                        <aside className="fixed top-0 left-0 bottom-0 w-72 bg-[#0d0d14] border-r border-white/5 z-50 lg:hidden overflow-y-auto">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <span className="text-white font-semibold text-sm">{kit.name}</span>
                                <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-white/5">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <nav className="py-3 px-2 space-y-0.5">
                                {sidebar.map((ch, ci) => (
                                    <div key={ch._id}>
                                        <button
                                            onClick={() => toggleChapter(ch._id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                                        >
                                            {expandedChapters.has(ch._id)
                                                ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                                : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                {String(ci + 1).padStart(2, '0')}
                                            </span>
                                            <span className="text-slate-300 text-sm font-medium truncate">{ch.title}</span>
                                        </button>

                                        {expandedChapters.has(ch._id) && ch.topics.length > 0 && (
                                            <div className="ml-5 pl-3 border-l border-white/5 space-y-0.5 mb-1">
                                                {ch.topics.map(t => {
                                                    const isActive = currentTopicSlug === t.slug;
                                                    return (
                                                        <Link
                                                            key={t._id}
                                                            href={`/learn/${kitSlug}/${t.slug}`}
                                                            className={`block px-3 py-1.5 rounded-md text-sm transition-all ${isActive
                                                                ? 'bg-violet-500/15 text-violet-300 font-medium'
                                                                : 'text-slate-500 hover:text-slate-300'
                                                                }`}
                                                        >
                                                            {t.title}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </aside>
                    </>
                )}

                {/* ─── Main Content ─── */}
                <main className="flex-1 lg:ml-72 pt-14 lg:pt-0 min-h-screen max-w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </SidebarContext.Provider>
    );
}
