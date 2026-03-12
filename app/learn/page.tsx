// app/learn/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { BookOpen, Loader2, ChevronRight, FileText, Layers, Lock } from 'lucide-react';

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

    // Show only owned kits
    const ownedKits = kits.filter(k => k.hasAccess);

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            <SiteHeader />
            <div className="max-w-5xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
                        <BookOpen className="w-4 h-4" /> My Learning
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Learning Path</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Deep-dive into your purchased kits with structured, chapter-by-chapter content.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    </div>
                ) : ownedKits.length === 0 ? (
                    <div className="text-center py-24">
                        <Lock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 text-lg mb-2">No kits purchased yet</p>
                        <p className="text-slate-600 text-sm mt-1 mb-6">Purchase a kit to start learning</p>
                        <Link href="/dashboard?tab=kits" className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors text-sm">
                            Browse Kits
                        </Link>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {ownedKits.map(kit => (
                            <Link
                                key={kit._id}
                                href={`/learn/${kit.slug}`}
                                className="group relative bg-slate-900/80 border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 hover:bg-slate-800/50 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${kit.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {kit.icon}
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-violet-300 transition-colors">{kit.name}</h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{kit.description || 'Explore chapters and topics'}</p>

                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {kit.chaptersCount} chapters</span>
                                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {kit.topicsCount} topics</span>
                                </div>

                                <ChevronRight className="absolute top-6 right-5 w-5 h-5 text-slate-700 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
