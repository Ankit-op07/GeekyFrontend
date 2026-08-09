import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { getMembershipPlan } from '@/lib/membership';
import { resolveMembership } from '@/lib/membership-access';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/membership/create-order
 *
 * Membership has its OWN order route rather than reusing /api/payment/create-order.
 * That route is kit-shaped end to end: it looks the SKU up in KIT_CATALOG, and it
 * prices through computeUpgradePrice(), which credits prior kit spend toward the
 * all-access bundle. Neither applies to a subscription — a membership is not a
 * kit you can already own, and crediting kit purchases against rent would let
 * someone with ₹350 of credit rent the platform for ₹149 every month, forever.
 * Sharing the route would have meant threading "is this a membership" through
 * every branch of both, which is how the kit rules end up applied to rent by
 * accident. The Razorpay call and the webhook that delivers it ARE shared.
 *
 * SIGN-IN REQUIRED, unlike kit checkout, which is deliberately guest-friendly.
 * A membership is time-limited access attached to an account; there is no
 * "deliver it to whatever email you typed" story that works — a typo would sell
 * someone a year of access to an account they cannot log into. Kits can be
 * delivered by email to a new account because they are permanent.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json(
                { error: 'Please sign in to buy a membership.', needsAuth: true },
                { status: 401 }
            );
        }

        const { planId } = await request.json();
        // Match, don't trust — an unknown id is rejected, never defaulted.
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

        // Renewing while still active is allowed and stacks (see
        // computeMembershipExpiry) — surfaced so the client can say
        // "extends your membership to <date>" rather than implying a restart.
        const current = await resolveMembership(session.id);

        const order = await razorpay.orders.create({
            // ₹ → paise, from the server-side catalogue. The client sends an id
            // and nothing about money, so a tampered request cannot change the
            // charge — the same rule as kit checkout.
            amount: plan.price * 100,
            currency: 'INR',
            receipt: `mem_${plan.id}_${Date.now()}`.slice(0, 40),
            notes: {
                /* This key is what the shared webhook branches on. It must be
                 * present, or the payment falls through to the kit path and
                 * recordPurchase() writes a membership name into purchasedKits
                 * — permanent access that no expiry can revoke. */
                membershipPlanId: plan.id,
                planName: plan.name,
                userEmail: user.email,
                userName: user.name || '',
                // The buyer is pinned to the SESSION, not to anything in the
                // body. The webhook grants to this id, so a request cannot
                // direct someone else's payment at its own account.
                userId: String(session.id),
                months: String(plan.months),
            },
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            plan: { id: plan.id, name: plan.name, label: plan.label, price: plan.price },
            prefill: { email: user.email, name: user.name || '' },
            // Display only.
            currentlyActive: current.active,
            currentExpiresAt: current.expiresAt,
        });
    } catch (error) {
        console.error('Membership order error:', error);
        return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
    }
}
