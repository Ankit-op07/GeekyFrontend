import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CouponModel from '@/lib/models/Coupon';
import CouponRedemption from '@/lib/models/CouponRedemption';
import { requireAdmin, getAdminSession } from '@/lib/admin-auth';
import { getPurchasableKits } from '@/lib/appConstants';
import { normaliseCode, MAX_PERCENT, MIN_PAYABLE } from '@/lib/coupon-math';
import { validateCouponPayload } from '@/lib/coupon-admin';

export const runtime = 'nodejs';

/**
 * Admin coupon management.
 *
 *   GET  /api/admin/coupons        list every coupon + its live performance
 *   POST /api/admin/coupons        create one
 *
 * Admin-only via requireAdmin(). Note that nothing here can change what a
 * buyer is charged directly — it edits the RULES, and lib/pricing.ts applies
 * them. Counters (timesUsed / revenue / discountGiven) are never writable from
 * here; recordRedemption() is their only writer, so the numbers on this page
 * are always derived from real captured payments.
 */

export async function GET(request: NextRequest) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();

        const coupons = await CouponModel.find({}).sort({ createdAt: -1 }).limit(200).lean();

        // Recent activity, for the "who used what" table. One query, joined in
        // memory — the volumes here are small and an aggregation would be
        // harder to read for no measurable gain.
        const redemptions = await CouponRedemption.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const now = Date.now();
        const enriched = coupons.map((c: any) => {
            const expired = c.validUntil ? new Date(c.validUntil).getTime() < now : false;
            const pending = c.validFrom ? new Date(c.validFrom).getTime() > now : false;
            const exhausted = c.maxRedemptions != null && c.timesUsed >= c.maxRedemptions;
            return {
                ...c,
                status: !c.active
                    ? 'paused'
                    : expired
                        ? 'expired'
                        : pending
                            ? 'scheduled'
                            : exhausted
                                ? 'exhausted'
                                : 'live',
            };
        });

        return NextResponse.json({
            coupons: enriched,
            redemptions,
            kits: getPurchasableKits().map((k) => ({ id: k.id, name: k.displayName ?? k.name, price: k.price })),
            limits: { maxPercent: MAX_PERCENT, minPayable: MIN_PAYABLE },
        });
    } catch (error: any) {
        console.error('Failed to list coupons:', error.message);
        return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        const body = await request.json();
        const invalid = validateCouponPayload(body);
        if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

        await connectToDatabase();
        const code = normaliseCode(body.code);

        const existing = await CouponModel.findOne({ code }).select('_id').lean();
        if (existing) {
            return NextResponse.json({ error: `Coupon ${code} already exists.` }, { status: 409 });
        }

        const admin = getAdminSession(request);
        const coupon = await CouponModel.create({
            code,
            description: String(body.description ?? '').slice(0, 200),
            kind: body.kind,
            value: Math.floor(Number(body.value)),
            maxDiscount: body.maxDiscount ? Math.floor(Number(body.maxDiscount)) : null,
            appliesTo: Array.isArray(body.appliesTo) ? body.appliesTo : [],
            minOrderValue: Math.floor(Number(body.minOrderValue) || 0),
            maxRedemptions: body.maxRedemptions ? Math.floor(Number(body.maxRedemptions)) : null,
            maxPerUser: Math.floor(Number(body.maxPerUser) || 1),
            firstPurchaseOnly: !!body.firstPurchaseOnly,
            stacksWithCredit: body.stacksWithCredit !== false,
            validFrom: body.validFrom ? new Date(body.validFrom) : null,
            validUntil: body.validUntil ? new Date(body.validUntil) : null,
            active: body.active !== false,
            autoApply: !!body.autoApply,
            promoted: !!body.promoted,
            campaign: body.campaign ? String(body.campaign).slice(0, 60) : undefined,
            createdBy: admin?.email,
        });

        return NextResponse.json({ coupon }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create coupon:', error.message);
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
}
