import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getKitById } from '@/lib/appConstants';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { kitId, userEmail, userName, userMobile } = await request.json();

    if (!kitId || !userEmail) {
      return NextResponse.json({ error: 'Kit ID and email are required' }, { status: 400 });
    }

    // Resolve price server-side — never trust client-sent amounts
    const kit = getKitById(kitId);
    if (!kit) {
      return NextResponse.json({ error: 'Invalid kit ID' }, { status: 400 });
    }

    if (kit.comingSoon) {
      return NextResponse.json({ error: 'This kit is not available yet' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: kit.price * 100, // Amount in paise
      currency: 'INR',
      receipt: `${kitId}_${Date.now()}`,
      notes: {
        kitId,
        planName: kit.name,
        userEmail,
        userName: userName || '',
        userMobile: userMobile || '',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}