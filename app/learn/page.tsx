// app/learn/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import {
    BookOpen, Loader2, ChevronRight, FileText, Layers,
    Lock, Eye, CheckCircle2, Sparkles, ShoppingCart
} from 'lucide-react';

interface Kit {
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

function getCheckoutPathForKit(kit: Kit): string {
    const label = `${kit.name} ${kit.slug}`.toLowerCase();
    if (label.includes('complete')) return '/checkout/complete';
    if (label.includes('react')) return '/checkout/react';
    if (label.includes('javascript') || label.includes('js')) return '/checkout/javascript';
    // Placement SKU retired — existing buyers keep access; others go to /pricing.
    if (label.includes('placement')) return '/#pricing';
    return '/#products';
}

export default function LearnPage() {
    const router = useRouter();
    const [kits, setKits] = useState<Kit[]>([]);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    // Auth guard
    useEffect(() => {
        fetch('/api/auth/session')
            .then(r => r.json())
            .then(d => {
                if (!d.user) {
                    router.replace('/login?redirect=/learn');
                } else {
                    setAuthenticated(true);
                }
            })
            .catch(() => router.replace('/login'));
    }, [router]);

    // Load kits (only after auth)
    useEffect(() => {
        if (!authenticated) return;
        fetch('/api/learn/kits')
            .then(r => r.json())
            .then(d => { if (d.kits) setKits(d.kits); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [authenticated]);

    const ownedKits = kits.filter(k => k.hasAccess);
    const previewKits = kits.filter(k => !k.hasAccess);

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-reader-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-reader-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-reader-bg">
            <SiteHeader />
            <div className="max-w-5xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-reader-accent text-sm font-medium mb-4">
                        <BookOpen className="w-4 h-4" /> My Learning
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-reader-heading mb-3">
                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500">Learning Path</span>
                    </h1>
                    <p className="text-reader-muted text-lg max-w-2xl mx-auto">
                        Dive into your purchased kits or preview the first chapter of any kit for free.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-reader-accent" />
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* ── Owned Kits ── */}
                        {ownedKits.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-reader-success" />
                                    </div>
                                    <div>
                                        <h2 className="text-reader-heading font-bold text-lg">Purchased Kits</h2>
                                        <p className="text-reader-faint text-sm">Full access — all chapters unlocked</p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {ownedKits.map(kit => (
                                        <Link
                                            key={kit._id}
                                            href={`/learn/${kit.slug}`}
                                            className="group relative bg-reader-surface border border-reader-border rounded-2xl p-6 hover:border-reader-accent-soft-border hover:bg-reader-surface-hover transition-all"
                                        >
                                            {/* Top access bar */}
                                            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-green-400 via-violet-400 to-cyan-400" />

                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                                {kit.icon}
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-reader-success text-[10px] font-semibold">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Owned
                                                </span>
                                            </div>

                                            <h3 className="text-reader-heading font-semibold text-lg mb-1 group-hover:text-reader-accent-hover transition-colors">{kit.name}</h3>
                                            <p className="text-reader-muted text-sm mb-4 line-clamp-2">{kit.description || 'Explore chapters and topics'}</p>

                                            <div className="flex items-center gap-4 text-xs text-reader-faint">
                                                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {kit.chaptersCount} chapters</span>
                                                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {kit.topicsCount} topics</span>
                                            </div>

                                            <ChevronRight className="absolute top-6 right-5 w-5 h-5 text-reader-faint group-hover:text-reader-accent group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── No owned kits empty state ── */}
                        {ownedKits.length === 0 && (
                            <div className="text-center py-10 rounded-2xl border border-dashed border-reader-border bg-reader-surface-hover">
                                <Lock className="w-10 h-10 mx-auto mb-3 text-reader-faint" />
                                <p className="text-reader-muted text-lg mb-1">No purchased kits yet</p>
                                <p className="text-reader-faint text-sm mb-5">Preview a kit below or purchase one to unlock full access</p>
                                <Link href="/dashboard?tab=kits" className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors text-sm">
                                    Browse Kits
                                </Link>
                            </div>
                        )}

                        {/* ── Preview Available Kits ── */}
                        {previewKits.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                                        <Eye className="w-4 h-4 text-reader-amber" />
                                    </div>
                                    <div>
                                        <h2 className="text-reader-heading font-bold text-lg">Preview Available</h2>
                                        <p className="text-reader-faint text-sm">Chapter 1 is free — purchase for full access</p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {previewKits.map(kit => (
                                        <div
                                            key={kit._id}
                                            className="group relative bg-reader-surface border border-reader-border rounded-2xl p-6 hover:border-reader-amber-soft-border hover:bg-reader-surface-hover transition-all"
                                        >
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                                                {kit.icon}
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-reader-amber text-[10px] font-semibold">
                                                    <Sparkles className="w-2.5 h-2.5" /> Chapter 1 Free
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-reader-surface-hover border border-reader-border text-reader-faint text-[10px]">
                                                    <Lock className="w-2.5 h-2.5" /> Rest locked
                                                </span>
                                            </div>

                                            <h3 className="text-reader-heading font-semibold text-lg mb-1 group-hover:text-reader-amber transition-colors">{kit.name}</h3>
                                            <p className="text-reader-muted text-sm mb-4 line-clamp-2">{kit.description || 'Explore chapters and topics'}</p>

                                            <div className="flex items-center gap-4 text-xs text-reader-faint mb-5">
                                                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {kit.chaptersCount} chapters</span>
                                                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {kit.topicsCount} topics</span>
                                            </div>

                                            {/* Two action buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link
                                                    href={`/learn/${kit.slug}`}
                                                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-reader-surface-hover border border-reader-border text-reader-text hover:bg-reader-surface hover:text-reader-heading text-xs font-medium transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Preview
                                                </Link>
                                                <Link
                                                    href={getCheckoutPathForKit(kit)}
                                                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-500/20"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    Buy Now
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
