import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';

export async function GET() {
    try {
        await connectToDatabase();

        // Get total count
        const totalOrders = await Order.countDocuments();

        // Get orders by plan name
        const ordersByPlan = await Order.aggregate([
            {
                $group: {
                    _id: '$planName',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' },
                },
            },
            {
                $project: {
                    planName: '$_id',
                    count: 1,
                    revenue: 1,
                    _id: 0,
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Get orders by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    status: '$_id',
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // Get total revenue
        const revenueResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                },
            },
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Get orders over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ordersOverTime = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' },
                },
            },
            {
                $project: {
                    date: '$_id',
                    count: 1,
                    revenue: 1,
                    _id: 0,
                },
            },
            { $sort: { date: 1 } },
        ]);

        return NextResponse.json({
            totalOrders,
            totalRevenue,
            ordersByPlan,
            ordersByStatus,
            ordersOverTime,
        });
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
