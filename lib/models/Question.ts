import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
    companyId: Types.ObjectId;
    title: string;
    link?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    platform: 'leetcode' | 'gfg' | 'hackerrank' | 'codechef' | 'interviewbit';
    popularity: 'Hot' | 'Very Hot' | 'Warm';
    tags: string[];
    frequency: number;   // 1-100
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true },
    link: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    platform: { type: String, enum: ['leetcode', 'gfg', 'hackerrank', 'codechef', 'interviewbit'], required: true, default: 'leetcode' },
    popularity: { type: String, enum: ['Hot', 'Very Hot', 'Warm'], required: true, default: 'Hot' },
    tags: [{ type: String }],
    frequency: { type: Number, min: 1, max: 100, default: 50 },
}, { timestamps: true });

// Compound index for efficient querying
QuestionSchema.index({ companyId: 1, difficulty: 1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
