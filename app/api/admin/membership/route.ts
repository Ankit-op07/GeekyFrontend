import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Membership from '@/lib/models/Membership';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { requireAdmin } from '@/lib/admin-auth';
import { MEMBERSHIP_PLANS } from '@/lib/membership';

export const runtime = 'nodejs';

/**
 * GET /api/admin/membership — who opted for a membership, and what it earned.
 *
 * TWO DIFFERENT POPULATIONS, and conflating them is the whole trap here:
 *
 *   • `Membership` (the ledger) is one row per PURCHASE. A member who renewed
 *     three times has three rows. This is the source for revenue and for
 *     "how many memberships have we sold".
 *   • `CompanyKitUser.membershipExpiresAt` is per PERSON, and says whether they
 *     are a member *right now*.
 *
 * So "how many people opted for the membership" has two honest answers — total
 * people who ever bought (`peopleEverSubscribed`) and people currently active
 * (`activeNow`) — and this route returns both rather than picking one and
 * calling it "members". Counting ledger rows as people would inflate the number
 * by every renewal.
 *
 * Revenue comes from the ledger's `amount`, which `grantMembership()` writes
 * from the captured Razorpay payment — never from the plan's list price, so a
 * coupon or a price change cannot make these figures lie.
 *
 * Admin-only via requireAdmin(). The client-side check in app/admin/layout.tsx
 * hides the nav link; it is not a gate, so the gate is here.
 */
export async function GET(request: NextRequest) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const now = new Date();

        const [
            totalPurchases,
            peopleEverSubscribed,
            activeNow,
            lapsed,
            revenueAgg,
            byPlan,
            recent,
            expiringSoon,
            renewalAgg,
        ] = await Promise.all([
            // Every membership ever sold, renewals included.
            Membership.countDocuments({}),

            // DISTINCT people — the honest answer to "how many opted in".
            Membership.distinct('userId').then((ids) => ids.length),

            // Active means: set and in the future. No status column to drift.
            CompanyKitUser.countDocuments({ membershipExpiresAt: { $gt: now } }),

            // Had one, does not now. The win-back list.
            CompanyKitUser.countDocuments({
                membershipExpiresAt: { $exists: true, $lte: now },
            }),

            Membership.aggregate<{ _id: null; total: number }>([
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),

            // Which term people actually choose — the only real signal on
            // whether the price ladder is working.
            Membership.aggregate<{ _id: string; count: number; revenue: number }>([
                { $group: { _id: '$planId', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
            ]),

            Membership.find({})
                .sort({ createdAt: -1 })
                .limit(100)
                .select('email planId planName months amount expiresAt previousExpiresAt createdAt')
                .lean(),

            // Active memberships ending within 14 days, soonest first.
            CompanyKitUser.find({
                membershipExpiresAt: {
                    $gt: now,
                    $lte: new Date(now.getTime() + 14 * 86_400_000),
                },
            })
                .sort({ membershipExpiresAt: 1 })
                .limit(50)
                .select('name email membershipExpiresAt membershipPlanId')
                .lean(),

            /* Renewals = purchases that extended a term still running.
             * `previousExpiresAt` is written by grantMembership() as the expiry
             * BEFORE that purchase, so a row whose previous expiry was still in
             * the future at the time is unambiguously a renewal rather than a
             * fresh signup or a win-back. This is the retention number. */
            Membership.countDocuments({
                previousExpiresAt: { $ne: null },
                $expr: { $gt: ['$previousExpiresAt', '$createdAt'] },
            }),
        ]);

        // Keyed by plain string: `byPlan._id` comes from the DB and may hold a
        // retired plan id that is no longer in the MembershipPlanId union.
        const knownPlanIds = new Set<string>(MEMBERSHIP_PLANS.map((p) => p.id));
        const planRows = MEMBERSHIP_PLANS.map((p) => {
            const row = byPlan.find((b) => b._id === p.id);
            return {
                id: p.id,
                label: p.label,
                price: p.price,
                months: p.months,
                count: row?.count ?? 0,
                revenue: row?.revenue ?? 0,
            };
        });

        // Plan ids present in the ledger but no longer in the catalogue — a
        // retired tier still has real revenue and must not vanish from the total.
        const retired = byPlan
            .filter((b) => !knownPlanIds.has(b._id))
            .map((b) => ({
                id: b._id,
                label: `${b._id} (retired)`,
                price: 0,
                months: 0,
                count: b.count,
                revenue: b.revenue,
            }));

        const revenue = revenueAgg[0]?.total ?? 0;

        return NextResponse.json({
            summary: {
                /** Distinct people who have ever bought a membership. */
                peopleEverSubscribed,
                /** Members right now. */
                activeNow,
                /** Had one, expired, not renewed. */
                lapsed,
                /** Memberships sold, renewals included. Always ≥ people. */
                totalPurchases,
                renewals: renewalAgg,
                revenue,
                /** ₹ per purchase. Guarded — a fresh install has zero rows. */
                averageOrderValue: totalPurchases ? Math.round(revenue / totalPurchases) : 0,
                /**
                 * Of everyone who ever joined, how many are still in.
                 *
                 * CLAMPED to 100 on purpose. The numerator counts anyone whose
                 * `membershipExpiresAt` is in the future, and the denominator
                 * counts distinct people in the ledger — so a membership granted
                 * WITHOUT a ledger row (a manual admin fix, a support comp)
                 * inflates the numerator only and can push this above 100%.
                 * "142% retention" on an admin dashboard destroys trust in every
                 * other number on the page, so the impossible value never ships;
                 * the discrepancy is visible anyway as activeNow > everSubscribed.
                 */
                retentionPercent: peopleEverSubscribed
                    ? Math.min(100, Math.round((activeNow / peopleEverSubscribed) * 100))
                    : 0,
            },
            plans: [...planRows, ...retired],
            expiringSoon: expiringSoon.map((u: any) => ({
                name: u.name || '—',
                email: u.email,
                planId: u.membershipPlanId || null,
                expiresAt: u.membershipExpiresAt,
                daysLeft: Math.ceil(
                    (new Date(u.membershipExpiresAt).getTime() - now.getTime()) / 86_400_000
                ),
            })),
            recent: recent.map((m: any) => ({
                email: m.email,
                planId: m.planId,
                planName: m.planName,
                months: m.months,
                amount: m.amount,
                expiresAt: m.expiresAt,
                // True when this purchase extended a term that was still live.
                isRenewal: Boolean(
                    m.previousExpiresAt && new Date(m.previousExpiresAt) > new Date(m.createdAt)
                ),
                createdAt: m.createdAt,
            })),
        });
    } catch (error: any) {
        console.error('Admin membership stats error:', error.message);
        return NextResponse.json({ error: 'Failed to load membership stats' }, { status: 500 });
    }
}
