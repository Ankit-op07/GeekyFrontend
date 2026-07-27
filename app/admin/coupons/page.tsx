'use client';

/**
 * Admin — Coupons & offers.
 *
 * Create and run discount campaigns: percent/flat codes, per-kit targeting,
 * expiry, global and per-buyer caps, auto-apply and public promotion.
 *
 * What the numbers mean: `used`, `revenue` and `given away` are written only by
 * recordRedemption() from captured Razorpay payments — they are not editable
 * here and never count an abandoned checkout. A code's real cost is
 * "given away" measured against the revenue on the same row.
 *
 * Admin is single-theme (per CLAUDE.md): white cards on the dark shell, the
 * same idiom as /admin/live-users.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    Loader2, Plus, Ticket, Trash2, Pencil, Zap, Megaphone,
    AlertTriangle, IndianRupee, Users, X, Copy, Check,
} from 'lucide-react';

interface Coupon {
    _id: string;
    code: string;
    description: string;
    kind: 'percent' | 'flat';
    value: number;
    maxDiscount: number | null;
    appliesTo: string[];
    minOrderValue: number;
    maxRedemptions: number | null;
    maxPerUser: number;
    timesUsed: number;
    firstPurchaseOnly: boolean;
    stacksWithCredit: boolean;
    validFrom: string | null;
    validUntil: string | null;
    active: boolean;
    autoApply: boolean;
    promoted: boolean;
    campaign?: string;
    revenue: number;
    discountGiven: number;
    status: 'live' | 'paused' | 'expired' | 'scheduled' | 'exhausted';
}

interface Redemption {
    _id: string;
    code: string;
    email: string;
    kitId: string;
    discount: number;
    amountPaid: number;
    overLimit: boolean;
    createdAt: string;
}

interface KitOption { id: string; name: string; price: number }

const BLANK = {
    code: '',
    description: '',
    kind: 'percent' as 'percent' | 'flat',
    value: 20,
    maxDiscount: '',
    appliesTo: [] as string[],
    minOrderValue: 0,
    maxRedemptions: '',
    maxPerUser: 1,
    firstPurchaseOnly: false,
    stacksWithCredit: true,
    validFrom: '',
    validUntil: '',
    active: true,
    autoApply: false,
    promoted: false,
    campaign: '',
};

const STATUS_STYLE: Record<Coupon['status'], string> = {
    live: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-gray-200 text-gray-700',
    expired: 'bg-red-100 text-red-700',
    scheduled: 'bg-blue-100 text-blue-700',
    exhausted: 'bg-amber-100 text-amber-700',
};

/** One input style, shared by every field in the form. */
const INPUT =
    'w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white text-gray-900 outline-none ' +
    'transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in LOCAL time, not an ISO string. */
