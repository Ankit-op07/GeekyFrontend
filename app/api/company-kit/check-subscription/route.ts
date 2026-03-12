import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

export async function POST(request: NextRequest) {
    try {
        const { sessionToken } = await request.json();

        if (!sessionToken) {
            return NextResponse.json({
                hasActiveSubscription: false,
                user: null,
            });
        }

        // Decode session token
        let tokenData;
        try {
            tokenData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
        } catch {
            return NextResponse.json({
                hasActiveSubscription: false,
                user: null,
            });
        }

        // Check if token is expired
        if (tokenData.exp < Date.now()) {
            return NextResponse.json({
                hasActiveSubscription: false,
                user: null,
                tokenExpired: true,
            });
        }

        await connectToDatabase();

        const user = await CompanyKitUser.findOne({ email: tokenData.email });

        if (!user) {
            return NextResponse.json({
                hasActiveSubscription: false,
                user: null,
            });
        }

        // Check if subscription is active
        const hasActiveSubscription = user.subscriptionStatus === 'active' &&
            user.subscriptionEndDate &&
            new Date() < user.subscriptionEndDate;

        return NextResponse.json({
            hasActiveSubscription,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
                subscriptionEndDate: user.subscriptionEndDate,
                completedQuestions: user.completedQuestions,
            },
        });

    } catch (error) {
        console.error('Check subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to check subscription' },
            { status: 500 }
        );
    }
}
