import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKit extends Document {
    name: string;
    slug: string;
    description: string;
    icon: string;       // emoji or image URL
    color: string;      // tailwind gradient e.g. "from-yellow-500 to-orange-500"
    order: number;
    purchasesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const KitSchema = new Schema<IKit>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '📚' },
    color: { type: String, default: 'from-violet-500 to-purple-500' },
    order: { type: Number, default: 0 },
    purchasesCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Kit || mongoose.model<IKit>('Kit', KitSchema);
