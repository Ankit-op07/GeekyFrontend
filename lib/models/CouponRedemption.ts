import mongoose, { Schema, Document } from 'mongoose';

/**
 * One captured payment that used a coupon.
 *
 * This collection is the ledger, not a log:
 *   • the per-user limit is a count of rows for (code, email);
 *   • the global limit is Coupon.timesUsed, incremented in lockstep with an
 *     insert here;
 *   • `orderId` is UNIQUE, which is the whole idempotency story — Razorpay
 *     delivers `payment.captured` more than once, and /api/payment/verify races
 *     the webhook for the same order. Both call recordRedemption(); the second
 *     one loses the upsert and increments nothing.
 *
 * Rows are written only AFTER a signature-verified capture, so a row existing
 * means the discount was really given on money really taken.
 */
export interface ICouponRedemption extends Document {
    code: string;
    couponId: mongoose.Types.ObjectId;
    email: string;
    kitId: string;
    planName: string;
    /** Razorpay order id — one redemption per order, enforced by a unique index. */
    orderId: string;
    paymentId?: string;

    listPrice: number;
    /** Upgrade credit applied before the coupon, in ₹. */
    credit: number;
    /** ₹ the coupon took off. */
    discount: number;
    /** ₹ actually charged. */
    amountPaid: number;

    /**
     * True when this redemption pushed the coupon past its global cap — only
     * possible under a race between two concurrent checkouts. We honour the
     * payment (the money is already taken) and flag the row so the admin can
     * see it rather than silently overselling a limited campaign.
     */
    overLimit: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const CouponRedemptionSchema = new Schema<ICouponRedemption>(
    {
        code: { type: String, required: true, uppercase: true, trim: true, index: true },
        couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        kitId: { type: String, required: true },
        planName: { type: String, default: '' },
        orderId: { type: String, required: true, unique: true, index: true },
        paymentId: { type: String },

        listPrice: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        amountPaid: { type: Number, default: 0 },

        overLimit: { type: Boolean, default: false },
    },
    { timestamps: true },
);

// The per-user cap check: count rows for this (code, email).
CouponRedemptionSchema.index({ code: 1, email: 1 });

export default (mongoose.models.CouponRedemption as mongoose.Model<ICouponRedemption>) ||
    mongoose.model<ICouponRedemption>('CouponRedemption', CouponRedemptionSchema);
