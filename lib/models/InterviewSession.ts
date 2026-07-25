import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A completed AI interview (turn-based, graded by Gemini). Only finished
 * interviews are persisted — the live turn-by-turn state is held client-side
 * and passed back each request (stateless, serverless-friendly).
 */

export interface IInterviewReportPerQuestion {
    question: string;
    score: number; // 0-100
    feedback: string;
}

export interface IInterviewSession extends Document {
    userId: Types.ObjectId;
    mode: 'role' | 'kit';
    round: string;        // 'react' | 'javascript' | 'machine-coding' | 'hr' | kit slug
    roundLabel: string;   // human label shown in history
    kitSlug?: string;
    /** Which flow produced this session — gates who may grade it. */
    channel: 'text' | 'voice';
    /** The interviewer focus, resolved once at /start so /next & /finish don't re-query. */
    focus: string;
    /** 'active' while in progress; 'completed' once graded; 'abandoned' if ended with no answers. */
    status: 'active' | 'completed' | 'abandoned';
    turns: { question: string; answer: string }[];
    report: {
        overallScore: number; // 0-100
        summary: string;
        perQuestion: IInterviewReportPerQuestion[];
        strengths: string[];
        improvements: string[];
        recommendedTopics: string[];
    };
    createdAt: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>({
    userId: { type: Schema.Types.ObjectId, ref: 'CompanyKitUser', required: true },
    mode: { type: String, enum: ['role', 'kit'], required: true },
    round: { type: String, required: true },
    roundLabel: { type: String, default: '' },
    kitSlug: { type: String },
    channel: { type: String, enum: ['text', 'voice'], default: 'text' },
    focus: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    turns: [{
        question: { type: String, default: '' },
        answer: { type: String, default: '' },
    }],
    report: {
        overallScore: { type: Number, default: 0 },
        summary: { type: String, default: '' },
        perQuestion: [{
            question: { type: String, default: '' },
            score: { type: Number, default: 0 },
            feedback: { type: String, default: '' },
        }],
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        recommendedTopics: [{ type: String }],
    },
    createdAt: { type: Date, default: Date.now },
});

InterviewSessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.InterviewSession ||
    mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
