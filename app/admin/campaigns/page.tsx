// app/admin/campaigns/page.tsx
'use client';

/**
 * ─── Email campaigns (multi-day kit access rollout) ────────────────────────
 *
 *  Built for one job: give every past buyer of a kit access to its new
 *  in-platform version and tell them about it, when the list is bigger than a
 *  day's Gmail allowance.
 *
 *  The send button drives the API in small batches rather than asking the
 *  server to loop over hundreds of addresses in one request — a serverless
 *  function would be killed long before it finished. Progress lives in the DB
 *  (one row per recipient), so closing this tab mid-run loses nothing: the next
 *  click, today or next week, picks up at the next unsent person.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mail, Send, Users, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
    Play, Pause, RotateCcw, Search, Plus, Clock, Ban, ChevronRight,
} from 'lucide-react';

interface CampaignStats {
    pending: number; sending: number; sent: number; failed: number; skipped: number;
    total: number; sentToday: number;
}

interface Campaign {
    _id: string;
    key: string;
    name: string;
    grantPlanName: string;
    audiencePlanPatterns: string[];
    personalNote?: string;
    dailyLimit: number;
    status: 'draft' | 'active' | 'paused' | 'completed';
    lastBuiltAt?: string;
    stats?: CampaignStats;
}

interface Recipient {
    email: string;
    status: string;
    variant?: string;
    attempts: number;
    lastError?: string;
    sentAt?: string;
    sourcePlanName?: string;
}

/** Prefill for the campaign this screen was built for. */
const NODEJS_PRESET = {
    key: 'nodejs-kit-access',
    name: 'Node.js kit — platform access for past buyers',
    grantPlanName: 'Node.js Backend Mastery Kit',
    audiencePlanPatterns: ['Node.js Interview Preparation Kit', 'Node.js Backend Mastery Kit'],
    dailyLimit: 400,
};