function toLocalInput(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [kits, setKits] = useState<KitOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<typeof BLANK | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setCoupons(data.coupons || []);
            setRedemptions(data.redemptions || []);
            setKits(data.kits || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const startCreate = () => { setForm({ ...BLANK }); setEditingId(null); setError(null); };

    const startEdit = (c: Coupon) => {
        setEditingId(c._id);
        setError(null);
        setForm({
            code: c.code,
            description: c.description || '',
            kind: c.kind,
            value: c.value,
            maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
            appliesTo: c.appliesTo || [],
            minOrderValue: c.minOrderValue || 0,
            maxRedemptions: c.maxRedemptions != null ? String(c.maxRedemptions) : '',
            maxPerUser: c.maxPerUser,
            firstPurchaseOnly: c.firstPurchaseOnly,
            stacksWithCredit: c.stacksWithCredit,
            validFrom: toLocalInput(c.validFrom),
            validUntil: toLocalInput(c.validUntil),
            active: c.active,
            autoApply: c.autoApply,
            promoted: c.promoted,
            campaign: c.campaign || '',
        });
    };

    const save = async () => {
        if (!form) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                ...form,
                value: Number(form.value),
                minOrderValue: Number(form.minOrderValue) || 0,
                maxPerUser: Number(form.maxPerUser) || 1,
                maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
                maxRedemptions: form.maxRedemptions === '' ? null : Number(form.maxRedemptions),
                // datetime-local gives local time; new Date() reads it as local
                // and toISOString normalises it, so the stored instant matches
                // what the admin picked on their own clock.
                validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
                validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
            };
            const res = await fetch(
                editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons',
                {
                    method: editingId ? 'PATCH' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setForm(null);
            setEditingId(null);
            setNotice(editingId ? 'Coupon updated.' : `Coupon ${data.coupon?.code} created.`);
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePause = async (c: Coupon) => {
        await fetch(`/api/admin/coupons/${c._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !c.active }),
        });
        await load();
    };

    const remove = async (c: Coupon) => {
        const res = await fetch(`/api/admin/coupons/${c._id}`, { method: 'DELETE' });
        const data = await res.json();
        // A used coupon is paused rather than deleted, and the API says so —
        // surface that instead of pretending the row disappeared.
        if (data.message) setNotice(data.message);
        await load();
    };

    const copyCode = (code: string) => {
        navigator.clipboard?.writeText(code).then(() => {
            setCopied(code);
            setTimeout(() => setCopied(null), 1500);
        }).catch(() => { /* clipboard blocked — the code is on screen anyway */ });
    };

    const kitLabel = (id: string) => kits.find((k) => k.id === id)?.name ?? id;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Ticket className="w-8 h-8" />
                        Coupons & Offers
                    </h1>
                    <p className="text-white/80">
                        Run discount campaigns. Codes are applied server-side — the checkout page can
                        only ever <em>display</em> a discount, never grant one.
                    </p>
                </div>
                <button
                    onClick={startCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 font-medium transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" /> New coupon
                </button>
            </div>

            {notice && (
                <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 text-sm flex items-start justify-between gap-3">
                    <span>{notice}</span>
                    <button onClick={() => setNotice(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Editor */}
            {form && (
                <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm p-5 md:p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900">
                            {editingId ? `Edit ${form.code}` : 'New coupon'}
                        </h2>
                        <button onClick={() => { setForm(null); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Code" hint={editingId ? 'Codes cannot be renamed — retire and recreate instead.' : 'Letters, numbers, - and _'}>
                            <input
                                value={form.code}
                                disabled={!!editingId}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="LAUNCH30"
                                className={`${INPUT} disabled:bg-gray-100 disabled:text-gray-500`}
                            />
                        </Field>

                        <Field label="Type">
                            <select
                                value={form.kind}
                                onChange={(e) => setForm({ ...form, kind: e.target.value as 'percent' | 'flat' })}
                                className={INPUT}
                            >
                                <option value="percent">Percent off</option>
                                <option value="flat">Flat ₹ off</option>
                            </select>
                        </Field>

                        <Field label={form.kind === 'percent' ? 'Percent (max 90)' : 'Amount in ₹'}>
                            <input
                                type="number"
                                min={1}
                                value={form.value}
                                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                                className={INPUT}
                            />
                        </Field>

                        {form.kind === 'percent' && (
                            <Field label="Max discount ₹" hint="Blank = uncapped">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.maxDiscount}
                                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                    placeholder="e.g. 100"
                                    className={INPUT}
                                />
                            </Field>
                        )}

                        <Field label="Min order ₹" hint="Checked after upgrade credit">
                            <input
                                type="number"
                                min={0}
                                value={form.minOrderValue}
                                onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                                className={INPUT}
                            />
                        </Field>

                        <Field label="Total redemptions" hint="Blank = unlimited">
                            <input
                                type="number"
                                min={1}
                                value={form.maxRedemptions}
                                onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                                placeholder="e.g. 100"
                                className={INPUT}
                            />
                        </Field>

                        <Field label="Per buyer">
                            <input
                                type="number"
                                min={1}
                                value={form.maxPerUser}
                                onChange={(e) => setForm({ ...form, maxPerUser: Number(e.target.value) })}
                                className={INPUT}
                            />
                        </Field>

                        <Field label="Starts">
                            <input
                                type="datetime-local"
                                value={form.validFrom}
                                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                                className={INPUT}
                            />
                        </Field>

                        <Field label="Ends" hint="Blank = never expires">
                            <input
                                type="datetime-local"
                                value={form.validUntil}
                                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                className={INPUT}
                            />
                        </Field>

                        <Field label="Campaign tag" hint="For your own reporting">
                            <input
                                value={form.campaign}
                                onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                                placeholder="instagram-oct"
                                className={INPUT}
                            />
                        </Field>

                        <div className="sm:col-span-2 lg:col-span-3">
                            <Field label="Description" hint="Shown to the buyer when the code applies">
                                <input
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Launch week — 30% off everything"
                                    className={INPUT}
                                />
                            </Field>
                        </div>

                        {/* Kit targeting */}
                        <div className="sm:col-span-2 lg:col-span-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                Applies to <span className="font-normal text-gray-500">— none selected means every kit, including ones you add later</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {kits.map((k) => {
                                    const on = form.appliesTo.includes(k.id);
                                    return (
                                        <button
                                            key={k.id}
                                            type="button"
                                            onClick={() => setForm({
                                                ...form,
                                                appliesTo: on
                                                    ? form.appliesTo.filter((id) => id !== k.id)
                                                    : [...form.appliesTo, k.id],
                                            })}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${on
                                                ? 'bg-violet-600 text-white border-violet-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {k.name} · ₹{k.price}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Switches */}
                        <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 gap-3 pt-2">
                            <Toggle
                                checked={form.autoApply}
                                onChange={(v) => setForm({ ...form, autoApply: v })}
                                label="Auto-apply at checkout"
                                hint="Buyers get it without typing anything. The deepest valid offer wins."
                            />
                            <Toggle
                                checked={form.promoted}
                                onChange={(v) => setForm({ ...form, promoted: v })}
                                label="Advertise publicly"
                                hint="Shows in the dashboard offer banner. Leave off for private/partner codes."
                            />
                            <Toggle
                                checked={form.firstPurchaseOnly}
                                onChange={(v) => setForm({ ...form, firstPurchaseOnly: v })}
                                label="First purchase only"
                                hint="Refused for any email that has paid before."
                            />
                            <Toggle
                                checked={form.stacksWithCredit}
                                onChange={(v) => setForm({ ...form, stacksWithCredit: v })}
                                label="Can stack with upgrade credit"
                                hint="Off = refused when the buyer already has credit toward the bundle."
                            />
                            <Toggle
                                checked={form.active}
                                onChange={(v) => setForm({ ...form, active: v })}
                                label="Active"
                                hint="Off pauses the code immediately."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 font-medium disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {editingId ? 'Save changes' : 'Create coupon'}
                        </button>
                        <button
                            onClick={() => { setForm(null); setEditingId(null); }}
                            className="rounded-xl border border-gray-300 px-5 py-2.5 text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex items-center gap-2 text-white/70 py-16 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading coupons…
                </div>
            ) : coupons.length === 0 ? (
                <div className="bg-white/95 rounded-2xl p-10 text-center">
                    <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-900 font-semibold mb-1">No coupons yet</p>
                    <p className="text-gray-500 text-sm">
                        Create one to run your first campaign — try a small, time-boxed code first.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {coupons.map((c) => {
                        const usagePct = c.maxRedemptions
                            ? Math.min(100, Math.round((c.timesUsed / c.maxRedemptions) * 100))
                            : 0;
                        return (
                            <div key={c._id} className="bg-white/95 backdrop-blur rounded-2xl shadow-sm p-5">
                                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <button
                                                onClick={() => copyCode(c.code)}
                                                className="font-mono font-bold text-gray-900 text-lg inline-flex items-center gap-1.5 hover:text-violet-700"
                                                title="Copy code"
                                            >
                                                {c.code}
                                                {copied === c.code
                                                    ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                            </button>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status]}`}>
                                                {c.status}
                                            </span>
                                            {c.autoApply && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 inline-flex items-center gap-1">
                                                    <Zap className="w-3 h-3" /> auto
                                                </span>
                                            )}
                                            {c.promoted && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                                                    <Megaphone className="w-3 h-3" /> public
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-900 font-medium">
                                            {c.kind === 'percent'
                                                ? `${c.value}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                                                : `₹${c.value} off`}
                                            {c.minOrderValue > 0 && ` · min order ₹${c.minOrderValue}`}
                                            {c.firstPurchaseOnly && ' · first purchase only'}
                                            {!c.stacksWithCredit && ' · no credit stacking'}
                                        </p>
                                        {c.description && <p className="text-sm text-gray-500 mt-0.5">{c.description}</p>}

                                        <p className="text-xs text-gray-500 mt-2">
                                            {c.appliesTo?.length
                                                ? `Applies to: ${c.appliesTo.map(kitLabel).join(', ')}`
                                                : 'Applies to all kits'}
                                            {c.validUntil && ` · ends ${new Date(c.validUntil).toLocaleString('en-IN')}`}
                                            {c.campaign && ` · #${c.campaign}`}
                                        </p>
                                    </div>

                                    {/* Performance */}
                                    <div className="flex gap-5 lg:gap-6 shrink-0">
                                        <Stat icon={Users} label="Used" value={
                                            c.maxRedemptions ? `${c.timesUsed}/${c.maxRedemptions}` : String(c.timesUsed)
                                        } />
                                        <Stat icon={IndianRupee} label="Revenue" value={`₹${(c.revenue || 0).toLocaleString('en-IN')}`} />
                                        <Stat icon={Ticket} label="Given away" value={`₹${(c.discountGiven || 0).toLocaleString('en-IN')}`} />
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => startEdit(c)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" title="Edit">
                                            <Pencil className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button onClick={() => togglePause(c)} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700">
                                            {c.active ? 'Pause' : 'Resume'}
                                        </button>
                                        <button onClick={() => remove(c)} className="p-2 rounded-lg border border-red-200 hover:bg-red-50" title="Delete (pauses instead if already used)">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {c.maxRedemptions != null && (
                                    <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${usagePct >= 100 ? 'bg-amber-500' : 'bg-violet-500'}`}
                                            style={{ width: `${usagePct}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recent redemptions */}
            {redemptions.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm mt-6 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Recent redemptions</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Captured payments only — abandoned checkouts never appear here.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-5 py-2.5 font-semibold">Code</th>
                                    <th className="text-left px-5 py-2.5 font-semibold">Buyer</th>
                                    <th className="text-left px-5 py-2.5 font-semibold">Kit</th>
                                    <th className="text-right px-5 py-2.5 font-semibold">Off</th>
                                    <th className="text-right px-5 py-2.5 font-semibold">Paid</th>
                                    <th className="text-left px-5 py-2.5 font-semibold">When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {redemptions.map((r) => (
                                    <tr key={r._id} className={r.overLimit ? 'bg-amber-50' : ''}>
                                        <td className="px-5 py-2.5 font-mono font-medium text-gray-900">
                                            {r.code}
                                            {r.overLimit && (
                                                <span className="ml-2 text-[10px] font-bold uppercase text-amber-700" title="Redeemed past the cap in a race between two checkouts — honoured because the payment was already captured">
                                                    over cap
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-2.5 text-gray-600">{r.email}</td>
                                        <td className="px-5 py-2.5 text-gray-600">{kitLabel(r.kitId)}</td>
                                        <td className="px-5 py-2.5 text-right text-red-600">−₹{r.discount}</td>
                                        <td className="px-5 py-2.5 text-right font-medium text-gray-900">₹{r.amountPaid}</td>
                                        <td className="px-5 py-2.5 text-gray-500">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
}

/* ── Small presentational helpers ──────────────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function Toggle({
    checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
    return (
        <label className="flex items-start gap-2.5 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-violet-600 shrink-0"
            />
            <span>
                <span className="block text-sm font-medium text-gray-900">{label}</span>
                <span className="block text-[11px] text-gray-500">{hint}</span>
            </span>
        </label>
    );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="text-center">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] uppercase tracking-wider font-semibold justify-center mb-0.5">
                <Icon className="w-3 h-3" /> {label}
            </div>
            <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{value}</p>
        </div>
    );
}
