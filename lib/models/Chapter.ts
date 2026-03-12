import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChapter extends Document {
    kitId: Types.ObjectId;
    title: string;
    slug: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>({
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index: slug unique within a kit
ChapterSchema.index({ kitId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Chapter || mongoose.model<IChapter>('Chapter', ChapterSchema);