const API = '/api/admin/email-campaigns';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [stats, setStats] = useState<CampaignStats | null>(null);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [recipientFilter, setRecipientFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [testEmails, setTestEmails] = useState('');
    const [note, setNote] = useState('');
    const [dailyLimit, setDailyLimit] = useState(400);

    // Live send progress
    const [sending, setSending] = useState(false);
    const [runProgress, setRunProgress] = useState({ sent: 0, failed: 0, skipped: 0 });
    const stopRef = useRef(false);

    const selected = campaigns.find(c => c._id === selectedId) || null;

    const loadCampaigns = useCallback(async () => {
        const res = await fetch(API);
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setLoading(false);
        return data.campaigns as Campaign[] | undefined;
    }, []);

    const loadDetail = useCallback(async (id: string, status = '') => {
        const res = await fetch(`${API}?id=${id}${status ? `&recipientStatus=${status}` : ''}`);
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        setRecipients(data.recipients || []);
        if (data.campaign) {
            setNote(data.campaign.personalNote || '');
            setDailyLimit(data.campaign.dailyLimit || 400);
        }
    }, []);

    useEffect(() => { loadCampaigns(); }, [loadCampaigns]);
    useEffect(() => {
        if (selectedId) loadDetail(selectedId, recipientFilter);
    }, [selectedId, recipientFilter, loadDetail]);

    const post = async (payload: Record<string, unknown>) => {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    };

    const run = async (label: string, fn: () => Promise<void>) => {
        setBusy(label);
        setMessage(null);
        try { await fn(); }
        catch (e: any) { setMessage({ kind: 'err', text: e.message }); }
        finally { setBusy(null); }
    };

    // ── actions ──────────────────────────────────────────────
    const createNodeCampaign = () => run('create', async () => {
        const data = await post({ action: 'create', ...NODEJS_PRESET });
        await loadCampaigns();
        setSelectedId(data.campaign._id);
        setMessage({ kind: 'ok', text: 'Campaign created. Preview the audience next.' });
    });

    const previewAudience = () => run('preview', async () => {
        const data = await post({ action: 'build', campaignId: selectedId, dryRun: true });
        setPreview(data);
        setMessage({
            kind: 'ok',
            text: `${data.uniqueBuyers} unique buyers matched · ${data.wouldAdd} new to add · ${data.alreadyInCampaign} already in the list.`,
        });
    });

    const buildAudience = () => run('build', async () => {
        const data = await post({ action: 'build', campaignId: selectedId });
        setPreview(null);
        setStats(data.stats);
        await loadCampaigns();
        await loadDetail(selectedId!, recipientFilter);
        setMessage({ kind: 'ok', text: `Recipient list built: ${data.added} added, ${data.alreadyInCampaign} already there. Nobody was reset.` });
    });

    const saveSettings = () => run('settings', async () => {
        await post({ action: 'update', campaignId: selectedId, personalNote: note, dailyLimit });
        await loadCampaigns();
        setMessage({ kind: 'ok', text: 'Settings saved.' });
    });

    const togglePause = () => run('pause', async () => {
        const next = selected?.status === 'paused' ? 'active' : 'paused';
        await post({ action: 'update', campaignId: selectedId, status: next });
        await loadCampaigns();
        setMessage({ kind: 'ok', text: next === 'paused' ? 'Campaign paused.' : 'Campaign resumed.' });
    });

    const requeueFailed = () => run('requeue', async () => {
        const data = await post({ action: 'requeue-failed', campaignId: selectedId });
        setStats(data.stats);
        await loadCampaigns();
        await loadDetail(selectedId!, recipientFilter);
        setMessage({ kind: 'ok', text: `${data.requeued} failed recipient(s) put back in the queue.` });
    });

    const sendTest = () => run('test', async () => {
        const emails = testEmails.split(/[,\n\s]+/).map(e => e.trim()).filter(Boolean);
        const data = await post({ action: 'send-test', campaignId: selectedId, emails });
        const ok = data.results.filter((r: any) => r.success).length;
        setMessage({
            kind: 'ok',
            text: `${ok}/${data.results.length} test email(s) sent (${data.results.map((r: any) => `${r.email}: ${r.variant}`).join(', ')}). No access granted, no progress consumed.`,
        });
    });

    /**
     * Drives send-batch until the daily cap, the queue, or the Stop button ends
     * it. Each round-trip is small on purpose — the server can't hold a
     * hundreds-of-emails loop open, and every batch is durably recorded.
     */
    const startSending = async () => {
        if (!selectedId || sending) return;
        setSending(true);
        setMessage(null);
        stopRef.current = false;
        const totals = { sent: 0, failed: 0, skipped: 0 };
        setRunProgress(totals);

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (stopRef.current) {
                    setMessage({ kind: 'warn', text: `Stopped. ${totals.sent} sent this run — the rest stay queued for later.` });
                    break;
                }

                const data = await post({ action: 'send-batch', campaignId: selectedId, batchSize: 25 });

                totals.sent += data.sent;
                totals.failed += data.failed;
                totals.skipped += data.skipped;
                setRunProgress({ ...totals });
                if (data.stats) setStats(data.stats);

                if (data.dailyCapReached) {
                    setMessage({
                        kind: 'warn',
                        text: `Daily cap reached — ${data.stats.sentToday} sent today. ${data.stats.pending} people are still queued; come back tomorrow and hit Send again to continue from exactly there.`,
                    });
                    break;
                }
                if (data.queueEmpty || data.processed === 0) {
                    setMessage({
                        kind: 'ok',
                        text: `Campaign complete — everyone in the list has been emailed. ${data.stats.sent} sent in total${data.stats.failed ? `, ${data.stats.failed} failed (requeue them below)` : ''}.`,
                    });
                    break;
                }
            }
        } catch (e: any) {
            setMessage({ kind: 'err', text: `${e.message} — nothing was lost; already-sent recipients stay marked sent.` });
        } finally {
            setSending(false);
            await loadCampaigns();
            if (selectedId) await loadDetail(selectedId, recipientFilter);
        }
    };

    // ── render ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
            </div>
        );
    }

    const allowanceLeft = selected && stats ? Math.max(0, selected.dailyLimit - stats.sentToday) : 0;
    const progressPct = stats && stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold flex items-center gap-2.5">
                    <Mail className="w-6 h-6 text-violet-400" />
                    Email Campaigns
                </h1>
                <p className="text-slate-400 text-sm mt-1.5">
                    Grant a kit to every past buyer and notify them, spread over as many days as the sending cap needs.
                    Progress is tracked per person — resuming never re-emails anyone.
                </p>
            </div>

            {/* Message banner */}
            {message && (
                <div className={`mb-6 rounded-xl px-4 py-3 text-sm border flex items-start gap-2.5 ${message.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    : message.kind === 'warn' ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                        : 'bg-red-500/10 border-red-500/25 text-red-300'
                    }`}>
                    {message.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Campaign list */}
            <div className="grid gap-3 mb-8">
                {campaigns.map(c => {
                    const isSel = c._id === selectedId;
                    return (
                        <button
                            key={c._id}
                            onClick={() => setSelectedId(isSel ? null : c._id)}
                            className={`text-left rounded-2xl border p-5 transition-all ${isSel
                                ? 'bg-violet-500/10 border-violet-500/40'
                                : 'bg-[#12121a] border-white/5 hover:border-white/15'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-white font-semibold">{c.name}</p>
                                        <StatusPill status={c.status} />
                                    </div>
                                    <p className="text-slate-500 text-xs mt-1 font-mono">{c.key} → grants "{c.grantPlanName}"</p>
                                </div>
                                <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform ${isSel ? 'rotate-90 text-violet-400' : 'text-slate-600'}`} />
                            </div>

                            {c.stats && c.stats.total > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">
                                            {c.stats.sent} of {c.stats.total} emailed
                                        </span>
                                        <span className="text-slate-500">{c.stats.pending} still queued</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
                                            style={{ width: `${c.stats.total ? (c.stats.sent / c.stats.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}

                {!campaigns.some(c => c.key === NODEJS_PRESET.key) && (
                    <button
                        onClick={createNodeCampaign}
                        disabled={busy === 'create'}
                        className="rounded-2xl border border-dashed border-white/10 hover:border-violet-500/40 p-6 text-center transition-colors group"
                    >
                        {busy === 'create'
                            ? <Loader2 className="w-5 h-5 animate-spin text-violet-400 mx-auto" />
                            : <Plus className="w-5 h-5 text-slate-500 group-hover:text-violet-400 mx-auto mb-2" />}
                        <p className="text-white text-sm font-medium">Create the Node.js kit campaign</p>
                        <p className="text-slate-500 text-xs mt-1">
                            Grants "{NODEJS_PRESET.grantPlanName}" to everyone who bought a Node.js kit · {NODEJS_PRESET.dailyLimit}/day
                        </p>
                    </button>
                )}
            </div>

            {/* Selected campaign detail */}
            {selected && stats && (
                <div className="space-y-6">
                    {/* Stat tiles */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Tile label="In list" value={stats.total} icon={Users} tone="slate" />
                        <Tile label="Emailed" value={stats.sent} icon={CheckCircle2} tone="emerald" />
                        <Tile label="Queued" value={stats.pending} icon={Clock} tone="violet" />
                        <Tile label="Failed" value={stats.failed} icon={AlertTriangle} tone="red" />
                        <Tile label="Sent today" value={`${stats.sentToday}/${selected.dailyLimit}`} icon={Send} tone="amber" />
                    </div>

                    {/* Overall progress */}
                    {stats.total > 0 && (
                        <div className="rounded-2xl bg-[#12121a] border border-white/5 p-5">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-300 font-medium">Campaign progress</span>
                                <span className="text-violet-300 font-semibold">{progressPct}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
                                    style={{ width: `${progressPct}%` }} />
                            </div>
                            <p className="text-slate-500 text-xs mt-2.5">
                                {allowanceLeft > 0
                                    ? `${allowanceLeft} more can go out today. ${stats.pending} people are waiting — at ${selected.dailyLimit}/day that's ~${Math.ceil(stats.pending / selected.dailyLimit)} more day(s).`
                                    : `Today's cap is used up. Come back tomorrow — the remaining ${stats.pending} stay queued in order.`}
                            </p>
                        </div>
                    )}

                    {/* Step 1 — audience */}
                    <Section title="1 · Recipient list" desc="Built from Orders (status email_sent) whose plan name matches this campaign. Re-running only adds new buyers; it never resets anyone already emailed.">
                        <div className="flex flex-wrap gap-2.5">
                            <Btn onClick={previewAudience} busy={busy === 'preview'} icon={Search} variant="ghost">Preview audience</Btn>
                            <Btn onClick={buildAudience} busy={busy === 'build'} icon={Users}>
                                {stats.total > 0 ? 'Refresh list' : 'Build list'}
                            </Btn>
                        </div>
                        {preview && (
                            <div className="mt-4 rounded-xl bg-black/30 border border-white/5 p-4 text-xs text-slate-300 space-y-1">
                                <p><span className="text-slate-500">Orders matched:</span> {preview.ordersMatched}</p>
                                <p><span className="text-slate-500">Unique buyers:</span> {preview.uniqueBuyers}</p>
                                <p><span className="text-slate-500">Would add:</span> <span className="text-emerald-400 font-semibold">{preview.wouldAdd}</span></p>
                                {preview.sample?.length > 0 && (
                                    <p className="text-slate-500 pt-1.5 break-all">Sample: {preview.sample.slice(0, 8).join(', ')}…</p>
                                )}
                            </div>
                        )}
                        <p className="text-slate-500 text-xs mt-3 font-mono">
                            Matching: {selected.audiencePlanPatterns.join('  |  ')}
                        </p>
                    </Section>

                    {/* Step 2 — settings + test */}
                    <Section title="2 · Message & limits" desc="Existing users with a password get a 'your kit is live, log in' email. Everyone else gets the set-password onboarding email. Test sends go through the same logic.">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-slate-400 text-xs block mb-1.5">Personal note (optional, shown in a callout)</label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. Thanks for being an early supporter — the whole kit is now on the platform."
                                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 text-xs block mb-1.5">Daily limit (Gmail cap)</label>
                                <input
                                    type="number"
                                    value={dailyLimit}
                                    onChange={e => setDailyLimit(Number(e.target.value))}
                                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                />
                                <p className="text-slate-600 text-[11px] mt-1.5">Counted across all campaigns, on the IST day.</p>
                                <Btn onClick={saveSettings} busy={busy === 'settings'} variant="ghost" className="mt-2.5">Save settings</Btn>
                            </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-white/5">
                            <label className="text-slate-400 text-xs block mb-1.5">Test send (comma or newline separated)</label>
                            <div className="flex flex-wrap gap-2.5">
                                <input
                                    value={testEmails}
                                    onChange={e => setTestEmails(e.target.value)}
                                    placeholder="you@example.com"
                                    className="flex-1 min-w-[220px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                />
                                <Btn onClick={sendTest} busy={busy === 'test'} icon={Send} variant="ghost">Send test</Btn>
                            </div>
                        </div>
                    </Section>

                    {/* Step 3 — send */}
                    <Section title="3 · Send" desc="Sends in batches of 25 until today's cap or the queue runs out. Safe to stop or close the tab at any point.">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {!sending ? (
                                <Btn
                                    onClick={startSending}
                                    icon={Send}
                                    disabled={stats.pending === 0 || allowanceLeft === 0 || selected.status === 'paused'}
                                >
                                    Send next {Math.min(allowanceLeft, stats.pending)}
                                </Btn>
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-200 text-sm font-medium">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending… {runProgress.sent} sent
                                        {runProgress.failed > 0 && `, ${runProgress.failed} failed`}
                                    </span>
                                    <Btn onClick={() => { stopRef.current = true; }} icon={Ban} variant="danger">Stop after this batch</Btn>
                                </>
                            )}

                            <Btn onClick={togglePause} busy={busy === 'pause'} icon={selected.status === 'paused' ? Play : Pause} variant="ghost">
                                {selected.status === 'paused' ? 'Resume campaign' : 'Pause campaign'}
                            </Btn>

                            {stats.failed > 0 && (
                                <Btn onClick={requeueFailed} busy={busy === 'requeue'} icon={RotateCcw} variant="ghost">
                                    Requeue {stats.failed} failed
                                </Btn>
                            )}
                        </div>

                        {stats.pending === 0 && stats.total > 0 && (
                            <p className="text-emerald-400 text-sm mt-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Everyone in this list has been emailed.
                            </p>
                        )}
                        {allowanceLeft === 0 && stats.pending > 0 && (
                            <p className="text-amber-400/90 text-sm mt-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Daily cap used. {stats.pending} queued for tomorrow.
                            </p>
                        )}
                    </Section>

                    {/* Recipients */}
                    <Section title="Recipients" desc="Most recently updated 100.">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['', 'pending', 'sent', 'failed', 'skipped'].map(f => (
                                <button
                                    key={f || 'all'}
                                    onClick={() => setRecipientFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${recipientFilter === f
                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                        : 'bg-white/5 text-slate-400 border border-transparent hover:text-white'
                                        }`}
                                >
                                    {f || 'all'}
                                </button>
                            ))}
                            <button onClick={() => loadDetail(selected._id, recipientFilter)}
                                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {recipients.length === 0 ? (
                            <p className="text-slate-500 text-sm py-6 text-center">No recipients{recipientFilter && ` with status "${recipientFilter}"`} yet.</p>
                        ) : (
                            <div className="overflow-x-auto -mx-5 px-5">
                                <table className="w-full text-sm min-w-[560px]">
                                    <thead>
                                        <tr className="text-slate-500 text-xs border-b border-white/5">
                                            <th className="text-left font-medium py-2">Email</th>
                                            <th className="text-left font-medium py-2">Status</th>
                                            <th className="text-left font-medium py-2">Variant</th>
                                            <th className="text-left font-medium py-2">Sent</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recipients.map(r => (
                                            <tr key={r.email}>
                                                <td className="py-2.5 text-slate-300 break-all">{r.email}</td>
                                                <td className="py-2.5"><StatusPill status={r.status} /></td>
                                                <td className="py-2.5 text-slate-500 text-xs">{r.variant || '—'}</td>
                                                <td className="py-2.5 text-slate-500 text-xs">
                                                    {r.sentAt ? new Date(r.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                                    {r.lastError && <span className="block text-red-400/80 max-w-[220px] truncate" title={r.lastError}>{r.lastError}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Section>
                </div>
            )}
        </div>
    );
}

// ─── Small presentational pieces ─────────────────────────────
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-[#12121a] border border-white/5 p-5">
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            {desc && <p className="text-slate-500 text-xs mt-1 mb-4 max-w-2xl leading-relaxed">{desc}</p>}
            {children}
        </div>
    );
}

const TONES: Record<string, string> = {
    slate: 'text-slate-300 bg-white/5',
    emerald: 'text-emerald-300 bg-emerald-500/10',
    violet: 'text-violet-300 bg-violet-500/10',
    red: 'text-red-300 bg-red-500/10',
    amber: 'text-amber-300 bg-amber-500/10',
};

function Tile({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: any; tone: string }) {
    return (
        <div className="rounded-xl bg-[#12121a] border border-white/5 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${TONES[tone]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-white text-xl font-bold leading-none">{value}</p>
            <p className="text-slate-500 text-xs mt-1.5">{label}</p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: 'bg-slate-500/15 text-slate-400',
        active: 'bg-emerald-500/15 text-emerald-300',
        paused: 'bg-amber-500/15 text-amber-300',
        completed: 'bg-violet-500/15 text-violet-300',
        pending: 'bg-slate-500/15 text-slate-400',
        sending: 'bg-blue-500/15 text-blue-300',
        sent: 'bg-emerald-500/15 text-emerald-300',
        failed: 'bg-red-500/15 text-red-300',
        skipped: 'bg-amber-500/15 text-amber-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${styles[status] || styles.draft}`}>
            {status}
        </span>
    );
}

function Btn({ children, onClick, busy, icon: Icon, variant = 'primary', disabled, className = '' }: {
    children: React.ReactNode; onClick: () => void; busy?: boolean; icon?: any;
    variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; className?: string;
}) {
    const variants = {
        primary: 'bg-violet-600 hover:bg-violet-500 text-white',
        ghost: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10',
        danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/25',
    };
    return (
        <button
            onClick={onClick}
            disabled={busy || disabled}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
}
