import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    orderId: string;
    paymentId: string;
    email: string;
    planName: string;
    /** What was actually charged, in PAISE (Razorpay's payment.amount, verbatim). */
    amount: number;
    status: 'processing' | 'email_sent' | 'failed';
    errorMessage?: string;

    /* ── Discount attribution (optional; absent on every pre-coupon order) ──
     * Kept in ₹, unlike `amount`, because that is how the coupon system and
     * every admin report denominate money. Purely for reporting — access and
     * upgrade credit are derived from `amount`, never from these. */
    couponCode?: string;
    /** ₹ the coupon took off. */
    discount?: number;
    /** ₹ catalog price at the time of sale. */
    listPrice?: number;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, required: true },
    email: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['processing', 'email_sent', 'failed'],
        default: 'processing'
    },
    errorMessage: { type: String },

    couponCode: { type: String, uppercase: true, trim: true, index: true, sparse: true },
    discount: { type: Number },
    listPrice: { type: Number },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
