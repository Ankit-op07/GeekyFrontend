import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

export async function POST(request: NextRequest) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userEmail,
            planId,
            durationDays,
        } = await request.json();

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: 'Payment verification failed' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Find and update user subscription
        const user = await CompanyKitUser.findOne({ email: userEmail });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Set subscription dates based on plan duration
        const subscriptionStartDate = new Date();
        const subscriptionEndDate = new Date();
        const days = durationDays || 30; // Default to 30 days if not provided
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + days);

        user.subscriptionStatus = 'active';
        user.subscriptionStartDate = subscriptionStartDate;
        user.subscriptionEndDate = subscriptionEndDate;
        user.paymentId = razorpay_payment_id;
        user.orderId = razorpay_order_id;
        user.planId = planId || '3m';

        await user.save();

        // Create session token
        const sessionToken = Buffer.from(JSON.stringify({
            id: user._id.toString(),
            email: user.email,
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        })).toString('base64');

        return NextResponse.json({
            success: true,
            message: 'Payment verified and subscription activated!',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                hasActiveSubscription: true,
                subscriptionEndDate: user.subscriptionEndDate,
                planId: user.planId,
            },
            sessionToken,
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}

