// app/learn/[kitSlug]/layout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronDown, ChevronRight, Menu, X, ArrowLeft,
    FileText, Loader2, Lock, Sparkles, ShoppingCart
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

// ─── Helpers ─────────────────────────────────────────────

function getCheckoutPathForKit(kitSlug: string): string {
    const slug = kitSlug.toLowerCase();
    if (slug.includes('complete')) return '/checkout/complete';
    if (slug.includes('react')) return '/checkout/react';
    if (slug.includes('javascript') || slug.includes('js')) return '/checkout/javascript';
    if (slug.includes('placement')) return '/checkout/placement';
    return '/#products';
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
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [isPreview, setIsPreview] = useState(false);
    const [firstChapterId, setFirstChapterId] = useState<string | null>(null);

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
                return r.json();
            })
            .then(d => {
                if (!d) return;
                if (d.kit) setKit(d.kit);
                if (d.isPreview !== undefined) setIsPreview(d.isPreview);
                if (d.firstChapterId !== undefined) setFirstChapterId(d.firstChapterId?.toString() ?? null);
                if (d.sidebar) {
                    setSidebar(d.sidebar);
                    // Only expand the first chapter by default
                    const firstChapter = d.sidebar[0];
                    if (firstChapter) {
                        // If already on a topic, expand the chapter that contains it
                        const currentSlug = pathname.split('/').pop();
                        const activeChapter = d.sidebar.find((ch: SidebarChapter) =>
                            ch.topics.some((t: { slug: string }) => t.slug === currentSlug)
                        );
                        const chapterToExpand = activeChapter || firstChapter;
                        setExpandedChapters(new Set([chapterToExpand._id]));

                        // If we're on the kit root (no topic selected), redirect to first topic
                        const pathParts = pathname.split('/').filter(Boolean);
                        const isKitRoot = pathParts.length === 2; // e.g. /learn/react-interview-kit
                        if (isKitRoot && firstChapter.topics?.length > 0) {
                            router.replace(`/learn/${kitSlug}/${firstChapter.topics[0].slug}`);
                        }
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [kitSlug, authChecked, router]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Keep only the chapter containing the active topic open when navigation
    // happens outside the sidebar, such as the bottom Previous / Next controls.
    useEffect(() => {
        if (sidebar.length === 0) return;

        const currentSlug = pathname.split('/').pop();
        const activeChapter = sidebar.find((ch) =>
            ch.topics.some((topic) => topic.slug === currentSlug)
        );

        if (!activeChapter) return;

        setExpandedChapters(new Set([activeChapter._id]));
    }, [pathname, sidebar]);

    const toggleChapter = useCallback((id: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // In preview mode, allTopics only contains chapter-1 topics so Prev/Next stays within chapter 1
    const allTopics = sidebar.flatMap((ch, idx) => {
        if (isPreview && idx > 0) return []; // skip locked chapters from nav
        return ch.topics.map(t => ({
            slug: t.slug,
            title: t.title,
            chapterTitle: ch.title,
        }));
    });

    const currentTopicSlug = pathname.split('/').pop();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
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

    const checkoutPath = getCheckoutPathForKit(kitSlug);

    // ── Sidebar Chapter Item ─────────────────────────────────
    const renderSidebarChapter = (ch: SidebarChapter, ci: number, isMobile: boolean) => {
        const isFirstChapter = ch._id?.toString() === firstChapterId || ci === 0;
        const isLocked = isPreview && !isFirstChapter;
        const isExpanded = expandedChapters.has(ch._id);

        return (
            <div key={ch._id}>
                <button
                    onClick={() => !isLocked && toggleChapter(ch._id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors group ${
                        isLocked
                            ? 'cursor-default opacity-50'
                            : 'hover:bg-white/5'
                    }`}
                >
                    {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    ) : isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                        {String(ci + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-sm font-medium truncate transition-colors ${
                        isLocked
                            ? 'text-slate-600'
                            : 'text-slate-300 group-hover:text-white'
                    }`}>
                        {ch.title}
                    </span>
                    {isLocked && (
                        <span className="ml-auto flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium">
                            PRO
                        </span>
                    )}
                </button>

                {!isLocked && isExpanded && ch.topics.length > 0 && (
                    <div className={`ml-5 pl-3 border-l border-white/5 space-y-0.5 mb-1`}>
                        {ch.topics.map(t => {
                            const isActive = currentTopicSlug === t.slug;
                            return (
                                <Link
                                    key={t._id}
                                    href={`/learn/${kitSlug}/${t.slug}`}
                                    className={`block px-3 py-1.5 rounded-md text-sm transition-all ${
                                        isActive
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

                {/* Locked chapter — show a preview of topic titles but non-clickable */}
                {isLocked && ch.topics.length > 0 && (
                    <div className="ml-5 pl-3 border-l border-white/[0.03] space-y-0.5 mb-1">
                        {ch.topics.slice(0, 3).map(t => (
                            <div
                                key={t._id}
                                className="block px-3 py-1.5 rounded-md text-sm text-slate-700 select-none cursor-not-allowed"
                            >
                                {t.title}
                            </div>
                        ))}
                        {ch.topics.length > 3 && (
                            <div className="px-3 py-1 text-xs text-slate-700">
                                +{ch.topics.length - 3} more topics...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <SidebarContext.Provider value={{ kit, sidebar, allTopics, isPreview, firstChapterId }}>
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

                    {/* Preview mode banner */}
                    {isPreview && (
                        <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <p className="text-amber-300 text-xs font-semibold">Preview Mode</p>
                            </div>
                            <p className="text-slate-500 text-[11px] mb-2.5 leading-relaxed">
                                Chapter 1 is unlocked. Purchase to access all chapters.
                            </p>
                            <Link
                                href={checkoutPath}
                                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-md shadow-amber-500/20"
                            >
                                <ShoppingCart className="w-3 h-3" />
                                Unlock Full Kit
                            </Link>
                        </div>
                    )}

                    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/5">
                        {sidebar.map((ch, ci) => renderSidebarChapter(ch, ci, false))}

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
                            <span className="text-white font-semibold text-sm truncate max-w-[160px]">{kit.name}</span>
                        </div>
                        {isPreview && (
                            <Link
                                href={checkoutPath}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md"
                            >
                                <Lock className="w-3 h-3" />
                                Unlock
                            </Link>
                        )}
                    </div>
                </div>

                {/* ─── Mobile Sidebar Overlay ─── */}
                {mobileOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
                        <aside className="fixed top-0 left-0 bottom-0 w-72 bg-[#0d0d14] border-r border-white/5 z-50 lg:hidden overflow-y-auto flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <span className="text-white font-semibold text-sm">{kit.name}</span>
                                <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-white/5">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Preview banner in mobile sidebar */}
                            {isPreview && (
                                <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                        <p className="text-amber-300 text-xs font-semibold">Preview Mode — Chapter 1 only</p>
                                    </div>
                                    <Link
                                        href={checkoutPath}
                                        className="flex items-center justify-center gap-1.5 w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold"
                                    >
                                        <ShoppingCart className="w-3 h-3" />
                                        Unlock Full Kit
                                    </Link>
                                </div>
                            )}

                            <nav className="flex-1 py-3 px-2 space-y-0.5">
                                {sidebar.map((ch, ci) => renderSidebarChapter(ch, ci, true))}
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
