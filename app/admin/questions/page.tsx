'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Search, Loader2, RefreshCw, Edit, X, Save,
    Building2, FileText, ChevronDown, ArrowLeft, Database, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

// ── Helpers ──────────────────────────────────────────────

function isImageUrl(s: string) { return s.startsWith('http') || s.startsWith('/'); }

function CompanyLogoAdmin({ logo, color, size = 40 }: { logo: string; color: string; size?: number }) {
    if (isImageUrl(logo)) {
        return (
            <div className="flex-shrink-0 overflow-hidden rounded-lg bg-white/10" style={{ width: size, height: size }}>
                <Image src={logo} alt="logo" width={size} height={size} className="w-full h-full object-cover" unoptimized />
            </div>
        );
    }
    return (
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-lg flex-shrink-0`}
            style={{ width: size, height: size, fontSize: size * 0.45 }}>
            {logo}
        </div>
    );
}

const PLATFORM_LOGOS: Record<string, { label: string; icon: string }> = {
    leetcode: { label: 'LeetCode', icon: '/platforms/leetcode.svg' },
    gfg: { label: 'GeeksForGeeks', icon: '/platforms/gfg.svg' },
    hackerrank: { label: 'HackerRank', icon: '/platforms/hackerrank.svg' },
    codechef: { label: 'CodeChef', icon: '/platforms/codechef.svg' },
    interviewbit: { label: 'InterviewBit', icon: '/platforms/interviewbit.svg' },
};

function PlatformIconAdmin({ platform }: { platform: string }) {
    const info = PLATFORM_LOGOS[platform];
    if (!info) return <span className="text-slate-400 text-xs">{platform}</span>;
    return (
        <div className="inline-flex items-center gap-1.5" title={info.label}>
            <Image src={info.icon} alt={info.label} width={16} height={16} unoptimized />
            <span className="text-slate-400 text-xs">{info.label}</span>
        </div>
    );
}

// ── Types ────────────────────────────────────────────────

interface Company {
    _id: string;
    name: string;
    slug: string;
    logo: string;
    color: string;
    totalQuestions: number;
    difficulty: { easy: number; medium: number; hard: number };
}

interface Question {
    _id: string;
    companyId: string;
    title: string;
    link?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    platform: string;
    popularity: string;
    tags: string[];
    frequency: number;
}

// ── Gradient Options ─────────────────────────────────────

const GRADIENT_OPTIONS = [
    { label: 'Blue → Green', value: 'from-blue-500 to-green-500' },
    { label: 'Orange → Yellow', value: 'from-orange-500 to-yellow-500' },
    { label: 'Blue → Cyan', value: 'from-blue-600 to-cyan-500' },
    { label: 'Blue → Indigo', value: 'from-blue-600 to-indigo-600' },
    { label: 'Gray → Dark', value: 'from-gray-700 to-gray-900' },
    { label: 'Yellow → Blue', value: 'from-yellow-500 to-blue-600' },
    { label: 'Purple → Blue', value: 'from-purple-600 to-blue-500' },
    { label: 'Red → Rose', value: 'from-red-500 to-rose-500' },
    { label: 'Red → Dark Red', value: 'from-red-600 to-red-800' },
    { label: 'Orange → Red', value: 'from-orange-500 to-red-500' },
    { label: 'Violet → Purple', value: 'from-violet-500 to-purple-500' },
    { label: 'Blue → Sky', value: 'from-blue-500 to-sky-400' },
    { label: 'Blue Dark', value: 'from-blue-800 to-blue-500' },
    { label: 'Indigo → Purple', value: 'from-indigo-600 to-purple-600' },
    { label: 'Gray → Gray', value: 'from-gray-800 to-gray-600' },
];

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const;
const PLATFORM_OPTIONS = ['leetcode', 'gfg', 'hackerrank', 'codechef', 'interviewbit'] as const;
const POPULARITY_OPTIONS = ['Warm', 'Hot', 'Very Hot'] as const;

const DIFF_STYLE: Record<string, string> = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800',
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function AdminQuestionsPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [seeding, setSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState<string | null>(null);

    // ── Add Company Dialog ──
    const [addCompanyOpen, setAddCompanyOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyLogo, setNewCompanyLogo] = useState('');
    const [newCompanyColor, setNewCompanyColor] = useState('from-violet-500 to-purple-500');
    const [addCompanyLoading, setAddCompanyLoading] = useState(false);

    // ── Add Question Dialog ──
    const [addQOpen, setAddQOpen] = useState(false);
    const [newQ, setNewQ] = useState({
        title: '', link: '', difficulty: 'Medium' as string, platform: 'leetcode',
        popularity: 'Hot', tags: '', frequency: 50,
    });
    const [addQLoading, setAddQLoading] = useState(false);

    // ── Edit Question ──
    const [editingQ, setEditingQ] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        title: '', link: '', difficulty: '', platform: '', popularity: '', tags: '', frequency: 50,
    });
    const [saving, setSaving] = useState(false);

    // ── Fetch companies ──
    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/companies');
            const data = await res.json();
            if (res.ok) setCompanies(data.companies);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    // ── Fetch questions for a company ──
    const fetchQuestions = useCallback(async (companyId: string) => {
        setQuestionsLoading(true);
        try {
            const res = await fetch(`/api/companies/${companyId}/questions`);
            const data = await res.json();
            if (res.ok) setQuestions(data.questions);
        } catch (e) { console.error(e); }
        setQuestionsLoading(false);
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    useEffect(() => {
        if (selectedCompany) fetchQuestions(selectedCompany._id);
    }, [selectedCompany, fetchQuestions]);

    // ── Seed ──
    const handleSeed = async () => {
        setSeeding(true);
        setSeedResult(null);
        try {
            const res = await fetch('/api/admin/seed-questions', { method: 'POST' });
            const data = await res.json();
            setSeedResult(data.message || 'Done');
            fetchCompanies();
        } catch (e: any) {
            setSeedResult('Error: ' + e.message);
        }
        setSeeding(false);
    };

    // ── Add Company ──
    const handleAddCompany = async () => {
        if (!newCompanyName.trim()) return;
        setAddCompanyLoading(true);
        try {
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCompanyName, logo: newCompanyLogo, color: newCompanyColor }),
            });
            if (res.ok) {
                setAddCompanyOpen(false);
                setNewCompanyName('');
                setNewCompanyLogo('🏢');
                fetchCompanies();
            }
        } catch (e) { console.error(e); }
        setAddCompanyLoading(false);
    };

    // ── Delete Company ──
    const handleDeleteCompany = async (id: string) => {
        try {
            await fetch(`/api/companies/${id}`, { method: 'DELETE' });
            if (selectedCompany?._id === id) {
                setSelectedCompany(null);
                setQuestions([]);
            }
            fetchCompanies();
        } catch (e) { console.error(e); }
    };

    // ── Add Question ──
    const handleAddQuestion = async () => {
        if (!newQ.title.trim() || !selectedCompany) return;
        setAddQLoading(true);
        try {
            const res = await fetch(`/api/companies/${selectedCompany._id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newQ,
                    tags: newQ.tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });
            if (res.ok) {
                setAddQOpen(false);
                setNewQ({ title: '', link: '', difficulty: 'Medium', platform: 'leetcode', popularity: 'Hot', tags: '', frequency: 50 });
                fetchQuestions(selectedCompany._id);
                fetchCompanies(); // update counts
            }
        } catch (e) { console.error(e); }
        setAddQLoading(false);
    };

    // ── Save Edit ──
    const handleSaveEdit = async (qId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/questions/${qId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editForm.title,
                    link: editForm.link,
                    difficulty: editForm.difficulty,
                    platform: editForm.platform,
                    popularity: editForm.popularity,
                    tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                    frequency: editForm.frequency,
                }),
            });
            if (res.ok && selectedCompany) {
                setEditingQ(null);
                fetchQuestions(selectedCompany._id);
            }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    // ── Delete Question ──
    const handleDeleteQuestion = async (qId: string) => {
        try {
            await fetch(`/api/questions/${qId}`, { method: 'DELETE' });
            if (selectedCompany) {
                fetchQuestions(selectedCompany._id);
                fetchCompanies();
            }
        } catch (e) { console.error(e); }
    };

    const startEdit = (q: Question) => {
        setEditingQ(q._id);
        setEditForm({
            title: q.title,
            link: q.link || '',
            difficulty: q.difficulty,
            platform: q.platform,
            popularity: q.popularity,
            tags: q.tags.join(', '),
            frequency: q.frequency,
        });
    };

    const filteredCompanies = search
        ? companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : companies;

    const totalQuestions = companies.reduce((acc, c) => acc + c.totalQuestions, 0);

    // ── RENDER ─────────────────────────────────────────────

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%)', padding: '20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/admin/users" className="text-purple-300 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-2xl font-bold text-white">📝 Company-Wise Questions</h1>
                        </div>
                        <p className="text-purple-200/60 text-sm">{companies.length} companies · {totalQuestions} total questions</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button onClick={handleSeed} disabled={seeding} variant="outline" className="gap-2 border-purple-400/30 text-purple-200 hover:bg-purple-900/50 hover:text-white">
                            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                            Seed Data
                        </Button>
                        <Button onClick={fetchCompanies} variant="outline" className="gap-2 border-purple-400/30 text-purple-200 hover:bg-purple-900/50 hover:text-white">
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {seedResult && (
                    <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/30 text-green-300 text-sm flex items-center justify-between">
                        <span>{seedResult}</span>
                        <button onClick={() => setSeedResult(null)}><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-purple-300/60 mb-1">Companies</p>
                            <p className="text-2xl font-bold">{companies.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-purple-300/60 mb-1">Total Questions</p>
                            <p className="text-2xl font-bold">{totalQuestions}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-purple-300/60 mb-1">Easy</p>
                            <p className="text-2xl font-bold text-green-400">{companies.reduce((a, c) => a + c.difficulty.easy, 0)}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-purple-300/60 mb-1">Hard</p>
                            <p className="text-2xl font-bold text-red-400">{companies.reduce((a, c) => a + c.difficulty.hard, 0)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Two Panel Layout */}
                <div className="grid lg:grid-cols-[320px_1fr] gap-6">
                    {/* ── Left: Company List ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <Input
                                    placeholder="Search companies..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                />
                            </div>

                            {/* Add Company Dialog */}
                            <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
                                <DialogTrigger asChild>
                                    <Button size="icon" className="bg-violet-600 hover:bg-violet-700 flex-shrink-0">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/10 text-white">
                                    <DialogHeader>
                                        <DialogTitle>Add Company</DialogTitle>
                                        <DialogDescription className="text-slate-400">Add a new company to the question bank</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Company Name *</Label>
                                            <Input value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="e.g. Google" className="bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Logo (image URL or emoji)</Label>
                                            <Input value={newCompanyLogo} onChange={e => setNewCompanyLogo(e.target.value)} placeholder="https://logo.clearbit.com/google.com or 🔍" className="bg-white/5 border-white/10 text-white" />
                                            {newCompanyLogo && isImageUrl(newCompanyLogo) && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Image src={newCompanyLogo} alt="preview" width={32} height={32} className="rounded-md object-cover bg-white/10" unoptimized />
                                                    <span className="text-slate-500 text-xs">Preview</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Color Gradient</Label>
                                            <Select value={newCompanyColor} onValueChange={setNewCompanyColor}>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GRADIENT_OPTIONS.map(g => (
                                                        <SelectItem key={g.value} value={g.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-4 h-4 rounded bg-gradient-to-r ${g.value}`} />
                                                                {g.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setAddCompanyOpen(false)} className="border-white/10 text-slate-300">Cancel</Button>
                                        <Button onClick={handleAddCompany} disabled={addCompanyLoading || !newCompanyName.trim()} className="bg-violet-600 hover:bg-violet-700">
                                            {addCompanyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Add Company
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                                {filteredCompanies.map(c => (
                                    <button
                                        key={c._id}
                                        onClick={() => setSelectedCompany(c)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group ${selectedCompany?._id === c._id
                                            ? 'bg-violet-600/20 border border-violet-500/30'
                                            : 'bg-white/3 border border-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        <CompanyLogoAdmin logo={c.logo} color={c.color} size={40} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{c.name}</p>
                                            <p className="text-slate-500 text-xs">{c.totalQuestions} questions</p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    onClick={e => e.stopPropagation()}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        This will permanently delete this company and all {c.totalQuestions} questions.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="border-white/10 text-slate-300">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteCompany(c._id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Right: Questions Panel ── */}
                    <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                        {!selectedCompany ? (
                            <div className="flex items-center justify-center h-96 text-slate-500">
                                <div className="text-center">
                                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Select a company to manage questions</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Company Header */}
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CompanyLogoAdmin logo={selectedCompany.logo} color={selectedCompany.color} size={40} />
                                        <div>
                                            <h3 className="text-white font-semibold">{selectedCompany.name}</h3>
                                            <p className="text-slate-500 text-xs">{questions.length} questions</p>
                                        </div>
                                    </div>

                                    {/* Add Question */}
                                    <Dialog open={addQOpen} onOpenChange={setAddQOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Question
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Add Question to {selectedCompany.name}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-3 py-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-300 text-sm">Question Title *</Label>
                                                    <Input value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} placeholder="e.g. Two Sum" className="bg-white/5 border-white/10 text-white" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-300 text-sm">Problem Link</Label>
                                                    <Input value={newQ.link} onChange={e => setNewQ({ ...newQ, link: e.target.value })} placeholder="e.g. https://leetcode.com/problems/two-sum" className="bg-white/5 border-white/10 text-white" />
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-slate-300 text-sm">Difficulty</Label>
                                                        <Select value={newQ.difficulty} onValueChange={v => setNewQ({ ...newQ, difficulty: v })}>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {DIFFICULTY_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-slate-300 text-sm">Platform</Label>
                                                        <Select value={newQ.platform} onValueChange={v => setNewQ({ ...newQ, platform: v })}>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {PLATFORM_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-slate-300 text-sm">Popularity</Label>
                                                        <Select value={newQ.popularity} onValueChange={v => setNewQ({ ...newQ, popularity: v })}>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {POPULARITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-300 text-sm">Tags (comma-separated)</Label>
                                                    <Input value={newQ.tags} onChange={e => setNewQ({ ...newQ, tags: e.target.value })} placeholder="e.g. Arrays, Hash Map, Two Pointer" className="bg-white/5 border-white/10 text-white" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-300 text-sm">Frequency (1-100)</Label>
                                                    <Input type="number" min={1} max={100} value={newQ.frequency} onChange={e => setNewQ({ ...newQ, frequency: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setAddQOpen(false)} className="border-white/10 text-slate-300">Cancel</Button>
                                                <Button onClick={handleAddQuestion} disabled={addQLoading || !newQ.title.trim()} className="bg-violet-600 hover:bg-violet-700">
                                                    {addQLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Add Question
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Questions Table */}
                                <div className="overflow-x-auto">
                                    {questionsLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                                        </div>
                                    ) : questions.length === 0 ? (
                                        <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
                                            <div className="text-center">
                                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                <p>No questions yet. Click &quot;Add Question&quot; to start.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wide">
                                                    <th className="text-left px-4 py-3 font-medium">Title</th>
                                                    <th className="text-left px-4 py-3 font-medium w-28">Platform</th>
                                                    <th className="text-left px-4 py-3 font-medium w-20">Diff</th>
                                                    <th className="text-left px-4 py-3 font-medium w-20">Pop</th>
                                                    <th className="text-left px-4 py-3 font-medium">Tags</th>
                                                    <th className="text-left px-4 py-3 font-medium w-16">Freq</th>
                                                    <th className="text-right px-4 py-3 font-medium w-20">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {questions.map(q => (
                                                    <tr key={q._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                                        {editingQ === q._id ? (
                                                            <>
                                                                <td className="px-4 py-2">
                                                                    <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="h-8 bg-white/5 border-white/10 text-white text-sm mb-1" />
                                                                    <Input value={editForm.link} onChange={e => setEditForm({ ...editForm, link: e.target.value })} placeholder="Problem URL (optional)" className="h-7 bg-white/5 border-white/10 text-white text-xs" />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <Select value={editForm.platform} onValueChange={v => setEditForm({ ...editForm, platform: v })}>
                                                                        <SelectTrigger className="h-8 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>{PLATFORM_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <Select value={editForm.difficulty} onValueChange={v => setEditForm({ ...editForm, difficulty: v })}>
                                                                        <SelectTrigger className="h-8 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>{DIFFICULTY_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <Select value={editForm.popularity} onValueChange={v => setEditForm({ ...editForm, popularity: v })}>
                                                                        <SelectTrigger className="h-8 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>{POPULARITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <Input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} className="h-8 bg-white/5 border-white/10 text-white text-xs" />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <Input type="number" value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: Number(e.target.value) })} className="h-8 w-14 bg-white/5 border-white/10 text-white text-xs" />
                                                                </td>
                                                                <td className="px-4 py-2 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button onClick={() => handleSaveEdit(q._id)} disabled={saving} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400">
                                                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                        <button onClick={() => setEditingQ(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-4 py-3 text-sm">{q.link ? <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 group/l">{q.title} <ExternalLink className="w-3 h-3 opacity-50 group-hover/l:opacity-100" /></a> : <span className="text-white">{q.title}</span>}</td>
                                                                <td className="px-4 py-3"><PlatformIconAdmin platform={q.platform} /></td>
                                                                <td className="px-4 py-3">
                                                                    <Badge variant="outline" className={`text-[10px] ${DIFF_STYLE[q.difficulty]}`}>{q.difficulty}</Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-400 text-xs">{q.popularity}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {q.tags.slice(0, 3).map(t => (
                                                                            <span key={t} className="text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded">{t}</span>
                                                                        ))}
                                                                        {q.tags.length > 3 && <span className="text-[10px] text-slate-500">+{q.tags.length - 3}</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-400 text-xs">{q.frequency}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button onClick={() => startEdit(q)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                                                                            <Edit className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete &quot;{q.title}&quot;?</AlertDialogTitle>
                                                                                    <AlertDialogDescription className="text-slate-400">This cannot be undone.</AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className="border-white/10 text-slate-300">Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleDeleteQuestion(q._id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
