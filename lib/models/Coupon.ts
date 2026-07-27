import mongoose, { Schema, Document } from 'mongoose';
import type { CouponKind } from '@/lib/coupon-math';

/**
 * A discount code / offer.
 *
 * ⚠️  A row here is money. Everything that decides whether it applies lives on
 * the row and is evaluated SERVER-SIDE in lib/coupons.ts — the client only ever
 * sends a code string. See lib/coupons.ts for the validation order.
 *
 * `timesUsed` is incremented exactly once per captured payment, by
 * recordRedemption(), guarded by the unique index on CouponRedemption.orderId.
 */
export interface ICoupon extends Document {
    /** UPPERCASE, no spaces — normaliseCode() is the only writer. */
    code: string;
    /** Shown to the buyer when the code applies ("Launch week — 30% off"). */
    description: string;
    kind: CouponKind;
    /** percent → 1..90, flat → ₹ off. */
    value: number;
    /** Cap on a percent discount, in ₹. null = uncapped. */
    maxDiscount: number | null;

    /** Catalog kit ids this applies to. EMPTY = every purchasable kit. */
    appliesTo: string[];
    /** Minimum post-credit bill, in ₹, for the code to be usable. */
    minOrderValue: number;

    /** Global redemption cap. null = unlimited. */
    maxRedemptions: number | null;
    /** Per-email redemption cap. Always ≥ 1. */
    maxPerUser: number;
    timesUsed: number;

    /** Only valid for an email with no prior purchase. */
    firstPurchaseOnly: boolean;
    /** When false the code is refused if the buyer has upgrade credit applied. */
    stacksWithCredit: boolean;

    validFrom: Date | null;
    validUntil: Date | null;
    active: boolean;

    /** Applied automatically — the buyer never has to type it. */
    autoApply: boolean;
    /** Advertised publicly (offer banners, checkout hint). */
    promoted: boolean;

    /** Free-text grouping for reporting ("instagram-oct", "abandoned-cart"). */
    campaign?: string;
    createdBy?: string;

    /** Sum of what buyers actually PAID on orders using this code, in ₹. */
    revenue: number;
    /** Sum of ₹ given away by this code. */
    discountGiven: number;

    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
        description: { type: String, default: '' },
        kind: { type: String, enum: ['percent', 'flat'], required: true },
        value: { type: Number, required: true, min: 1 },
        maxDiscount: { type: Number, default: null },

        appliesTo: { type: [String], default: [] },
        minOrderValue: { type: Number, default: 0 },

        maxRedemptions: { type: Number, default: null },
        maxPerUser: { type: Number, default: 1, min: 1 },
        timesUsed: { type: Number, default: 0 },

        firstPurchaseOnly: { type: Boolean, default: false },
        stacksWithCredit: { type: Boolean, default: true },

        validFrom: { type: Date, default: null },
        validUntil: { type: Date, default: null },
        active: { type: Boolean, default: true },

        autoApply: { type: Boolean, default: false },
        promoted: { type: Boolean, default: false },

        campaign: { type: String },
        createdBy: { type: String },

        revenue: { type: Number, default: 0 },
        discountGiven: { type: Number, default: 0 },
    },
    { timestamps: true },
);

// The auto-apply lookup runs on every checkout page load and every create-order,
// and only ever asks for live codes.
CouponSchema.index({ active: 1, autoApply: 1, validUntil: 1 });

export default (mongoose.models.Coupon as mongoose.Model<ICoupon>) ||
    mongoose.model<ICoupon>('Coupon', CouponSchema);
