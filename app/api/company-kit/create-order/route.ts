import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { appConstants } from '@/lib/appConstants';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const { userEmail, userName } = await request.json();

        if (!userEmail) {
            return NextResponse.json(
                { error: 'User email is required' },
                { status: 400 }
            );
        }

        const { company_kit_price, company_kit_plan_name } = appConstants();

        const order = await razorpay.orders.create({
            amount: company_kit_price * 100, // Amount in paise
            currency: 'INR',
            receipt: `companykit_${Date.now()}`,
            notes: {
                planName: company_kit_plan_name,
                userEmail,
                userName: userName || '',
                type: 'company_kit_subscription',
            },
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Error creating company kit order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
