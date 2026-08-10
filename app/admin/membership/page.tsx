'use client';

/**
 * Admin — Membership.
 *
 * Answers "how many people opted for the membership", and refuses to answer it
 * with one number, because there isn't one:
 *
 *   • MEMBERS NOW      — people whose membership is live today. The number that
 *                        matters for support and for what we owe people.
 *   • EVER SUBSCRIBED  — distinct people who have ever bought one. The number
 *                        that matters for reach.
 *   • SOLD             — purchases, renewals included. Always ≥ people, and the
 *                        one that reconciles against Razorpay.
 *
 * Reporting "sold" as if it were people would overstate the audience by every
 * renewal — a single member on a monthly plan for a year is 12 purchases and one
 * person. The API returns all three; this page labels each so nobody has to
 * guess which they are looking at.
 *
 * Admin is single-theme per CLAUDE.md, so this uses the global semantic tokens.
 */

import { useCallback, useEffect, useState } from 'react';
import {
    Loader2,
    Crown,
    Users,
    IndianRupee,
    RefreshCw,
    Clock,
    TrendingUp,
    AlertTriangle,
} from 'lucide-react';

interface Summary {
    peopleEverSubscribed: number;
    activeNow: number;
    lapsed: number;
    totalPurchases: number;
    renewals: number;
    revenue: number;
    averageOrderValue: number;
    retentionPercent: number;
}

interface PlanRow {
    id: string;
    label: string;
    price: number;
    months: number;
    count: number;
    revenue: number;
}

interface ExpiringRow {
    name: string;
    email: string;
    planId: string | null;
    expiresAt: string;
    daysLeft: number;
}

interface RecentRow {
    email: string;
    planId: string;
    planName: string;
    months: number;
    amount: number;
    expiresAt: string;
    isRenewal: boolean;
    createdAt: string;
}

interface Payload {
    summary: Summary;
    plans: PlanRow[];
    expiringSoon: ExpiringRow[];
    recent: RecentRow[];
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const dateOf = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminMembershipPage() {
    const [data, setData] = useState<Payload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/membership');
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
            setData(await res.json());
        } catch (e: any) {
            setError(e.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading membership data…
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-md rounded-lg border border-red-500/30 bg-red-500/5 p-5 text-center">
                <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-red-500" />
                <p className="mb-4 text-sm text-foreground">{error}</p>
                <button
                    onClick={load}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                    Retry
                </button>
            </div>
        );
    }

    const s = data!.summary;
    const nobodyYet = s.totalPurchases === 0;

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                        <Crown className="h-5 w-5 text-amber-500" />
                        Membership
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Who opted in, what they chose, and what it earned.
                    </p>
                </div>
                <button
                    onClick={load}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </header>

