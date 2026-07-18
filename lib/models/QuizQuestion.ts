import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * PRD-005 — an authored quiz question, stored in the DB (not the static seed).
 *
 * This is the scalable home for questions: editable from the admin UI, generated
 * in bulk by AI (status:'draft' → human review → 'live'), and attached to a
 * specific topic. The learner-facing API reads only status:'live' questions.
 *
 * Shape mirrors the static Phase-0 seed so migration is 1:1, but adds the fields
 * scaling needs: explicit topic association, provenance, review status, and a
 * `verified` flag set by whichever QA gate applies to the question's `type`.
 *
 * `type` is the PRD §3 Seam-2 discriminator — adding a type is additive:
 *
 *   • 'predict-output' — a JS snippet + "what does this log?". Verifiable by
 *     EXECUTION (lib/quiz/verify-output runs it and compares), which is proof.
 *     Only fits the ~10-20 topics that are runnable plain JS.
 *   • 'concept'        — a 4-option question drawn from the lesson prose. No
 *     code to run, so it cannot be proven the same way; it earns `verified` via
 *     independent-solver agreement (a second author answers it blind from the
 *     lesson and agrees). Weaker evidence than execution — hence `verifiedBy`,
 *     so a reviewer can tell the two apart rather than trusting one bit.
 *
 * The learner-facing API reads only status:'live' questions and never ships the
 * answer key.
 */
export type QuizQuestionType = 'predict-output' | 'concept';
export type QuizStatus = 'draft' | 'live' | 'archived';
export type QuizSource = 'manual' | 'ai' | 'seed';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
/** How `verified` was earned. 'vm' is proof; 'peer' is corroboration. */
export type QuizVerifiedBy = 'vm' | 'peer';

export interface IQuizQuestion extends Document {
    kitId: Types.ObjectId;
    topicId?: Types.ObjectId; // optional → question applies kit-wide
    type: QuizQuestionType;
    prompt: string;
    /** The snippet for 'predict-output'. Empty for 'concept' — there is nothing to run. */
    code: string;
    language: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: QuizDifficulty;
    tags: string[];
    status: QuizStatus;
    source: QuizSource;
    /** true once the answer was corroborated — see `verifiedBy` for how. */
    verified: boolean;
    /** 'vm' = the snippet was executed and matched. 'peer' = a blind solver agreed. */
    verifiedBy?: QuizVerifiedBy;
    /** why verification passed/failed/could-not-run — for the admin review queue. */
    verifyNote?: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
    {
        kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
        topicId: { type: Schema.Types.ObjectId, ref: 'Topic', index: true },
        type: { type: String, enum: ['predict-output', 'concept'], default: 'predict-output' },
        prompt: { type: String, required: true },
        // Required only where there is something to run. A 'concept' question is
        // prose + options; forcing a snippet on it would invite decorative code.
        code: {
            type: String,
            default: '',
            required: function (this: { type?: string }) {
                return (this.type ?? 'predict-output') === 'predict-output';
            },
        },
        language: { type: String, default: 'javascript' },
        options: { type: [String], required: true },
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        tags: { type: [String], default: [] },
        status: { type: String, enum: ['draft', 'live', 'archived'], default: 'draft', index: true },
        source: { type: String, enum: ['manual', 'ai', 'seed'], default: 'manual' },
        verified: { type: Boolean, default: false },
        verifiedBy: { type: String, enum: ['vm', 'peer'] },
        verifyNote: { type: String },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Learner read path: live questions for a topic, in order.
QuizQuestionSchema.index({ topicId: 1, status: 1, order: 1 });
// Admin review queue: everything for a kit, newest first.
QuizQuestionSchema.index({ kitId: 1, status: 1, updatedAt: -1 });

export default mongoose.models.QuizQuestion ||
    mongoose.model<IQuizQuestion>('QuizQuestion', QuizQuestionSchema);
