import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITopic extends Document {
    chapterId: Types.ObjectId;
    kitId: Types.ObjectId;
    title: string;
    slug: string;
    content: string;    // markdown content
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>({
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, default: '' },
    order: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index: slug unique within a kit
TopicSchema.index({ kitId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
