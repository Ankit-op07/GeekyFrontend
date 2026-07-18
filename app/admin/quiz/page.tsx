'use client';

/**
 * Admin — Quiz Questions (PRD-005 scaling).
 *
 * Manage predict-output MCQs per kit/topic: author manually, bulk-generate with
 * AI (drafts), review, publish (draft → live), and delete. Admin is single-theme
 * (per CLAUDE.md), so this uses the global palette, not the reader tokens.
 *
 * The `verified` badge reflects the server-side QA gate (does the marked answer
 * actually match the code's output). Publish only what's verified or reviewed.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    Loader2, Sparkles, Plus, Trash2, Pencil, CheckCircle2,
    AlertTriangle, Upload, Database,
} from 'lucide-react';
import { MetricsPanel } from './metrics-panel';

interface Kit { _id: string; name: string; slug: string }
interface TopicOpt { _id: string; title: string; chapter: string }
interface Question {
    _id: string;
    kitId: string;
    topicId?: string;
    prompt: string;
    code: string;
    language: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
    status: 'draft' | 'live' | 'archived';
    source: string;
    verified: boolean;
    verifyNote?: string;
}

const BLANK: Partial<Question> = {
    prompt: 'What does this log?',
    code: '',
    language: 'javascript',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    difficulty: 'medium',
    status: 'draft',
};

export default function AdminQuizPage() {
    const [kits, setKits] = useState<Kit[]>([]);
    const [topics, setTopics] = useState<TopicOpt[]>([]);
    const [kitId, setKitId] = useState('');
    const [topicId, setTopicId] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState<string | null>(null); // 'generate' | 'seed'
    const [editing, setEditing] = useState<Partial<Question> | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    // ── data loaders ──────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/admin/content/kits')
            .then((r) => r.json())
            .then((d) => setKits(d.kits || d || []))
            .catch(() => {});
    }, []);

    const loadTopics = useCallback(async (kit: string) => {
        setTopics([]);
        if (!kit) return;
        try {
            const chRes = await fetch(`/api/admin/content/chapters?kitId=${kit}`).then((r) => r.json());
            const chapters: any[] = chRes.chapters || chRes || [];
            const all: TopicOpt[] = [];
            for (const ch of chapters) {
                const tRes = await fetch(`/api/admin/content/topics?chapterId=${ch._id}`).then((r) => r.json());
                const ts: any[] = tRes.topics || tRes || [];
                ts.forEach((t) => all.push({ _id: t._id, title: t.title, chapter: ch.title }));
            }
            setTopics(all);
        } catch { /* ignore */ }
    }, []);

    const loadQuestions = useCallback(async (topic: string) => {
        if (!topic) { setQuestions([]); return; }
        setLoading(true);
        try {
            const d = await fetch(`/api/admin/content/questions?topicId=${topic}`).then((r) => r.json());
            setQuestions(d.questions || []);
        } catch { setQuestions([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadTopics(kitId); setTopicId(''); setQuestions([]); }, [kitId, loadTopics]);
    useEffect(() => { loadQuestions(topicId); }, [topicId, loadQuestions]);

    // ── actions ───────────────────────────────────────────────────
    const generate = async () => {
        if (!topicId) return;
        setBusy('generate'); setMsg(null);
        try {
            const d = await fetch('/api/admin/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicId, count: 5 }),
            }).then((r) => r.json());
            if (d.error) setMsg(`⚠ ${d.error}`);
            else setMsg(`Generated ${d.created} draft(s) — ${d.verified} auto-verified, ${d.needsReview} need review.`);
            await loadQuestions(topicId);
        } catch { setMsg('⚠ Generation failed.'); }
        finally { setBusy(null); }
    };

    const seed = async () => {
        if (!kitId) return;
        setBusy('seed'); setMsg(null);
        try {
            const d = await fetch('/api/admin/quiz/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kitId }),
            }).then((r) => r.json());
            if (d.error) setMsg(`⚠ ${d.error}`);
            else setMsg(`Seeded ${d.created} question(s), skipped ${d.skipped} existing.`);
            await loadQuestions(topicId);
        } catch { setMsg('⚠ Seeding failed.'); }
        finally { setBusy(null); }
    };

    const save = async () => {
        if (!editing) return;
        const isNew = !editing._id;
        const payload = {
            ...editing,
            kitId,
            topicId,
            options: (editing.options || []).filter((o) => o !== undefined),
        };
        const d = await fetch('/api/admin/content/questions', {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then((r) => r.json());
        if (d.error) { setMsg(`⚠ ${d.error}`); return; }
        setEditing(null);
        await loadQuestions(topicId);
    };

    const remove = async (id: string) => {
        await fetch(`/api/admin/content/questions?id=${id}`, { method: 'DELETE' });
        await loadQuestions(topicId);
    };

    const setStatus = async (q: Question, status: 'draft' | 'live') => {
        await fetch('/api/admin/content/questions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: q._id, status }),
        });
        await loadQuestions(topicId);
    };

    // ── render ────────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">Quiz Questions</h1>
            <p className="text-muted-foreground mb-6 text-sm">
                Quiz questions shown inline at the end of each topic in the Learn reader. Generate
                with AI, review, then publish.
            </p>

            <MetricsPanel />

            {/* selectors */}
            <div className="flex flex-wrap gap-3 items-end mb-4">
                <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Kit</label>
                    <select
                        value={kitId}
                        onChange={(e) => setKitId(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm bg-background min-w-[200px]"
                    >
                        <option value="">Select a kit…</option>
                        {kits.map((k) => <option key={k._id} value={k._id}>{k.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Topic</label>
                    <select
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                        disabled={!kitId}
                        className="border rounded-md px-3 py-2 text-sm bg-background min-w-[260px] disabled:opacity-50"
                    >
                        <option value="">{kitId ? 'Select a topic…' : 'Pick a kit first'}</option>
                        {topics.map((t) => (
                            <option key={t._id} value={t._id}>{t.chapter} → {t.title}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={seed}
                    disabled={!kitId || busy !== null}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                    title="Promote the 15 built-in starter questions into this kit's matching topics"
                >
                    {busy === 'seed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    Seed starters
                </button>
                <button
                    onClick={generate}
                    disabled={!topicId || busy !== null}
                    className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                >
                    {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate with AI
                </button>
                <button
                    onClick={() => setEditing({ ...BLANK })}
                    disabled={!topicId}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {msg && <div className="mb-4 text-sm rounded-md border bg-muted px-3 py-2">{msg}</div>}

            {/* list */}
            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
            ) : !topicId ? (
                <p className="text-muted-foreground text-sm py-10 text-center">Pick a kit and topic to manage its questions.</p>
            ) : questions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-10 text-center">
                    No questions yet. Use <b>Generate with AI</b>, <b>Seed starters</b>, or <b>Add</b>.
                </p>
            ) : (
                <div className="space-y-3">
                    {questions.map((q) => (
                        <div key={q._id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <Badge tone={q.status === 'live' ? 'green' : 'gray'}>{q.status}</Badge>
                                        {q.verified
                                            ? <Badge tone="green"><CheckCircle2 className="w-3 h-3" /> verified</Badge>
                                            : <Badge tone="amber"><AlertTriangle className="w-3 h-3" /> unverified</Badge>}
                                        <Badge tone="gray">{q.source}</Badge>
                                        <Badge tone="gray">{q.difficulty}</Badge>
                                    </div>
                                    <p className="font-medium text-sm">{q.prompt}</p>
                                    <pre className="mt-2 text-xs bg-muted rounded p-2 overflow-x-auto"><code>{q.code}</code></pre>
                                    <ul className="mt-2 text-sm space-y-0.5">
                                        {q.options.map((o, i) => (
                                            <li key={i} className={i === q.correctIndex ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                                {i === q.correctIndex ? '✓ ' : '• '}<code>{o}</code>
                                            </li>
                                        ))}
                                    </ul>
                                    {!q.verified && q.verifyNote && (
                                        <p className="mt-1 text-xs text-amber-600">{q.verifyNote}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    {q.status === 'live'
                                        ? <button onClick={() => setStatus(q, 'draft')} className="text-xs border rounded px-2 py-1 hover:bg-muted">Unpublish</button>
                                        : <button onClick={() => setStatus(q, 'live')} className="text-xs border rounded px-2 py-1 hover:bg-muted inline-flex items-center gap-1"><Upload className="w-3 h-3" /> Publish</button>}
                                    <button onClick={() => setEditing(q)} className="text-xs border rounded px-2 py-1 hover:bg-muted inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                                    <button onClick={() => remove(q._id)} className="text-xs border rounded px-2 py-1 hover:bg-muted text-red-600 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <Editor
                    value={editing}
                    onChange={setEditing}
                    onSave={save}
                    onCancel={() => setEditing(null)}
                />
            )}
        </div>
    );
}

function Badge({ tone, children }: { tone: 'green' | 'amber' | 'gray'; children: React.ReactNode }) {
    const cls = tone === 'green'
        ? 'bg-green-100 text-green-700'
        : tone === 'amber'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-muted text-muted-foreground';
    return <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide ${cls}`}>{children}</span>;
}

function Editor({
    value, onChange, onSave, onCancel,
}: {
    value: Partial<Question>;
    onChange: (v: Partial<Question>) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    const opts = value.options || [];
    const upd = (patch: Partial<Question>) => onChange({ ...value, ...patch });
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onCancel}>
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4">{value._id ? 'Edit' : 'New'} question</h2>

                <label className="block text-xs font-medium mb-1">Prompt</label>
                <input className="w-full border rounded px-3 py-2 text-sm mb-3 bg-background"
                    value={value.prompt || ''} onChange={(e) => upd({ prompt: e.target.value })} />

                <label className="block text-xs font-medium mb-1">Code</label>
                <textarea className="w-full border rounded px-3 py-2 text-sm mb-3 font-mono bg-background" rows={6}
                    value={value.code || ''} onChange={(e) => upd({ code: e.target.value })} />

                <label className="block text-xs font-medium mb-1">Options (select the correct one)</label>
                <div className="space-y-2 mb-3">
                    {opts.map((o, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input type="radio" name="correct" checked={value.correctIndex === i}
                                onChange={() => upd({ correctIndex: i })} />
                            <input className="flex-1 border rounded px-2 py-1.5 text-sm font-mono bg-background"
                                value={o} onChange={(e) => {
                                    const next = [...opts]; next[i] = e.target.value; upd({ options: next });
                                }} />
                            <button className="text-xs text-red-600 px-1"
                                onClick={() => upd({ options: opts.filter((_, j) => j !== i), correctIndex: 0 })}>✕</button>
                        </div>
                    ))}
                    <button className="text-xs border rounded px-2 py-1 hover:bg-muted"
                        onClick={() => upd({ options: [...opts, ''] })}>+ Add option</button>
                </div>

                <label className="block text-xs font-medium mb-1">Explanation</label>
                <textarea className="w-full border rounded px-3 py-2 text-sm mb-3 bg-background" rows={2}
                    value={value.explanation || ''} onChange={(e) => upd({ explanation: e.target.value })} />

                <div className="flex gap-3 mb-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Difficulty</label>
                        <select className="border rounded px-2 py-1.5 text-sm bg-background"
                            value={value.difficulty || 'medium'} onChange={(e) => upd({ difficulty: e.target.value })}>
                            <option value="easy">easy</option>
                            <option value="medium">medium</option>
                            <option value="hard">hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Status</label>
                        <select className="border rounded px-2 py-1.5 text-sm bg-background"
                            value={value.status || 'draft'} onChange={(e) => upd({ status: e.target.value as any })}>
                            <option value="draft">draft</option>
                            <option value="live">live</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button className="border rounded px-4 py-2 text-sm hover:bg-muted" onClick={onCancel}>Cancel</button>
                    <button className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm hover:opacity-90" onClick={onSave}>Save</button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">On save, the answer is auto-checked by running the snippet.</p>
            </div>
        </div>
    );
}
