import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { extractSessionFromRequest } from '@/lib/session';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { resolveMembership } from '@/lib/membership-access';
import { MEMBERSHIP_PLANS, membershipSavings } from '@/lib/membership';

/**
 * GET /api/membership/status
 *
 * The client's view of "am I a member, and what can I buy". Also serves the
 * plan catalogue so prices exist in exactly one place — the server. A page that
 * hardcodes ₹499 drifts the day the price changes, and the drift is invisible
 * until someone is charged a different number than they were shown.
 *
 * Public: a signed-out visitor gets `active: false` plus the plans, which is
 * what the marketing page needs. Nothing here is per-user unless there is a
 * session to key it to.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);

        const plans = MEMBERSHIP_PLANS.map((p) => ({
            id: p.id,
            label: p.label,
            price: p.price,
            months: p.months,
            tagline: p.tagline,
            highlight: Boolean(p.highlight),
            /** ₹ saved against paying monthly for the same period. 0 for the
             *  monthly plan itself, so the UI can just hide the badge. */
            savings: membershipSavings(p),
            perMonth: Math.round(p.price / p.months),
        }));

        if (!session) {
            return NextResponse.json({
                signedIn: false,
                active: false,
                expiresAt: null,
                daysRemaining: 0,
                planId: null,
                plans,
            });
        }

        await connectToDatabase();
        const status = await resolveMembership(session.id);

        /* The member card renders a name, a term and a "member since" date, so
         * those come back here rather than being assembled from three requests.
         * Only read for a signed-in caller, and only ever their own row. */
        const user = (await CompanyKitUser.findById(session.id)
            .select('name membershipStartedAt')
            .lean()) as { name?: string; membershipStartedAt?: Date } | null;

        const plan = status.planId ? MEMBERSHIP_PLANS.find((p) => p.id === status.planId) : null;

        return NextResponse.json({
            signedIn: true,
            active: status.active,
            expiresAt: status.expiresAt,
            daysRemaining: status.daysRemaining,
            planId: status.planId,
            planLabel: plan?.label ?? null,
            /** First membership ever — written with $min, so renewals never move it. */
            memberSince: user?.membershipStartedAt ?? null,
            name: user?.name ?? null,
            plans,
        });
    } catch (error: any) {
        console.error('Membership status error:', error.message);
        return NextResponse.json({ error: 'Failed to load membership status' }, { status: 500 });
    }
}
