import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const count = parseInt(searchParams.get('count') || '100');
        const skip = parseInt(searchParams.get('skip') || '0');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const search = searchParams.get('search');
        const filterPlan = searchParams.get('filterPlan');

        // Build Razorpay query options
        const queryOptions: any = {
            count,
            skip,
        };

        // Razorpay supports from/to timestamps
        if (dateFrom) {
            queryOptions.from = Math.floor(new Date(dateFrom).getTime() / 1000);
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setDate(endDate.getDate() + 1);
            queryOptions.to = Math.floor(endDate.getTime() / 1000);
        }

        // Fetch payments from Razorpay
        const payments = await razorpay.payments.all(queryOptions);

        // Transform and filter payments
        let orders = payments.items
            .filter((payment: any) => payment.status === 'captured')
            .map((payment: any) => ({
                razorpayPaymentId: payment.id,
                orderId: payment.order_id,
                email: payment.email || payment.notes?.userEmail || 'N/A',
                planName: payment.notes?.planName || payment.description || 'Unknown Kit',
                amount: payment.amount,
                status: payment.status === 'captured' ? 'email_sent' : 'processing',
                method: payment.method,
                contact: payment.contact,
                createdAt: new Date(payment.created_at * 1000).toISOString(),
                currency: payment.currency,
                bank: payment.bank,
                wallet: payment.wallet,
                vpa: payment.vpa,
                card_id: payment.card_id,
            }));

        // Client-side search filter (Razorpay API doesn't support text search)
        if (search) {
            const searchLower = search.toLowerCase();
            orders = orders.filter((o: any) =>
                o.email.toLowerCase().includes(searchLower)
            );
        }

        // Client-side plan filter
        if (filterPlan && filterPlan !== 'all') {
            orders = orders.filter((o: any) =>
                o.planName.toLowerCase().includes(filterPlan.toLowerCase())
            );
        }

        // Get summary stats
        const totalAmount = orders.reduce((sum: number, order: any) => sum + order.amount, 0);

        // Group by plan name
        const byPlan: Record<string, { count: number; revenue: number }> = {};
        orders.forEach((order: any) => {
            if (!byPlan[order.planName]) {
                byPlan[order.planName] = { count: 0, revenue: 0 };
            }
            byPlan[order.planName].count++;
            byPlan[order.planName].revenue += order.amount;
        });

        const ordersByPlan = Object.entries(byPlan).map(([planName, data]) => ({
            planName,
            count: data.count,
            revenue: data.revenue,
        }));

        return NextResponse.json({
            orders,
            total: orders.length,
            totalAmount,
            ordersByPlan,
            source: 'razorpay',
        });
    } catch (error: any) {
        console.error('Error fetching from Razorpay:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from Razorpay', details: error.message },
            { status: 500 }
        );
    }
}
