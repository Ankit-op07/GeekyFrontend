'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Trash2,
    Users,
    DollarSign,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    TrendingUp,
    Database,
    CreditCard,
    Mail,
    Calendar,
    Send,
    X,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Order {
    _id: string;
    orderId: string;
    paymentId: string;
    email: string;
    planName: string;
    amount: number;
    status: 'processing' | 'email_sent' | 'failed';
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

interface RazorpayOrder {
    razorpayPaymentId: string;
    orderId: string;
    email: string;
    planName: string;
    amount: number;
    status: string;
    method: string;
    contact: string;
    createdAt: string;
    currency: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
}

type DataSource = 'database' | 'razorpay';

interface Analytics {
    totalOrders: number;
    totalRevenue: number;
    ordersByPlan: { planName: string; count: number; revenue: number }[];
    ordersByStatus: { status: string; count: number }[];
    ordersOverTime: { date: string; count: number; revenue: number }[];
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];

const STATUS_COLORS = {
    processing: 'bg-yellow-100 text-yellow-800',
    email_sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
    processing: 'Processing',
    email_sent: 'Delivered',
    failed: 'Failed',
};

const DATE_PRESETS = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 90 Days', value: '90days' },
    { label: 'Custom', value: 'custom' },
];

const EMAIL_TEMPLATES = [
    { id: 'new_offer', name: 'New Offer', subject: '🎉 Special Offer for You - Geeky Frontend' },
    { id: 'new_content', name: 'New Content', subject: '📚 New Content Added - Geeky Frontend' },
    { id: 'announcement', name: 'Announcement', subject: '📢 Important Announcement - Geeky Frontend' },
    { id: 'custom', name: 'Custom', subject: 'Custom Subject' },
];

