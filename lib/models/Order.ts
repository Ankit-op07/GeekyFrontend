import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    orderId: string;
    paymentId: string;
    email: string;
    planName: string;
    amount: number;
    status: 'processing' | 'email_sent' | 'failed';
    errorMessage?: string;
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
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
