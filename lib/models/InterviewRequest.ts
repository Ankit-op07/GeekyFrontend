import mongoose, { Schema, Document, Types } from 'mongoose';

export type InterviewStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface IInterviewRequest extends Document {
    userId: Types.ObjectId;
    studentName: string;
    studentEmail: string;
    kit: string;
    interviewType: string;
    preferredTime: Date;
    durationMinutes: 30 | 45 | 60;
    status: InterviewStatus;
    meetingLink?: string;
    adminNotes?: string;
    report?: {
        rating?: number;
        summary?: string;
        strengths?: string;
        improvements?: string;
        nextSteps?: string;
        resources?: string;
        submittedAt?: Date;
    };
    decidedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InterviewRequestSchema = new Schema<IInterviewRequest>({
    userId: { type: Schema.Types.ObjectId, ref: 'CompanyKitUser', required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true, index: true },
    kit: { type: String, required: true, default: 'React' },
    interviewType: { type: String, required: true, default: 'React Interview' },
    preferredTime: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, enum: [30, 45, 60], required: true, default: 30 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending',
        index: true,
    },
    meetingLink: { type: String },
    adminNotes: { type: String },
    report: {
        rating: { type: Number, min: 1, max: 10 },
        summary: { type: String },
        strengths: { type: String },
        improvements: { type: String },
        nextSteps: { type: String },
        resources: { type: String },
        submittedAt: { type: Date },
    },
    decidedAt: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });

InterviewRequestSchema.index({ status: 1, preferredTime: 1 });
InterviewRequestSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.InterviewRequest || mongoose.model<IInterviewRequest>('InterviewRequest', InterviewRequestSchema);