            {/* An empty state, not a wall of zeros — zeros read as "broken". */}
            {nobodyYet ? (
                <div className="rounded-xl border bg-muted/30 px-6 py-14 text-center">
                    <Crown className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-semibold text-foreground">No memberships sold yet</p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        This page fills in from the first purchase. Every row comes from a captured
                        Razorpay payment, so nothing appears here until money actually moves.
                    </p>
                </div>
            ) : (
                <>
                    {/* ── The three headline counts ───────────────────────── */}
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            icon={<Crown className="h-4 w-4" />}
                            label="Members now"
                            value={s.activeNow.toLocaleString('en-IN')}
                            hint="Active today"
                            tone="text-emerald-600 dark:text-emerald-400"
                        />
                        <Stat
                            icon={<Users className="h-4 w-4" />}
                            label="Ever subscribed"
                            value={s.peopleEverSubscribed.toLocaleString('en-IN')}
                            hint="Distinct people — renewals not double-counted"
                        />
                        <Stat
                            icon={<TrendingUp className="h-4 w-4" />}
                            label="Memberships sold"
                            value={s.totalPurchases.toLocaleString('en-IN')}
                            hint={`${s.renewals.toLocaleString('en-IN')} were renewals`}
                        />
                        <Stat
                            icon={<IndianRupee className="h-4 w-4" />}
                            label="Revenue"
                            value={inr(s.revenue)}
                            hint={`${inr(s.averageOrderValue)} average`}
                            tone="text-violet-600 dark:text-violet-400"
                        />
                    </section>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <Stat
                            label="Still subscribed"
                            value={`${s.retentionPercent}%`}
                            hint="Of everyone who ever joined"
                        />
                        <Stat
                            label="Lapsed"
                            value={s.lapsed.toLocaleString('en-IN')}
                            hint="Expired, not renewed — the win-back list"
                            tone={s.lapsed > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
                        />
                        <Stat
                            label="Renewals"
                            value={s.renewals.toLocaleString('en-IN')}
                            hint="Extended a term that was still running"
                        />
                    </section>

                    {/* ── Plan mix ────────────────────────────────────────── */}
                    <section className="overflow-hidden rounded-xl border">
                        <div className="border-b bg-muted/40 px-5 py-3">
                            <h2 className="text-sm font-semibold text-foreground">Plan mix</h2>
                            <p className="text-xs text-muted-foreground">
                                Which term people actually pick — the only real read on whether the
                                price ladder works.
                            </p>
                        </div>
                        <div className="divide-y">
                            {data!.plans.map((p) => {
                                const share = s.totalPurchases
                                    ? Math.round((p.count / s.totalPurchases) * 100)
                                    : 0;
                                return (
                                    <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {p.label}
                                                {p.price > 0 && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {inr(p.price)}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-violet-500"
                                                    style={{ width: `${share}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-20 text-right">
                                            <p className="text-sm font-semibold tabular-nums text-foreground">
                                                {p.count}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">{share}%</p>
                                        </div>
                                        <div className="w-24 text-right">
                                            <p className="text-sm font-semibold tabular-nums text-foreground">
                                                {inr(p.revenue)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">revenue</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Expiring soon ───────────────────────────────────── */}
                    <section className="overflow-hidden rounded-xl border">
                        <div className="border-b bg-muted/40 px-5 py-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Expiring within 14 days
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Reminder emails go out automatically at 7 and 1 days — this is for
                                spotting who is about to churn.
                            </p>
                        </div>
                        {data!.expiringSoon.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                                Nobody expires in the next two weeks.
                            </p>
                        ) : (
                            <div className="divide-y">
                                {data!.expiringSoon.map((u) => (
                                    <div
                                        key={u.email}
                                        className="flex items-center gap-4 px-5 py-3 text-sm"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-foreground">{u.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {u.email}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {dateOf(u.expiresAt)}
                                        </span>
                                        <span
                                            className={`w-16 text-right text-sm font-semibold tabular-nums ${
                                                u.daysLeft <= 3
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                            }`}
                                        >
                                            {u.daysLeft}d
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Recent purchases ────────────────────────────────── */}
                    <section className="overflow-hidden rounded-xl border">
                        <div className="border-b bg-muted/40 px-5 py-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                Recent purchases
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Newest first, up to 100. Amounts are what Razorpay actually captured,
                                not list price.
                            </p>
                        </div>
                        <div className="divide-y">
                            {data!.recent.map((m, i) => (
                                <div
                                    key={`${m.email}-${m.createdAt}-${i}`}
                                    className="flex items-center gap-4 px-5 py-3 text-sm"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-foreground">{m.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {m.months} month{m.months > 1 ? 's' : ''} · until{' '}
                                            {dateOf(m.expiresAt)}
                                        </p>
                                    </div>
                                    {m.isRenewal && (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                            Renewal
                                        </span>
                                    )}
                                    <span className="w-20 text-right font-semibold tabular-nums text-foreground">
                                        {inr(m.amount)}
                                    </span>
                                    <span className="hidden w-24 text-right text-xs text-muted-foreground sm:block">
                                        {dateOf(m.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function Stat({
    icon,
    label,
    value,
    hint,
    tone,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    hint?: string;
    tone?: string;
}) {
    return (
        <div className="rounded-xl border p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {icon}
                {label}
            </p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${tone ?? 'text-foreground'}`}>
                {value}
            </p>
            {hint && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
        </div>
    );
}
