// app/admin/content/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight,
    BookOpen, FileText, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

// ─── Types ───────────────────────────────────────────────

interface Kit {
    _id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    order: number;
}

interface Chapter {
    _id: string;
    kitId: string;
    title: string;
    slug: string;
    order: number;
}

interface Topic {
    _id: string;
    chapterId: string;
    kitId: string;
    title: string;
    slug: string;
    content: string;
    order: number;
}

// ─── Color presets ───────────────────────────────────────

const GRADIENT_OPTIONS = [
    { label: 'Violet → Purple', value: 'from-violet-500 to-purple-500' },
    { label: 'Blue → Cyan', value: 'from-blue-500 to-cyan-500' },
    { label: 'Green → Emerald', value: 'from-green-600 to-emerald-600' },
    { label: 'Yellow → Orange', value: 'from-yellow-500 to-orange-500' },
    { label: 'Pink → Rose', value: 'from-pink-500 to-rose-500' },
    { label: 'Indigo → Purple', value: 'from-indigo-600 to-purple-600' },
    { label: 'Red → Pink', value: 'from-red-500 to-pink-500' },
    { label: 'Teal → Cyan', value: 'from-teal-500 to-cyan-500' },
];

// ─── Main Component ──────────────────────────────────────

export default function AdminContentPage() {
    const [kits, setKits] = useState<Kit[]>([]);
    const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

    const [loading, setLoading] = useState(true);
    const [chaptersLoading, setChaptersLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Editing state ──
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');

    // ── Add Kit Dialog ──
    const [addKitOpen, setAddKitOpen] = useState(false);
    const [newKitName, setNewKitName] = useState('');
    const [newKitDesc, setNewKitDesc] = useState('');
    const [newKitIcon, setNewKitIcon] = useState('📚');
    const [newKitColor, setNewKitColor] = useState('from-violet-500 to-purple-500');

    // ── Add Chapter Dialog ──
    const [addChapterOpen, setAddChapterOpen] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');

    // ── Add Topic Dialog ──
    const [addTopicOpen, setAddTopicOpen] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState('');

    // ── Fetch Kits ──
    const fetchKits = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/content/kits');
            const data = await res.json();
            if (data.kits) setKits(data.kits);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchKits(); }, [fetchKits]);

    // ── Fetch Chapters ──
    const fetchChapters = useCallback(async (kitId: string) => {
        setChaptersLoading(true);
        try {
            const res = await fetch(`/api/admin/content/chapters?kitId=${kitId}`);
            const data = await res.json();
            if (data.chapters) setChapters(data.chapters);
        } catch (e) { console.error(e); }
        setChaptersLoading(false);
    }, []);

    // ── Fetch Topics ──
    const fetchTopics = useCallback(async (chapterId: string) => {
        setTopicsLoading(true);
        try {
            const res = await fetch(`/api/admin/content/topics?chapterId=${chapterId}`);
            const data = await res.json();
            if (data.topics) setTopics(data.topics);
        } catch (e) { console.error(e); }
        setTopicsLoading(false);
    }, []);

    // ── Handlers ──

    const handleSelectKit = (kit: Kit) => {
        setSelectedKit(kit);
        setSelectedChapter(null);
        setSelectedTopic(null);
        setTopics([]);
        fetchChapters(kit._id);
    };

    const handleSelectChapter = (ch: Chapter) => {
        setSelectedChapter(ch);
        setSelectedTopic(null);
        fetchTopics(ch._id);
    };

    const handleSelectTopic = (t: Topic) => {
        setSelectedTopic(t);
        setEditTitle(t.title);
        setEditContent(t.content || '');
    };

    const handleAddKit = async () => {
        if (!newKitName.trim()) return;
        setSaving(true);
        try {
            await fetch('/api/admin/content/kits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newKitName, description: newKitDesc,
                    icon: newKitIcon, color: newKitColor, order: kits.length,
                }),
            });
            setNewKitName(''); setNewKitDesc(''); setNewKitIcon('📚');
            setAddKitOpen(false);
            fetchKits();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDeleteKit = async (kitId: string) => {
        try {
            await fetch(`/api/admin/content/kits?id=${kitId}`, { method: 'DELETE' });
            if (selectedKit?._id === kitId) {
                setSelectedKit(null); setChapters([]); setSelectedChapter(null);
                setTopics([]); setSelectedTopic(null);
            }
            fetchKits();
        } catch (e) { console.error(e); }
    };

    const handleAddChapter = async () => {
        if (!newChapterTitle.trim() || !selectedKit) return;
        setSaving(true);
        try {
            await fetch('/api/admin/content/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kitId: selectedKit._id, title: newChapterTitle,
                    order: chapters.length,
                }),
            });
            setNewChapterTitle(''); setAddChapterOpen(false);
            fetchChapters(selectedKit._id);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDeleteChapter = async (chId: string) => {
        try {
            await fetch(`/api/admin/content/chapters?id=${chId}`, { method: 'DELETE' });
            if (selectedChapter?._id === chId) {
                setSelectedChapter(null); setTopics([]); setSelectedTopic(null);
            }
            if (selectedKit) fetchChapters(selectedKit._id);
        } catch (e) { console.error(e); }
    };

    const handleAddTopic = async () => {
        if (!newTopicTitle.trim() || !selectedChapter || !selectedKit) return;
        setSaving(true);
        try {
            await fetch('/api/admin/content/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId: selectedChapter._id, kitId: selectedKit._id,
                    title: newTopicTitle, order: topics.length,
                }),
            });
            setNewTopicTitle(''); setAddTopicOpen(false);
            fetchTopics(selectedChapter._id);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDeleteTopic = async (tId: string) => {
        try {
            await fetch(`/api/admin/content/topics?id=${tId}`, { method: 'DELETE' });
            if (selectedTopic?._id === tId) setSelectedTopic(null);
            if (selectedChapter) fetchTopics(selectedChapter._id);
        } catch (e) { console.error(e); }
    };

    const handleSaveContent = async () => {
        if (!selectedTopic) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/content/topics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: selectedTopic._id, title: editTitle, content: editContent,
                }),
            });
            const data = await res.json();
            if (data.topic) {
                setSelectedTopic(data.topic);
                setTopics(prev => prev.map(t => t._id === data.topic._id ? data.topic : t));
            }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    // ═════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════

    return (
        <div className="h-screen bg-[#0a0a0f] text-white flex flex-col">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0d0d14] flex-shrink-0">
                <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                        <h1 className="text-lg font-semibold">Content Manager</h1>
                        <Badge variant="outline" className="text-violet-400 border-violet-500/30 text-xs">
                            {kits.length} kits
                        </Badge>
                    </div>
                    {selectedKit && (
                        <Link
                            href={`/learn/${selectedKit.slug}`}
                            target="_blank"
                            className="text-xs text-violet-400 hover:text-violet-300 underline"
                        >
                            Preview in reader →
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ─── Left: Kit & Chapter Tree ─── */}
                <div className="w-64 border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden">
                    {/* Kits Section */}
                    <div className="p-3 border-b border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kits</span>
                            <Dialog open={addKitOpen} onOpenChange={setAddKitOpen}>
                                <DialogTrigger asChild>
                                    <button className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-white">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/10 text-white">
                                    <DialogHeader>
                                        <DialogTitle>Add Kit</DialogTitle>
                                        <DialogDescription className="text-slate-400">Create a new learning kit</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-slate-300 text-sm">Name *</Label>
                                            <Input value={newKitName} onChange={e => setNewKitName(e.target.value)} placeholder="e.g. JavaScript Interview Kit" className="bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-slate-300 text-sm">Description</Label>
                                            <Input value={newKitDesc} onChange={e => setNewKitDesc(e.target.value)} placeholder="Brief description" className="bg-white/5 border-white/10 text-white" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-slate-300 text-sm">Icon</Label>
                                                <Input value={newKitIcon} onChange={e => setNewKitIcon(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-slate-300 text-sm">Color</Label>
                                                <Select value={newKitColor} onValueChange={setNewKitColor}>
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {GRADIENT_OPTIONS.map(g => (
                                                            <SelectItem key={g.value} value={g.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-3 h-3 rounded bg-gradient-to-r ${g.value}`} />
                                                                    {g.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setAddKitOpen(false)} className="border-white/10 text-slate-300">Cancel</Button>
                                        <Button onClick={handleAddKit} disabled={saving || !newKitName.trim()} className="bg-violet-600 hover:bg-violet-700">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Add Kit
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
                        ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {kits.map(k => (
                                    <div
                                        key={k._id}
                                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer group transition-all ${selectedKit?._id === k._id
                                            ? 'bg-violet-600/20 border border-violet-500/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                        onClick={() => handleSelectKit(k)}
                                    >
                                        <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${k.color} flex items-center justify-center text-sm flex-shrink-0`}>
                                            {k.icon}
                                        </div>
                                        <span className="text-sm text-white truncate flex-1">{k.name}</span>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20">
                                                    <Trash2 className="w-3 h-3 text-red-400" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete &quot;{k.name}&quot;?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">This will delete all chapters and topics.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="border-white/10 text-slate-300">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteKit(k._id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chapters & Topics Tree */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {!selectedKit ? (
                            <div className="text-center py-8 text-slate-600 text-xs">
                                <Layers className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                Select a kit to manage chapters
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chapters</span>
                                    <Dialog open={addChapterOpen} onOpenChange={setAddChapterOpen}>
                                        <DialogTrigger asChild>
                                            <button className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-white">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-900 border-white/10 text-white">
                                            <DialogHeader>
                                                <DialogTitle>Add Chapter</DialogTitle>
                                                <DialogDescription className="text-slate-400">Add a chapter to {selectedKit.name}</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-1.5 py-2">
                                                <Label className="text-slate-300 text-sm">Chapter Title *</Label>
                                                <Input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} placeholder="e.g. Closures & Scope" className="bg-white/5 border-white/10 text-white" />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setAddChapterOpen(false)} className="border-white/10 text-slate-300">Cancel</Button>
                                                <Button onClick={handleAddChapter} disabled={saving || !newChapterTitle.trim()} className="bg-violet-600 hover:bg-violet-700">Add</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {chaptersLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-violet-400" /></div>
                                ) : chapters.length === 0 ? (
                                    <p className="text-slate-600 text-xs text-center py-4">No chapters yet</p>
                                ) : (
                                    <div className="space-y-0.5">
                                        {chapters.map((ch, ci) => (
                                            <div key={ch._id}>
                                                <div
                                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer group transition-all ${selectedChapter?._id === ch._id
                                                        ? 'bg-white/5 border border-white/10'
                                                        : 'hover:bg-white/3 border border-transparent'
                                                        }`}
                                                    onClick={() => handleSelectChapter(ch)}
                                                >
                                                    {selectedChapter?._id === ch._id
                                                        ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                    }
                                                    <span className="text-slate-500 text-xs font-bold">{String(ci + 1).padStart(2, '0')}</span>
                                                    <span className="text-sm text-slate-300 truncate flex-1">{ch.title}</span>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20">
                                                                <Trash2 className="w-3 h-3 text-red-400" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete chapter?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400">All topics in this chapter will also be deleted.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="border-white/10 text-slate-300">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteChapter(ch._id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>

                                                {selectedChapter?._id === ch._id && (
                                                    <div className="ml-4 pl-3 border-l border-white/5 mt-1 mb-2 space-y-0.5">
                                                        {topicsLoading ? (
                                                            <div className="py-2 flex justify-center"><Loader2 className="w-3 h-3 animate-spin text-violet-400" /></div>
                                                        ) : (
                                                            <>
                                                                {topics.map(t => (
                                                                    <div
                                                                        key={t._id}
                                                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer group transition-all ${selectedTopic?._id === t._id
                                                                            ? 'bg-violet-500/15 text-violet-300'
                                                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/3'
                                                                            }`}
                                                                        onClick={() => handleSelectTopic(t)}
                                                                    >
                                                                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                                                        <span className="text-xs truncate flex-1">{t.title}</span>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <button onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20">
                                                                                    <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                                                                </button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete topic?</AlertDialogTitle>
                                                                                    <AlertDialogDescription className="text-slate-400">This will delete the topic and its content.</AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className="border-white/10 text-slate-300">Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleDeleteTopic(t._id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                ))}
                                                                <Dialog open={addTopicOpen} onOpenChange={setAddTopicOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors w-full rounded-md hover:bg-white/3">
                                                                            <Plus className="w-3 h-3" /> Add Topic
                                                                        </button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="bg-slate-900 border-white/10 text-white">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Add Topic</DialogTitle>
                                                                            <DialogDescription className="text-slate-400">Add to chapter: {selectedChapter?.title}</DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="space-y-1.5 py-2">
                                                                            <Label className="text-slate-300 text-sm">Topic Title *</Label>
                                                                            <Input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="e.g. What is a Closure?" className="bg-white/5 border-white/10 text-white" />
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={() => setAddTopicOpen(false)} className="border-white/10 text-slate-300">Cancel</Button>
                                                                            <Button onClick={handleAddTopic} disabled={saving || !newTopicTitle.trim()} className="bg-violet-600 hover:bg-violet-700">Add</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Right: Rich Text Editor ─── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!selectedTopic ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                                <p className="text-slate-500 text-sm">
                                    {!selectedKit
                                        ? 'Select a kit → chapter → topic to edit'
                                        : !selectedChapter
                                            ? 'Select a chapter to see topics'
                                            : 'Select a topic to edit its content'
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Editor Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0d0d14]/50 flex-shrink-0">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Input
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="bg-transparent border-0 text-white text-lg font-semibold px-0 focus-visible:ring-0 h-auto"
                                        placeholder="Topic title..."
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                        onClick={handleSaveContent}
                                        disabled={saving}
                                        size="sm"
                                        className="bg-violet-600 hover:bg-violet-700"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                                        Save
                                    </Button>
                                </div>
                            </div>

                            {/* TipTap Editor */}
                            <div className="flex-1 overflow-hidden">
                                <RichTextEditor
                                    content={editContent}
                                    onChange={setEditContent}
                                    placeholder="Start writing your content here..."
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