export default function AdminUsersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [razorpayOrders, setRazorpayOrders] = useState<RazorpayOrder[]>([]);
    const [planNames, setPlanNames] = useState<string[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<DataSource>('database');

    // Filters and sorting
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterPlan, setFilterPlan] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Date range filter
    const [datePreset, setDatePreset] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Email dialog state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailTemplate, setEmailTemplate] = useState('new_offer');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailFilterKit, setEmailFilterKit] = useState('all');
    const [emailSending, setEmailSending] = useState(false);
    const [emailTestAddress, setEmailTestAddress] = useState('');
    const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

    // Handle date preset change
    const handleDatePresetChange = (preset: string) => {
        setDatePreset(preset);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (preset === 'all') {
            setDateFrom('');
            setDateTo('');
        } else if (preset === 'today') {
            const todayStr = today.toISOString().split('T')[0];
            setDateFrom(todayStr);
            setDateTo(todayStr);
        } else if (preset === '7days') {
            const from = new Date();
            from.setDate(from.getDate() - 7);
            setDateFrom(from.toISOString().split('T')[0]);
            setDateTo(today.toISOString().split('T')[0]);
        } else if (preset === '30days') {
            const from = new Date();
            from.setDate(from.getDate() - 30);
            setDateFrom(from.toISOString().split('T')[0]);
            setDateTo(today.toISOString().split('T')[0]);
        } else if (preset === '90days') {
            const from = new Date();
            from.setDate(from.getDate() - 90);
            setDateFrom(from.toISOString().split('T')[0]);
            setDateTo(today.toISOString().split('T')[0]);
        }
        // 'custom' - don't change dates, user will set them
    };

    // Send bulk email
    const handleSendEmail = async (isTest: boolean = false) => {
        setEmailSending(true);
        setEmailResult(null);

        try {
            const res = await fetch('/api/admin/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateType: emailTemplate,
                    customSubject: emailSubject,
                    message: emailMessage,
                    filterByKit: emailFilterKit !== 'all' ? emailFilterKit : null,
                    sendToAll: emailFilterKit === 'all',
                    testEmail: isTest ? emailTestAddress : null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setEmailResult({
                    success: true,
                    message: isTest
                        ? `Test email sent to ${emailTestAddress}`
                        : `Successfully sent ${data.sentCount} emails!${data.failedCount > 0 ? ` (${data.failedCount} failed)` : ''}`,
                });
                if (!isTest) {
                    // Reset form after successful send
                    setTimeout(() => {
                        setEmailDialogOpen(false);
                        setEmailResult(null);
                        setEmailMessage('');
                    }, 3000);
                }
            } else {
                setEmailResult({ success: false, message: data.error || 'Failed to send emails' });
            }
        } catch (error: any) {
            setEmailResult({ success: false, message: error.message || 'Failed to send emails' });
        } finally {
            setEmailSending(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);
            if (filterPlan !== 'all') params.set('filterPlan', filterPlan);
            if (filterStatus !== 'all') params.set('filterStatus', filterStatus);
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setOrders(data.orders);
                setPlanNames(data.planNames);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch analytics
    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();

            if (res.ok) {
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Fetch from Razorpay
    const fetchRazorpayOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('count', '100');
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (filterPlan !== 'all') params.set('filterPlan', filterPlan);

            const res = await fetch(`/api/admin/razorpay-payments?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setRazorpayOrders(data.orders);
                // Update analytics from Razorpay data
                setAnalytics({
                    totalOrders: data.orders.length,
                    totalRevenue: data.totalAmount,
                    ordersByPlan: data.ordersByPlan,
                    ordersByStatus: [{ status: 'email_sent', count: data.orders.length }],
                    ordersOverTime: [],
                });
                // Get unique plan names
                const plans = [...new Set(data.orders.map((o: RazorpayOrder) => o.planName))];
                setPlanNames(plans as string[]);
            }
        } catch (error) {
            console.error('Failed to fetch from Razorpay:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dataSource === 'database') {
            fetchOrders();
        } else {
            fetchRazorpayOrders();
        }
    }, [sortBy, sortOrder, filterPlan, filterStatus, debouncedSearch, dataSource, dateFrom, dateTo]);

    useEffect(() => {
        if (dataSource === 'database') {
            fetchAnalytics();
        }
    }, [dataSource]);

    // Handle delete
    const handleDelete = async (id: string) => {
        setDeleteLoading(id);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setOrders(orders.filter((order) => order._id !== id));
                fetchAnalytics(); // Refresh analytics
            }
        } catch (error) {
            console.error('Failed to delete order:', error);
        } finally {
            setDeleteLoading(null);
        }
    };

    // Toggle sort
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Get sort icon
    const getSortIcon = (field: string) => {
        if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
        return sortOrder === 'asc' ? (
            <ArrowUp className="w-4 h-4 ml-1" />
        ) : (
            <ArrowDown className="w-4 h-4 ml-1" />
        );
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format currency (amounts stored in paise, divide by 100 for rupees)
    const formatCurrency = (amountInPaise: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amountInPaise / 100);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            👥 User Purchases
                        </h1>
                        <p className="text-white/80">
                            Manage interview kit purchases and view analytics
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Data Source Toggle */}
                        <Tabs value={dataSource} onValueChange={(v) => setDataSource(v as DataSource)}>
                            <TabsList className="bg-white/20">
                                <TabsTrigger value="database" className="gap-2 data-[state=active]:bg-white">
                                    <Database className="w-4 h-4" />
                                    Database
                                </TabsTrigger>
                                <TabsTrigger value="razorpay" className="gap-2 data-[state=active]:bg-white">
                                    <CreditCard className="w-4 h-4" />
                                    Razorpay
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            onClick={() => {
                                if (dataSource === 'database') {
                                    fetchOrders();
                                    fetchAnalytics();
                                } else {
                                    fetchRazorpayOrders();
                                }
                            }}
                            variant="secondary"
                            className="gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>

                        {/* Send Email Button */}
                        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                    <Mail className="w-4 h-4" />
                                    Send Email
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Send Bulk Email
                                    </DialogTitle>
                                    <DialogDescription>
                                        Send promotional emails to users who purchased interview kits
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Template Selection */}
                                    <div className="space-y-2">
                                        <Label>Email Template</Label>
                                        <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EMAIL_TEMPLATES.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Custom Subject (for custom template) */}
                                    {emailTemplate === 'custom' && (
                                        <div className="space-y-2">
                                            <Label>Subject Line</Label>
                                            <Input
                                                value={emailSubject}
                                                onChange={(e) => setEmailSubject(e.target.value)}
                                                placeholder="Enter email subject..."
                                            />
                                        </div>
                                    )}

                                    {/* Recipients Filter */}
                                    <div className="space-y-2">
                                        <Label>Send To</Label>
                                        <Select value={emailFilterKit} onValueChange={setEmailFilterKit}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select recipients" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Customers</SelectItem>
                                                <SelectItem value="JS">JS Kit Buyers</SelectItem>
                                                <SelectItem value="React">React Kit Buyers</SelectItem>
                                                <SelectItem value="Complete">Complete Kit Buyers</SelectItem>
                                                <SelectItem value="Node">Node.js Kit Buyers</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <Label>Message Content</Label>
                                        <Textarea
                                            value={emailMessage}
                                            onChange={(e) => setEmailMessage(e.target.value)}
                                            placeholder="Write your message here... This will be placed in the email template body."
                                            className="min-h-[150px]"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Tip: You can use HTML for formatting (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;br&gt; for line breaks)
                                        </p>
                                    </div>

                                    {/* Test Email */}
                                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                                        <Label className="text-sm font-medium">Test Email First</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={emailTestAddress}
                                                onChange={(e) => setEmailTestAddress(e.target.value)}
                                                placeholder="your@email.com"
                                                className="flex-1"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => handleSendEmail(true)}
                                                disabled={!emailTestAddress || !emailMessage || emailSending}
                                            >
                                                {emailSending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Send Test'
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Result Message */}
                                    {emailResult && (
                                        <div
                                            className={`p-3 rounded-lg ${emailResult.success
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {emailResult.success ? '✅' : '❌'} {emailResult.message}
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setEmailDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleSendEmail(false)}
                                        disabled={!emailMessage || emailSending}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {emailSending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send to {emailFilterKit === 'all' ? 'All' : emailFilterKit + ' Kit Buyers'}
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white/95 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Purchases
                            </CardTitle>
                            <Users className="w-5 h-5 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {analyticsLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    analytics?.totalOrders || 0
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Revenue
                            </CardTitle>
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {analyticsLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    formatCurrency(analytics?.totalRevenue || 0)
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Successful Deliveries
                            </CardTitle>
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {analyticsLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    analytics?.ordersByStatus.find(
                                        (s) => s.status === 'email_sent'
                                    )?.count || 0
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Failed Orders
                            </CardTitle>
                            <XCircle className="w-5 h-5 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {analyticsLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    analytics?.ordersByStatus.find(
                                        (s) => s.status === 'failed'
                                    )?.count || 0
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Bar Chart - Orders by Plan */}
                    <Card className="bg-white/95 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Purchases by Interview Kit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analyticsLoading ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={analytics?.ordersByPlan || []}
                                        layout="vertical"
                                        margin={{ left: 20, right: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="planName"
                                            type="category"
                                            width={150}
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) =>
                                                value.length > 20
                                                    ? value.substring(0, 20) + '...'
                                                    : value
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value: number, name: string) => [
                                                name === 'count'
                                                    ? `${value} orders`
                                                    : formatCurrency(value),
                                                name === 'count' ? 'Orders' : 'Revenue',
                                            ]}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="#667eea"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pie Chart - Revenue Distribution */}
                    <Card className="bg-white/95 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Revenue Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analyticsLoading ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analytics?.ordersByPlan || []}
                                            dataKey="revenue"
                                            nameKey="planName"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) =>
                                                `${(percent * 100).toFixed(0)}%`
                                            }
                                        >
                                            {analytics?.ordersByPlan.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatCurrency(value)
                                            }
                                        />
                                        <Legend
                                            formatter={(value) =>
                                                value.length > 25
                                                    ? value.substring(0, 25) + '...'
                                                    : value
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="bg-white/95 backdrop-blur mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4">
                            {/* Row 1: Search, Kit, Status */}
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search by email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Filter by Plan */}
                                <Select value={filterPlan} onValueChange={setFilterPlan}>
                                    <SelectTrigger className="w-full md:w-[250px]">
                                        <SelectValue placeholder="Filter by Kit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Kits</SelectItem>
                                        {planNames.map((plan) => (
                                            <SelectItem key={plan} value={plan}>
                                                {plan}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filter by Status */}
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Filter by Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="email_sent">Delivered</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Row 2: Date Range */}
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Date Range:</span>
                                </div>

                                {/* Date Preset */}
                                <Select value={datePreset} onValueChange={handleDatePresetChange}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DATE_PRESETS.map((preset) => (
                                            <SelectItem key={preset.value} value={preset.value}>
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Custom Date Inputs */}
                                {datePreset === 'custom' && (
                                    <>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full md:w-[180px]"
                                        />
                                        <span className="text-gray-500">to</span>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full md:w-[180px]"
                                        />
                                    </>
                                )}

                                {/* Show date range if not all time */}
                                {datePreset !== 'all' && datePreset !== 'custom' && dateFrom && (
                                    <span className="text-sm text-gray-500">
                                        {new Date(dateFrom).toLocaleDateString('en-IN')} - {new Date(dateTo).toLocaleDateString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="bg-white/95 backdrop-blur">
                    <CardContent className="pt-6">
                        {/* Source indicator */}
                        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                            {dataSource === 'database' ? (
                                <>
                                    <Database className="w-4 h-4" />
                                    Showing data from your MongoDB database
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    Showing data directly from Razorpay (captured payments only)
                                </>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                <span className="ml-2 text-gray-600">
                                    Loading {dataSource === 'razorpay' ? 'from Razorpay...' : 'orders...'}
                                </span>
                            </div>
                        ) : dataSource === 'database' ? (
                            // Database Table
                            orders.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No orders found matching your criteria.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort('email')}
                                            >
                                                <div className="flex items-center">
                                                    Email
                                                    {getSortIcon('email')}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort('planName')}
                                            >
                                                <div className="flex items-center">
                                                    Interview Kit
                                                    {getSortIcon('planName')}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort('amount')}
                                            >
                                                <div className="flex items-center">
                                                    Amount
                                                    {getSortIcon('amount')}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center">
                                                    Status
                                                    {getSortIcon('status')}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort('createdAt')}
                                            >
                                                <div className="flex items-center">
                                                    Date
                                                    {getSortIcon('createdAt')}
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order._id}>
                                                <TableCell className="font-medium">
                                                    {order.email}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {order.planName}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-700">
                                                    {formatCurrency(order.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            STATUS_COLORS[order.status]
                                                        }
                                                    >
                                                        {STATUS_LABELS[order.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {formatDate(order.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                disabled={
                                                                    deleteLoading === order._id
                                                                }
                                                            >
                                                                {deleteLoading === order._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete Order?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete
                                                                    the order for{' '}
                                                                    <strong>{order.email}</strong>.
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleDelete(order._id)
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )
                        ) : (
                            // Razorpay Table
                            razorpayOrders.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No payments found in Razorpay.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Interview Kit</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {razorpayOrders.map((order) => (
                                            <TableRow key={order.razorpayPaymentId}>
                                                <TableCell className="font-medium">
                                                    {order.email}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {order.planName}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-700">
                                                    {formatCurrency(order.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        {order.method?.toUpperCase() || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {order.contact || order.vpa || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {formatDate(order.createdAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )
                        )}

                        {/* Total count */}
                        {!loading && (
                            <div className="mt-4 text-sm text-gray-500 text-center">
                                {dataSource === 'database' ? (
                                    orders.length > 0 ? `Showing ${orders.length} order${orders.length !== 1 ? 's' : ''}` : ''
                                ) : (
                                    razorpayOrders.length > 0 ? `Showing ${razorpayOrders.length} payment${razorpayOrders.length !== 1 ? 's' : ''} from Razorpay` : ''
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
