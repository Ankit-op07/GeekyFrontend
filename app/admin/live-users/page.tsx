'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getPlanDisplayName } from '@/lib/appConstants';
import {
    Radio, Loader2, RefreshCw, Users, Clock, Wifi, XCircle,
    FileText, ListChecks, ShoppingCart, ArrowRight,
} from 'lucide-react';

const POLL_MS = 15_000;

interface LiveUser {
    _id: string;
    name: string;
    email: string;
    lastSeenAt: string;
    currentPath?: string;
    purchasedKits?: string[];
    subscriptionStatus?: string;
}

interface ActivityRow {
    _id: string;
    event: 'pageview' | 'quiz_attempt' | 'purchase';
    path: string;
    meta?: Record<string, any>;
    createdAt: string;
}

function relativeTime(iso: string | undefined, nowMs: number): string {
    if (!iso) return '—';
    const diff = Math.max(0, nowMs - new Date(iso).getTime());
    const s = Math.floor(diff / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const EVENT_META: Record<ActivityRow['event'], { label: string; icon: any; className: string }> = {
    pageview: { label: 'Page view', icon: FileText, className: 'bg-slate-100 text-slate-700' },
    quiz_attempt: { label: 'Quiz attempt', icon: ListChecks, className: 'bg-violet-100 text-violet-700' },
    purchase: { label: 'Purchase', icon: ShoppingCart, className: 'bg-emerald-100 text-emerald-700' },
};

export default function LiveUsersPage() {
    const [users, setUsers] = useState<LiveUser[]>([]);
    const [counts, setCounts] = useState({ online: 0, last24h: 0, last7d: 0 });
    const [onlineWindowMs, setOnlineWindowMs] = useState(5 * 60 * 1000);
    // Difference between the server clock and this browser's clock (serverMs -
    // localMs), captured from each response's `now`. All online/last-seen maths
    // add this so a skewed admin clock can't flip badges or "last seen" labels.
    const [serverOffset, setServerOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Behaviour drawer
    const [selectedUser, setSelectedUser] = useState<LiveUser | null>(null);
    const [activity, setActivity] = useState<ActivityRow[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);

    const firstLoad = useRef(true);

    const fetchLive = useCallback(async () => {
        if (firstLoad.current) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch('/api/admin/live-users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users || []);
                setCounts(data.counts || { online: 0, last24h: 0, last7d: 0 });
                if (data.onlineWindowMs) setOnlineWindowMs(data.onlineWindowMs);
                if (data.now) setServerOffset(Date.parse(data.now) - Date.now());
            }
        } catch (e) {
            console.error('Failed to fetch live users:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            firstLoad.current = false;
        }
    }, []);

    // Initial load + auto-poll (paused when the tab is hidden).
    useEffect(() => {
        fetchLive();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') fetchLive();
        }, POLL_MS);
        return () => clearInterval(interval);
    }, [fetchLive]);

    const openUser = async (user: LiveUser) => {
        setSelectedUser(user);
        setActivity([]);
        setActivityLoading(true);
        try {
            const res = await fetch(`/api/admin/live-users/${user._id}/activity`);
            const data = await res.json();
            if (res.ok) setActivity(data.activity || []);
        } catch (e) {
            console.error('Failed to fetch activity:', e);
        } finally {
            setActivityLoading(false);
        }
    };

    // Server-aligned "now" — reconciles any admin-clock skew (see serverOffset).
    const serverNow = () => Date.now() + serverOffset;

    const isOnline = (u: LiveUser) =>
        !!u.lastSeenAt && serverNow() - new Date(u.lastSeenAt).getTime() <= onlineWindowMs;

    const statCards = [
        { label: 'Online now', value: counts.online, icon: Wifi, tint: 'text-emerald-600', hint: 'Active in the last 5 min' },
        { label: 'Active (24h)', value: counts.last24h, icon: Clock, tint: 'text-blue-600', hint: 'Seen in the last day' },
        { label: 'Active (7d)', value: counts.last7d, icon: Users, tint: 'text-indigo-600', hint: 'Seen in the last week' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                            <Radio className="w-8 h-8" />
                            Live Users
                        </h1>
                        <p className="text-white/80">
                            Real-time view of who is online, what page they are on, and their recent behaviour
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-white/70 text-sm flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                            Auto-refreshing every 15s
                        </span>
                        <Button onClick={fetchLive} variant="secondary" className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {statCards.map((s) => {
                        const Icon = s.icon;
                        return (
                            <Card key={s.label} className="bg-white/95 backdrop-blur shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">{s.label}</CardTitle>
                                    <Icon className={`w-5 h-5 ${s.tint}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : s.value}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{s.hint}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Users table */}
                <Card className="bg-white/95 backdrop-blur shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Current Page</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead>Last Seen</TableHead>
                                    <TableHead className="text-right">Behaviour</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                                                <p>Loading live users...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <XCircle className="w-8 h-8 text-gray-400 mb-2" />
                                                <p>No users active in the last 7 days.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => {
                                        const online = isOnline(user);
                                        return (
                                            <TableRow
                                                key={user._id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => openUser(user)}
                                            >
                                                <TableCell>
                                                    {online ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                                                            <span className="relative flex h-2.5 w-2.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                                            </span>
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                                                            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-300" />
                                                            Away
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">{user.name}</span>
                                                        <span className="text-sm text-gray-500">{user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.currentPath ? (
                                                        <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded max-w-[240px] inline-block truncate align-middle">
                                                            {user.currentPath}
                                                        </code>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.purchasedKits && user.purchasedKits.length > 0 ? (
                                                            user.purchasedKits.map((kit, i) => (
                                                                <Badge key={i} variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                                                                    {getPlanDisplayName(kit)}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Free</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                                    {relativeTime(user.lastSeenAt, serverNow())}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                                                        onClick={(e) => { e.stopPropagation(); openUser(user); }}
                                                    >
                                                        View
                                                        <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Behaviour timeline drawer */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Radio className="w-5 h-5 text-indigo-600" />
                            Behaviour timeline
                        </DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="flex flex-col min-h-0">
                            <div className="pb-3 mb-2 border-b border-gray-100">
                                <p className="font-medium text-gray-900">{selectedUser.name}</p>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                            <div className="overflow-y-auto flex-1 -mr-2 pr-2">
                                {activityLoading ? (
                                    <div className="flex items-center justify-center py-12 text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : activity.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-sm">
                                        No recorded activity yet.
                                    </div>
                                ) : (
                                    <ol className="space-y-2">
                                        {activity.map((a) => {
                                            const meta = EVENT_META[a.event] ?? EVENT_META.pageview;
                                            const Icon = meta.icon;
                                            return (
                                                <li key={a._id} className="flex items-start gap-3 text-sm">
                                                    <span className={`mt-0.5 flex-shrink-0 rounded-md p-1.5 ${meta.className}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-medium text-gray-800">{meta.label}</span>
                                                            <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(a.createdAt, serverNow())}</span>
                                                        </div>
                                                        <code className="text-xs text-gray-500 break-all">{a.path}</code>
                                                        {a.event === 'quiz_attempt' && a.meta && (
                                                            <span className={`ml-2 text-xs font-medium ${a.meta.correct ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {a.meta.correct ? 'correct' : 'wrong'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
