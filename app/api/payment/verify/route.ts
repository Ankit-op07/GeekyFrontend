import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSessionToken, getSessionCookieString } from '@/lib/session';
import { recordPurchase } from '@/lib/purchase';

/**
 * POST /api/payment/verify
 * Verifies Razorpay signature, creates/updates user, assigns kit,
 * and sets the session cookie for instant login on the client.
 *
 * The onboarding email ("Set Your Password" / "Kit added") is sent by the
 * Razorpay webhook (/api/payment/webhook), not here — the webhook is the
 * reliable server-to-server confirmation that fires even if the user closes
 * this tab before this request completes, so it owns the single email send.
 */
export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      userName,
      planName,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment parameters' },
        { status: 400 }
      );
    }

    // --- Verify Razorpay signature ---
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig.length !== razorpay_signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpay_signature))) {
      console.error('❌ Payment signature mismatch');
      return NextResponse.json(
        { error: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    // --- Create/Update user record ---
    if (!userEmail) {
      return NextResponse.json({ success: true, message: 'Payment verified.' });
    }

    const { user, isNewUser } = await recordPurchase({
      email: userEmail,
      name: userName,
      planName,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
    console.log(`✅ Purchase recorded for ${userEmail}: ${planName}`);

    // --- Create session cookie ---
    const sessionToken = createSessionToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    const cookieString = getSessionCookieString(sessionToken);

    // --- Return response with session cookie ---
    const response = NextResponse.json({
      success: true,
      message: isNewUser
        ? 'Payment verified, account created, and kit assigned.'
        : 'Payment verified and kit assigned.',
    });

    response.headers.set('Set-Cookie', cookieString);
    return response;

  } catch (error: any) {
    console.error('Payment verify error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}
