import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        // Optional search param for filtering
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        let query: any = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch all users with basic info
        const users = await CompanyKitUser.find(query)
            .select('email name subscriptionStatus purchasedKits createdAt lastActiveDate emailVerified password googleId')
            .sort({ createdAt: -1 })
            .lean();

        // Add a boolean `hasPassword` based on the presence of a password field
        const transformedUsers = users.map((u: any) => ({
            _id: u._id.toString(),
            email: u.email,
            name: u.name,
            subscriptionStatus: u.subscriptionStatus,
            purchasedKits: u.purchasedKits || [],
            createdAt: u.createdAt,
            lastActiveDate: u.lastActiveDate,
            emailVerified: u.emailVerified,
            hasPassword: !!u.password,
            hasGoogle: !!u.googleId
        }));

        return NextResponse.json({
            success: true,
            totalUsers: transformedUsers.length,
            users: transformedUsers
        });

    } catch (error: any) {
        console.error('Failed to fetch platform users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
