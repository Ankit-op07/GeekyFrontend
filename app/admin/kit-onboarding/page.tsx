'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mail, Send, Users, CheckCircle2, XCircle, Loader2,
    RefreshCw, FlaskConical, BookOpen, ChevronDown, Info,
    Sparkles, ShieldCheck, AlertTriangle, Plus, X, Trash2,
    Lock, Unlock, RotateCcw,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */
interface KitStat {
    kitName: string;
    orderCount: number;
    uniqueEmails: number;
}

interface Buyer {
    email: string;
    name: string;
    hasSetPassword: boolean;
}

interface SendResult {
    success: boolean;
    message: string;
    sentCount?: number;
    accessGrantedCount?: number;
    failedCount?: number;
    skippedCount?: number;
    totalRecipients?: number;
    failedEmails?: string[];
    results?: { email: string; success: boolean; error?: string }[];
}

/* ─── Known kit plan names (from PLAN_TO_SLUGS in appConstants) ───── */
const KIT_OPTIONS = [
    { label: '⚛️ React.js Interview Preparation Kit', value: 'Reactjs Interview Preparation Kit' },
    { label: '🟨 JS Interview Preparation Kit', value: 'JS Interview Preparation Kit' },
    { label: '🟨 JavaScript Interview Mastery Kit', value: 'JavaScript Interview Mastery Kit' },
    { label: '🏆 Complete Frontend Interview Preparation Kit', value: 'Complete Frontend Interview Preparation Kit' },
    { label: '💼 Frontend Interview Experiences Kit', value: 'Frontend Interview Experiences Kit' },
    { label: '🟢 Node.js Interview Preparation Kit', value: 'Node.js Interview Preparation Kit' },
    { label: '🟢 Node.js Backend Mastery Kit', value: 'Node.js Backend Mastery Kit' },
    { label: '🎓 Ultimate Campus Placement Kit', value: 'Ultimate Campus Placement Kit' },
    { label: '🧮 Company Wise DSA Kit — 3 Months', value: 'Company Wise DSA Kit — 3 Months' },
    { label: '🧮 Company Wise DSA Kit — 6 Months', value: 'Company Wise DSA Kit — 6 Months' },
    { label: '🧮 Company Wise DSA Kit — Lifetime', value: 'Company Wise DSA Kit — Lifetime' },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
const kitEmoji = (name: string) =>
    name.toLowerCase().includes('react') ? '⚛️'
        : name.toLowerCase().includes('node') ? '🟢'
            : name.toLowerCase().includes('js') || name.toLowerCase().includes('javascript') ? '🟨'
                : name.toLowerCase().includes('dsa') || name.toLowerCase().includes('company') ? '🧮'
                    : name.toLowerCase().includes('placement') ? '🎓'
                        : name.toLowerCase().includes('complete') ? '🏆'
                            : name.toLowerCase().includes('experience') ? '💼'
                                : '📚';

/* ─── Component ──────────────────────────────────────────────────── */
export default function KitOnboardingPage() {
    // Kit selection
    const [kitStats, setKitStats] = useState<KitStat[]>([]);
    const [selectedKit, setSelectedKit] = useState('');
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [buyersLoading, setBuyersLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [personalNote, setPersonalNote] = useState('');

    // Test emails (multiple)
    const [testEmails, setTestEmails] = useState<string[]>(['']);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<SendResult | null>(null);
    const sendingRef = useRef(false); // synchronous guard against double-submit

    // Bulk send
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<SendResult | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Resend to pending
    const [pendingLoading, setPendingLoading] = useState(false);
    const [pendingResult, setPendingResult] = useState<SendResult | null>(null);
    const [pendingConfirmOpen, setPendingConfirmOpen] = useState(false);

    // Counts
    const [pendingCount, setPendingCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    /* ── Fetch kit stats on mount ─────────────────────────────────── */
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await fetch('/api/admin/kit-onboarding');
            const data = await res.json();
            if (res.ok) setKitStats(data.kitStats || []);
        } catch (e) {
            console.error(e);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    /* ── Fetch buyers when kit changes ───────────────────────────── */
    useEffect(() => {
        if (!selectedKit) { setBuyers([]); return; }
        setBuyersLoading(true);
        setBulkResult(null);
        setTestResult(null);
        setPendingResult(null);
        setPendingConfirmOpen(false);
        const encoded = encodeURIComponent(selectedKit);
        fetch(`/api/admin/kit-onboarding?kit=${encoded}`)
            .then(r => r.json())
            .then(d => {
                setBuyers(d.buyers || []);
                setPendingCount(d.pendingCount ?? 0);
                setCompletedCount(d.completedCount ?? 0);
            })
            .catch(console.error)
            .finally(() => setBuyersLoading(false));
    }, [selectedKit]);

    /* ── Test email management ───────────────────────────────────── */
    const addTestEmail = () => { setTestEmails(prev => [...prev, '']); setTestResult(null); };
    const removeTestEmail = (idx: number) => { setTestEmails(prev => prev.filter((_, i) => i !== idx)); setTestResult(null); };
    const updateTestEmail = (idx: number, value: string) => {
        setTestEmails(prev => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
        setTestResult(null);
    };

    const validTestEmails = testEmails.filter(e => e.trim() && e.includes('@'));

    /* ── Send test emails ─────────────────────────────────────────── */
    const sendTest = async () => {
        // Synchronous ref guard — prevents double-submit even with rapid clicks
        if (sendingRef.current) {
            console.log('[UI] sendTest blocked — already in progress');
            return;
        }
        if (validTestEmails.length === 0 || !selectedKit) return;

        sendingRef.current = true;
        setTestLoading(true);
        setTestResult(null);

        // Deduplicate on the frontend (trim + lowercase + unique)
        const deduped = [...new Set(validTestEmails.map(e => e.trim().toLowerCase()))];
        console.log('[UI] sendTest: sending to', deduped.length, 'unique emails:', deduped);

        try {
            const res = await fetch('/api/admin/kit-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kitName: selectedKit,
                    personalNote: personalNote || undefined,
                    testEmails: deduped,
                }),
            });
            const data = await res.json();
            setTestResult({ success: res.ok, ...data });
        } catch (e: any) {
            setTestResult({ success: false, message: e.message });
        } finally {
            setTestLoading(false);
            sendingRef.current = false;
        }
    };

    /* ── Send bulk ───────────────────────────────────────────────── */
    const sendBulk = async () => {
        if (sendingRef.current) return;
        if (!selectedKit || buyers.length === 0) return;
        sendingRef.current = true;
        setBulkLoading(true);
        setBulkResult(null);
        setConfirmOpen(false);
        try {
            const res = await fetch('/api/admin/kit-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kitName: selectedKit, personalNote: personalNote || undefined }),
            });
            const data = await res.json();
            setBulkResult({ success: res.ok, ...data });
        } catch (e: any) {
            setBulkResult({ success: false, message: e.message });
        } finally {
            setBulkLoading(false);
            sendingRef.current = false;
        }
    };

    /* ── Resend to pending only ────────────────────────────────────── */
    const sendPending = async () => {
        if (sendingRef.current) return;
        if (!selectedKit || pendingCount === 0) return;
        sendingRef.current = true;
        setPendingLoading(true);
        setPendingResult(null);
        setPendingConfirmOpen(false);
        try {
            const res = await fetch('/api/admin/kit-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kitName: selectedKit,
                    personalNote: personalNote || undefined,
                    pendingOnly: true,
                }),
            });
            const data = await res.json();
            setPendingResult({ success: res.ok, ...data });
            // Refresh buyer list after sending
            if (res.ok) {
                const encoded = encodeURIComponent(selectedKit);
                const refreshRes = await fetch(`/api/admin/kit-onboarding?kit=${encoded}`);
                const refreshData = await refreshRes.json();
                setBuyers(refreshData.buyers || []);
                setPendingCount(refreshData.pendingCount ?? 0);
                setCompletedCount(refreshData.completedCount ?? 0);
            }
        } catch (e: any) {
            setPendingResult({ success: false, message: e.message });
        } finally {
            setPendingLoading(false);
            sendingRef.current = false;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-20">

            {/* ── Page header ──────────────────────────────────────── */}
            <div className="border-b border-white/5 bg-[#0d0d14] px-6 py-6 md:px-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-bold tracking-tight">Kit Onboarding</h1>
                        <p className="text-slate-500 text-xs mt-0.5">Grant kit access &amp; send onboarding emails with set-password links</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="px-6 md:px-10 pt-8 max-w-5xl mx-auto space-y-8">

                {/* ════════════════════════════════════════════════════
                    STEP 1: Select a kit
                   ════════════════════════════════════════════════════ */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                        <h2 className="text-white text-sm font-semibold">Select Interview Kit</h2>
                    </div>

                    {/* Kit stat cards */}
                    {statsLoading ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading kit stats…
                        </div>
                    ) : kitStats.length > 0 && (
                        <>
                            <p className="text-slate-500 text-xs mb-3">Click a card to select or use the dropdown below.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                {kitStats.map((k) => (
                                    <button
                                        key={k.kitName}
                                        onClick={() => setSelectedKit(k.kitName)}
                                        className={`text-left p-4 rounded-xl border transition-all
                                            ${selectedKit === k.kitName
                                                ? 'bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10'
                                                : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{kitEmoji(k.kitName)}</div>
                                        <p className="text-white text-sm font-semibold leading-snug mb-2 line-clamp-2">{k.kitName}</p>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-full font-medium">
                                                {k.uniqueEmails} buyers
                                            </span>
                                            <span className="text-slate-500">{k.orderCount} orders</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Dropdown selector */}
                    <select
                        value={selectedKit}
                        onChange={e => setSelectedKit(e.target.value)}
                        className="w-full max-w-lg bg-[#13131f] border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                    >
                        <option value="">— Choose a kit —</option>
                        {KIT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {selectedKit && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 max-w-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Selected: <strong>{selectedKit}</strong>
                        </div>
                    )}
                </section>

                {/* ════════════════════════════════════════════════════
                    STEP 2: View buyers
                   ════════════════════════════════════════════════════ */}
                {selectedKit && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                            <h2 className="text-white text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-violet-400" />
                                Existing Buyers
                                {!buyersLoading && (
                                    <span className="text-violet-400 bg-violet-500/15 text-xs px-2 py-0.5 rounded-full">
                                        {buyers.length}
                                    </span>
                                )}
                            </h2>
                        </div>

                        {buyersLoading ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Fetching buyers…
                            </div>
                        ) : buyers.length === 0 ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-300 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                No buyers found for this kit. You can still use the test section to send emails manually.
                            </div>
                        ) : (
                            <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
                                {/* Status summary bar */}
                                <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                                        <span className="text-amber-300 font-medium">{pendingCount} pending</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-emerald-300 font-medium">{completedCount} set password</span>
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {buyers.map((b, i) => (
                                        <div
                                            key={b.email}
                                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${b.hasSetPassword
                                                ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                                : 'bg-gradient-to-br from-amber-500 to-orange-600'
                                                }`}>
                                                {(b.name || b.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-200 font-medium truncate capitalize">{b.name}</p>
                                                <p className="text-slate-500 text-xs truncate">{b.email}</p>
                                            </div>
                                            {b.hasSetPassword ? (
                                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-medium shrink-0">
                                                    <Unlock className="w-2.5 h-2.5" /> Password set
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-medium shrink-0">
                                                    <Lock className="w-2.5 h-2.5" /> Pending
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ════════════════════════════════════════════════════
                    STEP 3: Personal note (optional)
                   ════════════════════════════════════════════════════ */}
                {selectedKit && (
                    <section>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">3</div>
                            <h2 className="text-white text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                Personal Note
                                <span className="text-slate-600 font-normal text-xs">(optional)</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 text-xs mb-3 ml-8">
                            Highlighted message inside the email from the team. Leave blank for default template.
                        </p>
                        <textarea
                            value={personalNote}
                            onChange={e => setPersonalNote(e.target.value)}
                            placeholder="e.g. We've been working hard to bring you the best React interview prep — we hope you love it! 💜"
                            rows={3}
                            className="w-full bg-[#13131f] border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none placeholder:text-slate-600"
                        />
                    </section>
                )}

                {/* ════════════════════════════════════════════════════
                    STEP 4: Test emails (multiple)
                   ════════════════════════════════════════════════════ */}
                {selectedKit && (
                    <section>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">4</div>
                            <h2 className="text-white text-sm font-semibold flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-emerald-400" />
                                Test Emails
                            </h2>
                        </div>
                        <p className="text-slate-500 text-xs mb-3 ml-8">
                            Add one or more emails to test. Each test email will: <strong className="text-slate-400">create the account</strong> → <strong className="text-slate-400">grant kit access</strong> → <strong className="text-slate-400">send onboarding email</strong> with a working password link.
                        </p>

                        <div className="space-y-2 max-w-lg">
                            {testEmails.map((email, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => updateTestEmail(idx, e.target.value)}
                                        placeholder={`test${idx + 1}@email.com`}
                                        className="flex-1 bg-[#13131f] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                                    />
                                    {testEmails.length > 1 && (
                                        <button
                                            onClick={() => removeTestEmail(idx)}
                                            className="px-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-2">
                                <button
                                    onClick={addTestEmail}
                                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg hover:bg-white/5 transition-all border border-dashed border-white/10 hover:border-emerald-500/30"
                                >
                                    <Plus className="w-3 h-3" /> Add another email
                                </button>
                            </div>

                            <button
                                onClick={sendTest}
                                disabled={validTestEmails.length === 0 || testLoading || (testResult?.success === true)}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all mt-3"
                            >
                                {testLoading
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending {validTestEmails.length} test email{validTestEmails.length !== 1 ? 's' : ''}…</>
                                    : testResult?.success
                                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Already sent — edit emails to re-send</>
                                        : <><Send className="w-3.5 h-3.5" /> Send Test to {validTestEmails.length} email{validTestEmails.length !== 1 ? 's' : ''}</>
                                }
                            </button>
                        </div>

                        {/* Test results */}
                        {testResult && (
                            <div className={`mt-4 rounded-xl border p-4 max-w-lg ${testResult.success ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {testResult.success
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        : <XCircle className="w-4 h-4 text-red-400" />
                                    }
                                    <p className={`text-sm font-medium ${testResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                                        {testResult.message}
                                    </p>
                                </div>

                                {/* Per-email results */}
                                {testResult.results && testResult.results.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {testResult.results.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                {r.success
                                                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                    : <XCircle className="w-3 h-3 text-red-400" />
                                                }
                                                <span className={r.success ? 'text-emerald-300' : 'text-red-300'}>{r.email}</span>
                                                {r.error && <span className="text-red-400/70">— {r.error}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* ════════════════════════════════════════════════════
                    STEP 5: Bulk send to all buyers
                   ════════════════════════════════════════════════════ */}
                {selectedKit && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">5</div>
                            <h2 className="text-white text-sm font-semibold">Send to All Buyers</h2>
                        </div>

                        {/* Info banner */}
                        <div className="bg-violet-500/[0.08] border border-violet-500/20 rounded-xl p-5 mb-4">
                            <p className="text-violet-300 text-sm font-semibold mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                What happens when you send
                            </p>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-200">Grants platform access</strong> — creates/updates each account and adds the kit to <code className="bg-white/5 px-1 rounded text-xs">purchasedKits</code></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-200">Sends a personalised email</strong> — unique set-password link (valid 7 days) + kit name</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-200">Safe to re-run</strong> — existing accounts are updated (not duplicated); kits are only added</span>
                                </li>
                            </ul>
                        </div>

                        {buyers.length === 0 && !buyersLoading ? (
                            <p className="text-slate-500 text-sm">No buyers found — use the test section above to send manually.</p>
                        ) : !confirmOpen ? (
                            <button
                                onClick={() => setConfirmOpen(true)}
                                disabled={bulkLoading || buyers.length === 0}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bulkLoading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending emails…</>
                                    : <><Send className="w-4 h-4" /> Grant Access &amp; Send to {buyers.length} buyer{buyers.length !== 1 ? 's' : ''}</>
                                }
                            </button>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 max-w-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                <p className="text-amber-300 font-semibold text-sm mb-1 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Confirm bulk send
                                </p>
                                <p className="text-slate-400 text-sm mb-4">
                                    You&apos;re about to grant access and send onboarding emails to
                                    <strong className="text-white"> {buyers.length} buyer{buyers.length !== 1 ? 's' : ''}</strong> of
                                    <strong className="text-white"> {selectedKit}</strong>.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={sendBulk}
                                        disabled={bulkLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-70"
                                    >
                                        {bulkLoading
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                                            : <><Send className="w-3.5 h-3.5" /> Yes, send now</>
                                        }
                                    </button>
                                    <button
                                        onClick={() => setConfirmOpen(false)}
                                        disabled={bulkLoading}
                                        className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ── Bulk result ───────────────────────────────────── */}
                {bulkResult && (
                    <section>
                        <div className={`rounded-xl border p-6 ${bulkResult.success ? 'bg-emerald-500/[0.08] border-emerald-500/20' : 'bg-red-500/[0.08] border-red-500/20'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                {bulkResult.success
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    : <XCircle className="w-5 h-5 text-red-400" />
                                }
                                <p className={`font-semibold text-sm ${bulkResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {bulkResult.success ? 'Onboarding complete! 🎉' : 'Something went wrong'}
                                </p>
                            </div>

                            {bulkResult.success ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-emerald-300">{bulkResult.sentCount ?? 0}</p>
                                        <p className="text-slate-400 text-xs mt-1">Emails sent</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-violet-300">{bulkResult.accessGrantedCount ?? 0}</p>
                                        <p className="text-slate-400 text-xs mt-1">Access granted</p>
                                    </div>
                                    {(bulkResult.failedCount ?? 0) > 0 && (
                                        <div className="bg-red-500/10 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-red-300">{bulkResult.failedCount}</p>
                                            <p className="text-slate-400 text-xs mt-1">Failed</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-red-300 text-sm">{bulkResult.message}</p>
                            )}

                            {bulkResult.failedEmails && bulkResult.failedEmails.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-slate-400 text-xs mb-1">Failed addresses:</p>
                                    <div className="bg-black/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                                        {bulkResult.failedEmails.map(e => (
                                            <p key={e} className="text-red-300 text-xs">{e}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ════════════════════════════════════════════════════
                    STEP 6: Resend to pending users only
                   ════════════════════════════════════════════════════ */}
                {selectedKit && pendingCount > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">6</div>
                            <h2 className="text-white text-sm font-semibold flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-amber-400" />
                                Resend to Pending Users
                                <span className="text-amber-400 bg-amber-500/15 text-xs px-2 py-0.5 rounded-full">
                                    {pendingCount} pending
                                </span>
                            </h2>
                        </div>

                        <p className="text-slate-500 text-xs mb-4">
                            Only sends to users who <strong className="text-amber-400">haven&apos;t set their password yet</strong>.
                            Users who already completed setup are automatically skipped.
                        </p>

                        {!pendingConfirmOpen ? (
                            <button
                                onClick={() => setPendingConfirmOpen(true)}
                                disabled={pendingLoading || pendingCount === 0}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pendingLoading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                                    : <><RotateCcw className="w-4 h-4" /> Resend to {pendingCount} pending user{pendingCount !== 1 ? 's' : ''}</>
                                }
                            </button>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 max-w-lg">
                                <p className="text-amber-300 font-semibold text-sm mb-1 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Confirm resend to pending
                                </p>
                                <p className="text-slate-400 text-sm mb-4">
                                    This will send onboarding emails to <strong className="text-white">{pendingCount} user{pendingCount !== 1 ? 's' : ''}</strong> who
                                    haven&apos;t set their password.
                                    <br />
                                    <span className="text-emerald-400">{completedCount} user{completedCount !== 1 ? 's' : ''} already completed — they will be skipped.</span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={sendPending}
                                        disabled={pendingLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-70"
                                    >
                                        {pendingLoading
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                                            : <><Send className="w-3.5 h-3.5" /> Yes, resend now</>
                                        }
                                    </button>
                                    <button
                                        onClick={() => setPendingConfirmOpen(false)}
                                        disabled={pendingLoading}
                                        className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Pending result */}
                        {pendingResult && (
                            <div className={`mt-4 rounded-xl border p-5 ${pendingResult.success ? 'bg-emerald-500/[0.08] border-emerald-500/20' : 'bg-red-500/[0.08] border-red-500/20'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {pendingResult.success
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        : <XCircle className="w-4 h-4 text-red-400" />
                                    }
                                    <p className={`text-sm font-medium ${pendingResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                                        {pendingResult.message}
                                    </p>
                                </div>
                                {pendingResult.success && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <p className="text-xl font-bold text-emerald-300">{pendingResult.sentCount ?? 0}</p>
                                            <p className="text-slate-400 text-[10px] mt-1">Emails sent</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <p className="text-xl font-bold text-violet-300">{pendingResult.accessGrantedCount ?? 0}</p>
                                            <p className="text-slate-400 text-[10px] mt-1">Access granted</p>
                                        </div>
                                        {(pendingResult.skippedCount ?? 0) > 0 && (
                                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                                <p className="text-xl font-bold text-slate-300">{pendingResult.skippedCount}</p>
                                                <p className="text-slate-400 text-[10px] mt-1">Skipped</p>
                                            </div>
                                        )}
                                        {(pendingResult.failedCount ?? 0) > 0 && (
                                            <div className="bg-red-500/10 rounded-lg p-3 text-center">
                                                <p className="text-xl font-bold text-red-300">{pendingResult.failedCount}</p>
                                                <p className="text-slate-400 text-[10px] mt-1">Failed</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

            </div>
        </div>
    );
}
