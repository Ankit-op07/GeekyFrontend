import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * One row per membership PURCHASE — the ledger behind `membershipExpiresAt`.
 *
 * The expiry on CompanyKitUser is a running total, and a running total with no
 * ledger cannot answer the questions support actually gets: "I paid twice in
 * March, did both apply?", "when did my year start?", "why does it say I expire
 * in August?". Each row records the term it bought, so the user's expiry is
 * always reconstructible from history rather than being the only copy.
 *
 * IDEMPOTENCY: `orderId` is unique. Razorpay retries webhooks, and the client
 * verify callback can race the webhook for the same payment — without this,
 * one payment could extend a membership twice. The grant path claims the row
 * FIRST and only extends the expiry if the insert won, so a duplicate delivery
 * is a no-op rather than a free extra term. This mirrors CouponRedemption.
 */
export interface IMembership extends Document {
    userId: Types.ObjectId;
    email: string;
    planId: string;
    /** Canonical plan name, verbatim from the Razorpay notes. */
    planName: string;
    months: number;
    /** ₹ actually captured. */
    amount: number;
    orderId: string;
    paymentId: string;
    /** Expiry BEFORE this purchase — null if they had none or it had lapsed. */
    previousExpiresAt?: Date | null;
    /** Expiry AFTER this purchase. */
    expiresAt: Date;
    createdAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'CompanyKitUser', required: true, index: true },
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        planId: { type: String, required: true },
        planName: { type: String, required: true },
        months: { type: Number, required: true },
        amount: { type: Number, required: true },
        // The idempotency key. See the header — this is what makes a webhook
        // retry safe.
        orderId: { type: String, required: true, unique: true },
        paymentId: { type: String, required: true },
        previousExpiresAt: { type: Date, default: null },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Admin: this user's membership history, newest first.
MembershipSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Membership ||
    mongoose.model<IMembership>('Membership', MembershipSchema);
