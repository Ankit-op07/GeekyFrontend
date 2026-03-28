'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Users, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, Key, Trash2 } from 'lucide-react';

interface PlatformUser {
    _id: string;
    email: string;
    name: string;
    subscriptionStatus: string;
    purchasedKits: string[];
    createdAt: string;
    lastActiveDate: string;
    emailVerified: boolean;
    hasPassword: boolean;
    hasGoogle: boolean;
}

export default function PlatformUsersPage() {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set('search', debouncedSearch);

            const res = await fetch(`/api/admin/platform-users?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch platform users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [debouncedSearch]);

    const handleDelete = async (id: string) => {
        setDeleteLoading(id);
        try {
            const res = await fetch(`/api/admin/platform-users/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setUsers(users.filter((user) => user._id !== id));
            } else {
                console.error('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setDeleteLoading(null);
        }
    };

    // Analytics
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.subscriptionStatus === 'active' || u.purchasedKits.length > 0).length;
    const passwordSetCount = users.filter((u) => u.hasPassword || u.hasGoogle).length;
    const verifiedUsers = users.filter((u) => u.emailVerified).length;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

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
                            <Users className="w-8 h-8" />
                            Platform Users
                        </h1>
                        <p className="text-white/80">
                            Monitor registered users, login statuses, and profile details on your platform
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 w-[250px] bg-white border-0 shadow-sm"
                            />
                        </div>
                        <Button
                            onClick={fetchUsers}
                            variant="secondary"
                            className="gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white/95 backdrop-blur shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Users
                            </CardTitle>
                            <Users className="w-5 h-5 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalUsers}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Auth Setup (Ready)
                            </CardTitle>
                            <Key className="w-5 h-5 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : passwordSetCount}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Users with Password or Google Auth</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Active Subscribers
                            </CardTitle>
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : activeUsers}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Users with purchased kits / access</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Verified Emails
                            </CardTitle>
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : verifiedUsers}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="bg-white/95 backdrop-blur shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead>User Details</TableHead>
                                    <TableHead>Access / Kits</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Auth Method</TableHead>
                                    <TableHead>Joined At</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                                                <p>Loading users...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <XCircle className="w-8 h-8 text-gray-400 mb-2" />
                                                <p>No platform users found matching your search.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user._id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{user.name}</span>
                                                    <span className="text-sm text-gray-500">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.purchasedKits && user.purchasedKits.length > 0 ? (
                                                        user.purchasedKits.map((kit, i) => (
                                                            <Badge key={i} variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                                                                {kit}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">No access</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {(user.subscriptionStatus === 'active' || user.purchasedKits?.length > 0) ? (
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 flex w-fit items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {user.hasGoogle && (
                                                        <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
                                                            <svg viewBox="0 0 24 24" className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                            </svg>
                                                            Google
                                                        </Badge>
                                                    )}
                                                    {user.hasPassword && (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            Password
                                                        </Badge>
                                                    )}
                                                    {!user.hasGoogle && !user.hasPassword && (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex w-fit gap-1 items-center">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Needs Setup
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                                {formatDate(user.lastActiveDate)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            {deleteLoading === user._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete <strong>{user.name}</strong> from the database and remove their access to all kits.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(user._id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                {deleteLoading === user._id ? 'Deleting...' : 'Delete User'}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
