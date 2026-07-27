import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import CouponModel from '@/lib/models/Coupon';
import CouponRedemption from '@/lib/models/CouponRedemption';
import { requireAdmin } from '@/lib/admin-auth';
import { validateCouponPayload } from '@/lib/coupon-admin';

export const runtime = 'nodejs';

/**
 * PATCH  /api/admin/coupons/:id   edit a coupon (including pause/resume)
 * DELETE /api/admin/coupons/:id   remove a coupon that was never used
 *
 * The counters (timesUsed, revenue, discountGiven) are intentionally NOT
 * patchable. They are a ledger of captured payments written only by
 * recordRedemption(); letting an admin hand-edit them would make every number
 * on the coupons page unfalsifiable.
 */

/** Fields an admin may change. Anything else in the body is ignored. */
const EDITABLE = [
    'description',
    'kind',
    'value',
    'maxDiscount',
    'appliesTo',
    'minOrderValue',
    'maxRedemptions',
    'maxPerUser',
    'firstPurchaseOnly',
    'stacksWithCredit',
    'validFrom',
    'validUntil',
    'active',
    'autoApply',
    'promoted',
    'campaign',
] as const;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        const { id } = await context.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 });
        }

        await connectToDatabase();
        const existing = await CouponModel.findById(id);
        if (!existing) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

        const body = await request.json();

        // Validated against the STORED kind, so an edit that changes only the
        // value still gets the percent cap applied.
        const invalid = validateCouponPayload(body, { partial: true, kind: existing.kind });
        if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

        /* The code itself is immutable. Redemptions, orders and Razorpay notes
         * all reference a coupon BY CODE, so renaming one would orphan its
         * history and silently break any link already shared with buyers.
         * Retire it and create a new one instead. */
        for (const key of EDITABLE) {
            if (body[key] === undefined) continue;
            switch (key) {
                case 'maxDiscount':
                case 'maxRedemptions':
                    // Blank means "no limit", which is null — not 0, which would
                    // read as a coupon that can never be used.
                    (existing as any)[key] = body[key] === '' || body[key] === null
                        ? null
                        : Math.floor(Number(body[key]));
                    break;
                case 'validFrom':
                case 'validUntil':
                    (existing as any)[key] = body[key] ? new Date(body[key]) : null;
                    break;
                case 'value':
                case 'minOrderValue':
                case 'maxPerUser':
                    (existing as any)[key] = Math.floor(Number(body[key]));
                    break;
                case 'description':
                    existing.description = String(body[key]).slice(0, 200);
                    break;
                case 'campaign':
                    existing.campaign = String(body[key]).slice(0, 60);
                    break;
                default:
                    (existing as any)[key] = body[key];
            }
        }

        await existing.save();
        return NextResponse.json({ coupon: existing.toObject() });
    } catch (error: any) {
        console.error('Failed to update coupon:', error.message);
        return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        const { id } = await context.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 });
        }

        await connectToDatabase();
        const coupon = await CouponModel.findById(id);
        if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

        /* A used coupon is never deleted — its redemptions point at it, and an
         * accounting row whose coupon has vanished cannot be explained later.
         * Deactivating stops it working immediately, which is what "delete"
         * actually means to the person clicking it. */
        const used = await CouponRedemption.countDocuments({ code: coupon.code });
        if (used > 0 || coupon.timesUsed > 0) {
            coupon.active = false;
            await coupon.save();
            return NextResponse.json({
                deactivated: true,
                message: `${coupon.code} has ${used || coupon.timesUsed} redemption(s), so it was paused instead of deleted — its history stays intact.`,
            });
        }

        await coupon.deleteOne();
        return NextResponse.json({ deleted: true });
    } catch (error: any) {
        console.error('Failed to delete coupon:', error.message);
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
}
