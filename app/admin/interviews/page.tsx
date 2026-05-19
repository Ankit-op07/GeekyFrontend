'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Link as LinkIcon,
    Loader2,
    RefreshCw,
    Search,
    Send,
    Video,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AdminInterview {
    _id: string;
    studentName: string;
    studentEmail: string;
    kit: string;
    interviewType: string;
    preferredTime: string;
    durationMinutes: 30 | 45 | 60;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    meetingLink?: string;
    adminNotes?: string;
    report?: {
        rating?: number;
        summary?: string;
        strengths?: string;
        improvements?: string;
        nextSteps?: string;
        resources?: string;
        submittedAt?: string;
    };
    createdAt: string;
}

const STATUS_OPTIONS = ['all', 'pending', 'approved', 'completed', 'rejected'] as const;

export default function AdminInterviewsPage() {
    const [interviews, setInterviews] = useState<AdminInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]>('all');
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, any>>({});

    const fetchInterviews = () => {
        setLoading(true);
        fetch(`/api/admin/interviews?status=${status}`)
            .then(r => r.json())
            .then(data => {
                const rows = data.interviews || [];
                setInterviews(rows);
                setDrafts(Object.fromEntries(rows.map((item: AdminInterview) => [item._id, {
                    meetingLink: item.meetingLink || '',
                    adminNotes: item.adminNotes || '',
                    preferredTime: toDatetimeLocal(item.preferredTime),
                    durationMinutes: item.durationMinutes,
                    rating: item.report?.rating || '',
                    summary: item.report?.summary || '',
                    strengths: item.report?.strengths || '',
                    improvements: item.report?.improvements || '',
                    nextSteps: item.report?.nextSteps || '',
                    resources: item.report?.resources || '',
                }])));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInterviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return interviews;
        return interviews.filter(item =>
            item.studentName.toLowerCase().includes(q) ||
            item.studentEmail.toLowerCase().includes(q) ||
            item.interviewType.toLowerCase().includes(q)
        );
    }, [interviews, search]);

    const counts = useMemo(() => ({
        pending: interviews.filter(item => item.status === 'pending').length,
        approved: interviews.filter(item => item.status === 'approved').length,
        completed: interviews.filter(item => item.status === 'completed').length,
    }), [interviews]);

    const updateDraft = (id: string, key: string, value: string | number) => {
        setDrafts(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: value },
        }));
    };

    const patchInterview = async (id: string, payload: Record<string, any>) => {
        setSavingId(id);
        try {
            const res = await fetch('/api/admin/interviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            });

            if (res.ok) fetchInterviews();
        } finally {
            setSavingId(null);
        }
    };

    const approveInterview = (item: AdminInterview) => {
        const draft = drafts[item._id] || {};
        patchInterview(item._id, {
            status: 'approved',
            meetingLink: draft.meetingLink,
            adminNotes: draft.adminNotes,
            preferredTime: draft.preferredTime,
            durationMinutes: Number(draft.durationMinutes),
        });
    };

    const submitReport = (item: AdminInterview) => {
        const draft = drafts[item._id] || {};
        patchInterview(item._id, {
            report: {
                rating: draft.rating,
                summary: draft.summary,
                strengths: draft.strengths,
                improvements: draft.improvements,
                nextSteps: draft.nextSteps,
                resources: draft.resources,
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                            <Video className="w-3.5 h-3.5" />
                            Team Interviews
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Student Interview Requests</h1>
                        <p className="text-slate-500 text-sm mt-1">Approve slots, add meeting links, and publish post-interview reports.</p>
                    </div>
                    <Button onClick={fetchInterviews} variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <MetricCard label="Pending" value={counts.pending} icon={Clock} color="text-yellow-300" />
                    <MetricCard label="Approved" value={counts.approved} icon={CheckCircle2} color="text-emerald-300" />
                    <MetricCard label="Reports Sent" value={counts.completed} icon={FileText} color="text-violet-300" />
                </div>

                <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <Input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search student, email, or interview type..."
                            className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={event => setStatus(event.target.value as typeof STATUS_OPTIONS[number])}
                        className="h-11 rounded-xl bg-slate-950 border border-white/10 px-3 text-sm text-white"
                    >
                        {STATUS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option === 'all' ? 'All Statuses' : option}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="py-24 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 rounded-2xl border border-dashed border-white/10">
                        <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-white font-semibold">No interview requests found</p>
                        <p className="text-slate-500 text-sm mt-1">New student requests will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(item => {
                            const draft = drafts[item._id] || {};
                            const isSaving = savingId === item._id;

                            return (
                                <div key={item._id} className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5 flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h2 className="text-white font-semibold">{item.studentName}</h2>
                                                <StatusBadge status={item.status} />
                                                <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">{item.durationMinutes} min</Badge>
                                            </div>
                                            <p className="text-slate-400 text-sm">{item.studentEmail}</p>
                                            <p className="text-slate-500 text-sm mt-1">{item.interviewType} · {formatAdminDate(item.preferredTime)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => approveInterview(item)}
                                                disabled={isSaving || item.status === 'completed'}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => patchInterview(item._id, { status: 'rejected', adminNotes: draft.adminNotes })}
                                                disabled={isSaving || item.status === 'completed'}
                                                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-5 grid xl:grid-cols-2 gap-5">
                                        <div className="space-y-4">
                                            <h3 className="text-white font-semibold flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4 text-emerald-300" />
                                                Schedule Details
                                            </h3>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                <AdminField label="Confirmed Time">
                                                    <input
                                                        type="datetime-local"
                                                        value={draft.preferredTime || ''}
                                                        onChange={event => updateDraft(item._id, 'preferredTime', event.target.value)}
                                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white"
                                                    />
                                                </AdminField>
                                                <AdminField label="Duration">
                                                    <select
                                                        value={draft.durationMinutes || item.durationMinutes}
                                                        onChange={event => updateDraft(item._id, 'durationMinutes', Number(event.target.value))}
                                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white"
                                                    >
                                                        <option value={30}>30 minutes</option>
                                                        <option value={45}>45 minutes</option>
                                                        <option value={60}>60 minutes</option>
                                                    </select>
                                                </AdminField>
                                            </div>
                                            <AdminField label="Meeting Link">
                                                <input
                                                    value={draft.meetingLink || ''}
                                                    onChange={event => updateDraft(item._id, 'meetingLink', event.target.value)}
                                                    placeholder="Google Meet / Zoom / Teams link"
                                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600"
                                                />
                                            </AdminField>
                                            <AdminField label="Team Note">
                                                <textarea
                                                    value={draft.adminNotes || ''}
                                                    onChange={event => updateDraft(item._id, 'adminNotes', event.target.value)}
                                                    placeholder="Visible to the student. Example: Please join 5 minutes early."
                                                    className="w-full min-h-[84px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                                                />
                                            </AdminField>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-white font-semibold flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-violet-300" />
                                                Interview Report
                                            </h3>
                                            <div className="grid sm:grid-cols-[120px_1fr] gap-3">
                                                <AdminField label="Rating">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={10}
                                                        value={draft.rating || ''}
                                                        onChange={event => updateDraft(item._id, 'rating', event.target.value)}
                                                        placeholder="1-10"
                                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600"
                                                    />
                                                </AdminField>
                                                <AdminField label="Summary">
                                                    <input
                                                        value={draft.summary || ''}
                                                        onChange={event => updateDraft(item._id, 'summary', event.target.value)}
                                                        placeholder="Overall review summary"
                                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600"
                                                    />
                                                </AdminField>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                <ReportTextarea label="Strengths" value={draft.strengths || ''} onChange={value => updateDraft(item._id, 'strengths', value)} />
                                                <ReportTextarea label="Improvements" value={draft.improvements || ''} onChange={value => updateDraft(item._id, 'improvements', value)} />
                                                <ReportTextarea label="Next Steps" value={draft.nextSteps || ''} onChange={value => updateDraft(item._id, 'nextSteps', value)} />
                                                <ReportTextarea label="Resources" value={draft.resources || ''} onChange={value => updateDraft(item._id, 'resources', value)} />
                                            </div>
                                            <Button
                                                onClick={() => submitReport(item)}
                                                disabled={isSaving}
                                                className="w-full bg-violet-600 hover:bg-violet-500 text-white"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                                Publish Report to Student
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
    return (
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
        </div>
    );
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs text-slate-500 mb-1.5 block">{label}</span>
            {children}
        </label>
    );
}

function ReportTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <AdminField label={label}>
            <textarea
                value={value}
                onChange={event => onChange(event.target.value)}
                className="w-full min-h-[96px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
        </AdminField>
    );
}

function StatusBadge({ status }: { status: AdminInterview['status'] }) {
    const styles: Record<AdminInterview['status'], string> = {
        pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
        approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-300 border-red-500/20',
        completed: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        cancelled: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    };

    return <Badge className={`${styles[status]} capitalize`}>{status}</Badge>;
}

function formatAdminDate(value: string) {
    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function toDatetimeLocal(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
}
