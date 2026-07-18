'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, X, Loader2, BookOpen } from 'lucide-react';

interface BookmarkItem {
    kitSlug: string;
    topicSlug: string;
    title: string;
    chapterTitle?: string;
    createdAt: string;
}

interface KitMeta {
    name: string;
    icon?: string;
    color?: string;
}

interface KitLike { slug: string; name: string; icon?: string; color?: string }

function toKitMap(kits: KitLike[]): Record<string, KitMeta> {
    const map: Record<string, KitMeta> = {};
    for (const k of kits) map[k.slug] = { name: k.name, icon: k.icon, color: k.color };
    return map;
}

// Shared data hook — fetches the user's bookmarks (+ kit metadata for group
// headers / icons, unless the caller already has kits and passes them in, so we
// don't refetch /api/learn/kits the Overview parent already loaded).
function useBookmarks(providedKits?: KitLike[]) {
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [fetchedKits, setFetchedKits] = useState<Record<string, KitMeta>>({});
    const [loading, setLoading] = useState(true);

    const haveKits = !!providedKits;

    useEffect(() => {
        let active = true;
        const requests: Promise<any>[] = [
            fetch('/api/user/bookmarks').then(r => (r.ok ? r.json() : { bookmarks: [] })),
        ];
        if (!haveKits) {
            requests.push(fetch('/api/learn/kits').then(r => (r.ok ? r.json() : { kits: [] })));
        }
        Promise.all(requests)
            .then(([bm, kd]) => {
                if (!active) return;
                setBookmarks(bm.bookmarks || []);
                if (kd) setFetchedKits(toKitMap(kd.kits || []));
            })
            .catch(() => { /* non-critical */ })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [haveKits]);

    const kits = haveKits ? toKitMap(providedKits!) : fetchedKits;

    const remove = useCallback((kitSlug: string, topicSlug: string) => {
        let removed: { item: BookmarkItem; index: number } | null = null;
        setBookmarks(prev => {
            const index = prev.findIndex(b => b.kitSlug === kitSlug && b.topicSlug === topicSlug);
            if (index === -1) return prev;
            removed = { item: prev[index], index };
            return prev.filter((_, i) => i !== index);
        });
        fetch('/api/user/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kitSlug, topicSlug, action: 'remove' }),
        })
            .then(r => { if (!r.ok) throw new Error('remove failed'); })
            .catch(() => {
                // Revert: re-insert the bookmark at its original position.
                if (!removed) return;
                setBookmarks(prev => {
                    const next = [...prev];
                    next.splice(removed!.index, 0, removed!.item);
                    return next;
                });
            });
    }, []);

    return { bookmarks, kits, loading, remove };
}

function SectionHeader() {
    return (
        <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/10 flex items-center justify-center">
                <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
                <h3 className="text-foreground font-semibold text-base">Bookmarks</h3>
                <p className="text-muted-foreground text-xs">Topics you saved to revisit</p>
            </div>
        </div>
    );
}

function BookmarkCard({ b, kit, onRemove }: { b: BookmarkItem; kit?: KitMeta; onRemove: () => void }) {
    return (
        <div className="group relative overflow-hidden bg-card border border-hairline rounded-2xl p-4 hover:border-amber-500/25 transition-all duration-300">
            <button
                onClick={onRemove}
                title="Remove bookmark"
                aria-label="Remove bookmark"
                className="absolute top-3 right-3 z-10 p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-overlay transition-all"
            >
                <X className="w-3.5 h-3.5" />
            </button>
            <Link href={`/learn/${b.kitSlug}/${b.topicSlug}`} className="block">
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kit?.color || 'from-violet-500 to-purple-600'} flex items-center justify-center text-base flex-shrink-0`}>
                        {kit?.icon || '📘'}
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                        <p className="text-foreground text-sm font-semibold line-clamp-2">{b.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5 truncate">
                            {kit?.name || b.kitSlug}{b.chapterTitle ? ` · ${b.chapterTitle}` : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400/80 text-xs font-medium mt-3">
                    Open topic
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
            </Link>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-card border border-hairline rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-overlay border border-hairline flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">No bookmarks yet</p>
            <p className="text-muted-foreground text-sm">
                Open a topic in the reader and tap the <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Bookmark className="w-3.5 h-3.5" /> Bookmark</span> button to save it here.
            </p>
        </div>
    );
}

/** Full dashboard tab — bookmarks grouped by kit. */
export function BookmarksTab() {
    const { bookmarks, kits, loading, remove } = useBookmarks();

    if (loading) {
        return (
            <div className="space-y-8 max-w-5xl">
                <SectionHeader />
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                </div>
            </div>
        );
    }

    // Group by kit, preserving newest-first order within each group.
    const groups: { kitSlug: string; items: BookmarkItem[] }[] = [];
    for (const b of bookmarks) {
        let g = groups.find(x => x.kitSlug === b.kitSlug);
        if (!g) { g = { kitSlug: b.kitSlug, items: [] }; groups.push(g); }
        g.items.push(b);
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <SectionHeader />
            {bookmarks.length === 0 ? (
                <EmptyState />
            ) : (
                groups.map(group => (
                    <div key={group.kitSlug} className="space-y-3">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            {kits[group.kitSlug]?.name || group.kitSlug}
                            <span className="ml-2 text-muted-foreground/60">{group.items.length}</span>
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {group.items.map(b => (
                                <BookmarkCard
                                    key={`${b.kitSlug}/${b.topicSlug}`}
                                    b={b}
                                    kit={kits[b.kitSlug]}
                                    onRemove={() => remove(b.kitSlug, b.topicSlug)}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

/** Compact Overview preview — up to 3 bookmarks + a link to the full tab.
 *  `kits` is passed by the Overview parent (which already fetched them) so we
 *  don't refetch /api/learn/kits. */
export function BookmarksPreview({ kits: providedKits }: { kits?: KitLike[] }) {
    const { bookmarks, kits, loading, remove } = useBookmarks(providedKits);

    if (loading || bookmarks.length === 0) return null;

    const shown = bookmarks.slice(0, 3);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <SectionHeader />
                <Link
                    href="/dashboard?tab=bookmarks"
                    className="flex-shrink-0 flex items-center gap-1 text-violet-700 dark:text-violet-400 text-xs font-medium hover:underline"
                >
                    View all ({bookmarks.length})
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shown.map(b => (
                    <BookmarkCard
                        key={`${b.kitSlug}/${b.topicSlug}`}
                        b={b}
                        kit={kits[b.kitSlug]}
                        onRemove={() => remove(b.kitSlug, b.topicSlug)}
                    />
                ))}
            </div>
        </div>
    );
}
