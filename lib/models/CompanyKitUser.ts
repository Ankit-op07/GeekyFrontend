import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyKitUser extends Document {
    email: string;
    name: string;
    googleId?: string;
    profilePicture?: string;
    password?: string;
    mobile?: string;
    planId?: string;
    otp?: string;
    otpExpiry?: Date;
    emailVerified?: boolean;
    mustChangePassword?: boolean;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate?: Date;
    subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'none';
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    paymentId?: string;
    orderId?: string;
    purchasedKits: string[];
    completedQuestions: string[];
    favoriteQuestions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const CompanyKitUserSchema = new Schema<ICompanyKitUser>({
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    googleId: { type: String, index: true }, // NOT unique — multiple users can lack a Google ID
    profilePicture: { type: String },
    password: { type: String },
    mobile: { type: String },
    planId: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    emailVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'none'],
        default: 'none'
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    paymentId: { type: String },
    orderId: { type: String },
    purchasedKits: [{ type: String }],
    completedQuestions: [{ type: String }],
    favoriteQuestions: [{ type: String }],
}, { timestamps: true });

// Check if subscription is valid
CompanyKitUserSchema.methods.hasActiveSubscription = function (): boolean {
    if (this.subscriptionStatus !== 'active') return false;
    if (!this.subscriptionEndDate) return false;
    return new Date() < this.subscriptionEndDate;
};

export default mongoose.models.CompanyKitUser || mongoose.model<ICompanyKitUser>('CompanyKitUser', CompanyKitUserSchema);
