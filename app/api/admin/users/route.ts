import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const filterPlan = searchParams.get('filterPlan');
        const filterStatus = searchParams.get('filterStatus');
        const search = searchParams.get('search');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build query
        const query: Record<string, any> = {};

        if (filterPlan && filterPlan !== 'all') {
            query.planName = filterPlan;
        }

        if (filterStatus && filterStatus !== 'all') {
            query.status = filterStatus;
        }

        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                // Add 1 day to include the end date fully
                const endDate = new Date(dateTo);
                endDate.setDate(endDate.getDate() + 1);
                query.createdAt.$lte = endDate;
            }
        }

        // Build sort
        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Fetch orders
        const orders = await Order.find(query).sort(sort).lean();

        // Get unique plan names for filter dropdown
        const planNames = await Order.distinct('planName');

        return NextResponse.json({
            orders,
            planNames,
            total: orders.length,
        });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
