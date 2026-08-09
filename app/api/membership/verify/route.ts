import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { getMembershipPlan } from '@/lib/membership';
import { grantMembership } from '@/lib/membership-access';
import { logActivity } from '@/lib/activity';

/**
 * POST /api/membership/verify
 *
 * The client-side callback after Razorpay's widget succeeds. Grants the
 * membership immediately so the dashboard unlocks without waiting on the
 * webhook, which can take seconds and may be delayed much longer.
 *
 * BOTH this and the webhook call grantMembership(), on purpose. Either alone is
 * insufficient: this one can be lost (the buyer closes the tab the moment the
 * payment succeeds), and the webhook alone leaves someone staring at a locked
 * dashboard right after paying. Double delivery is safe because grantMembership
 * claims a Membership row keyed by the unique `orderId` before touching the
 * expiry, so whichever arrives second is a no-op rather than a second free term.
 *
 * The CONFIRMATION EMAIL is not sent here — the webhook owns it, matching the
 * kit onboarding email and recordRedemption(). One owner, no race.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
            await request.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
        }

        /* Signature check FIRST. Everything after this point trusts that the
         * payment is real; nothing before it may write. Same construction as
         * /api/payment/verify, including the length guard — timingSafeEqual
         * throws on a length mismatch rather than returning false. */
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (
            expectedSig.length !== razorpay_signature.length ||
            !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpay_signature))
        ) {
            console.error('❌ Membership signature mismatch');
            return NextResponse.json(
                { error: 'Payment verification failed — invalid signature' },
                { status: 400 }
            );
        }

        const plan = getMembershipPlan(String(planId || ''));
        if (!plan) {
            return NextResponse.json({ error: 'Invalid membership plan' }, { status: 400 });
        }

        await connectToDatabase();

        const user = (await CompanyKitUser.findById(session.id)
            .select('email name')
            .lean()) as { email: string; name?: string } | null;
        if (!user) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        /* Granted to the SESSION's user id, never to anything in the body.
         * The signature proves a payment happened; it does not prove who it was
         * for, so the account credited is the one making this authenticated
         * request. */
        const result = await grantMembership({
            userId: session.id,
            email: user.email,
            plan,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            // The plan's catalogue price, not a client-supplied amount — this
            // figure only feeds reporting, but it should still be ours.
            amount: plan.price,
        });

        await logActivity({
            session: { id: String(session.id), email: user.email, name: user.name || '' },
            event: 'purchase',
            path: '/membership',
            meta: { planName: plan.name, paymentId: razorpay_payment_id, membership: true },
        });

        return NextResponse.json({
            success: true,
            expiresAt: result.expiresAt,
            // True when the webhook beat us to it — not an error, and the client
            // shows the same success state either way.
            alreadyGranted: result.alreadyGranted,
        });
    } catch (error: any) {
        console.error('Membership verify error:', error.message);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
