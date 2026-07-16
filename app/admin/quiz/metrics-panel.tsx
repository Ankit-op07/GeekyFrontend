'use client';

/**
 * Admin — the PRD-005 Phase-0 scoreboard.
 *
 * Phase 0 exists to answer ONE question: do learners actually want to practise?
 * (§7 — "≥30% of active learners attempt one. Below that, stop.") Until this
 * panel existed the app collected the attempts and had no way to read the
 * answer.
 *
 * The buyer rate is real. The preview rate is deliberately absent rather than
 * estimated — see the endpoint's header and the caveat rendered below. Showing a
 * confident number we cannot actually compute is how a go/no-go gate gets
 * cleared by a signal that means nothing.
 *
 * Admin is single-theme per CLAUDE.md → global palette, not reader tokens.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertTriangle, TrendingUp, BookOpen, ShieldAlert, Info } from 'lucide-react';

interface Metrics {
    window: { days: number; since: string };
    gate: {
        target: number;
        buyers: { learnersAttempted: number; activeLearners: number; rate: number | null; attempts: number };
        preview: { learnersAttempted: number; attempts: number; rate: null; note: string };
    };
    totals: { attempts: number; learners: number; correct: number; accuracy: number | null };
    perKit: Array<{
        kitSlug: string; kitName: string; attempts: number;
        learners: number; correct: number; accuracy: number | null;
    }>;
    coverage: { topicsWithLiveQuiz: number; totalTopics: number; percent: number };
    health: {
        liveButUnverified: number;
        minAttemptsToFlag: number;
        flagged: Array<{
            questionId: string; prompt: string; type: string;
            attempts: number; passRate: number; flag: 'too-easy' | 'likely-broken';
        }>;
    };
}

const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);

export function MetricsPanel() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (d: number) => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch(`/api/admin/quiz/metrics?days=${d}`);
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Failed to load metrics');
            setData(j);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(days); }, [days, load]);

    if (loading && !data) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading metrics…
            </div>
        );
    }
    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
            </div>
        );
    }
    if (!data) return null;

    const { gate, coverage, health, totals, perKit } = data;
    const rate = gate.buyers.rate;
    const meetsGate = rate !== null && rate >= gate.target;

    return (
        <section className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Phase-0 scoreboard
                </h2>
                <div className="flex gap-1">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                                days === d
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* ── the go/no-go ─────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        Buyer attempt rate · last {data.window.days}d
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-semibold ${meetsGate ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {pct(rate)}
                        </span>
                        <span className="text-sm text-gray-400">
                            of {gate.buyers.activeLearners} active buyers
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className={meetsGate ? 'h-full bg-emerald-500' : 'h-full bg-amber-500'}
                            style={{ width: `${Math.min((rate ?? 0) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {gate.buyers.learnersAttempted} attempted · {gate.buyers.attempts} answers ·
                        target {pct(gate.target)} (PRD-005 §7)
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        Preview (non-buyer) activity
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-gray-900">
                            {gate.preview.learnersAttempted}
                        </span>
                        <span className="text-sm text-gray-400">
                            learners · {gate.preview.attempts} answers
                        </span>
                    </div>
                    <div className="mt-2 flex gap-1.5 rounded-lg bg-blue-50 border border-blue-100 p-2">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-blue-800 m-0">
                            <strong>Count, not a rate.</strong> Preview users leave no activity
                            record, so there is no denominator to divide by. PRD-005 §15 says this is
                            the population the gate actually depends on — the buyer rate is a health
                            metric, not the go/no-go.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── coverage + health ────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                    icon={<BookOpen className="w-3.5 h-3.5" />}
                    label="Topics with a live quiz"
                    value={`${coverage.topicsWithLiveQuiz}/${coverage.totalTopics}`}
                    sub={`${coverage.percent}% coverage`}
                />
                <Stat
                    icon={<ShieldAlert className="w-3.5 h-3.5" />}
                    label="Live but unverified"
                    value={String(health.liveButUnverified)}
                    sub={health.liveButUnverified ? 'nothing corroborated these' : 'all corroborated'}
                    tone={health.liveButUnverified ? 'amber' : 'green'}
                />
                <Stat
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    label="Overall accuracy"
                    value={pct(totals.accuracy)}
                    sub={`${totals.attempts} answers · ${totals.learners} learners`}
                />
            </div>

            {/* ── §9 auto-flagged questions ────────────────────────────── */}
            {health.flagged.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h3 className="text-sm font-semibold text-amber-900 m-0">
                            {health.flagged.length} question{health.flagged.length > 1 ? 's' : ''} auto-flagged
                        </h3>
                    </div>
                    <p className="text-xs text-amber-800 mb-3">
                        Pass rate above 90% (trivial, or the options give it away) or below 10%
                        (broken, ambiguous, or the answer key is wrong). Only questions with ≥
                        {health.minAttemptsToFlag} attempts are judged.
                    </p>
                    <ul className="space-y-1.5 m-0 list-none p-0">
                        {health.flagged.map((f) => (
                            <li key={f.questionId} className="flex items-center gap-2 text-xs">
                                <span
                                    className={`px-1.5 py-0.5 rounded font-medium ${
                                        f.flag === 'likely-broken'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {f.flag === 'likely-broken' ? 'likely broken' : 'too easy'}
                                </span>
                                <span className="text-gray-700 truncate flex-1">{f.prompt}</span>
                                <span className="text-gray-500 shrink-0">
                                    {pct(f.passRate)} of {f.attempts}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── per-kit ──────────────────────────────────────────────── */}
            {perKit.length > 0 && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="text-left font-medium px-4 py-2">Kit</th>
                                <th className="text-right font-medium px-4 py-2">Learners</th>
                                <th className="text-right font-medium px-4 py-2">Answers</th>
                                <th className="text-right font-medium px-4 py-2">Correct</th>
                                <th className="text-right font-medium px-4 py-2">Accuracy</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {perKit.map((k) => (
                                <tr key={k.kitSlug}>
                                    <td className="px-4 py-2 text-gray-900">{k.kitName}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{k.learners}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{k.attempts}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{k.correct}</td>
                                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                                        {pct(k.accuracy)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function Stat({
    icon, label, value, sub, tone = 'gray',
}: {
    icon: React.ReactNode; label: string; value: string; sub: string;
    tone?: 'gray' | 'amber' | 'green';
}) {
    const toneClass =
        tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-emerald-600' : 'text-gray-900';
    return (
        <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1.5">
                {icon} {label}
            </div>
            <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
            <p className="text-xs text-gray-500 mt-0.5 m-0">{sub}</p>
        </div>
    );
}
