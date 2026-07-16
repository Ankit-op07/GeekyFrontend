import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * PRD-005 Phase 0 — records a learner's answer to one quiz question.
 *
 * This is the go/no-go signal: the attempt rate is `distinct userId in this
 * collection ÷ active learners`. The ≥30% gate (§7) decides whether the rest of
 * PRD-005 gets built at all, so every submit writes one row here.
 *
 * FIRST ATTEMPT ONLY
 * ------------------
 * (userId, questionId) is UNIQUE. A repeat submit still grades and reveals for
 * the learner, but does not write a second row. Two reasons:
 *   • Pass rate stays honest. PRD-005 §9 auto-flags questions passing >90% or
 *     <10% as broken or mis-tiered. If re-answering after seeing the correct
 *     option wrote new rows, every question would drift toward 100% and the
 *     flagging would go blind — the QA mechanism would quietly stop working.
 *   • Attempt rate counts people, not clicks.
 *
 * Forward-compatible with the PRD's `Submission` table — when the real engine
 * ships, code submissions extend this shape (add `passed`, `trusted`, `code`,
 * `version`). For Phase 0 an attempt is just a chosen MCQ option.
 */
export interface IQuizAttempt extends Document {
    userId: Types.ObjectId;
    /**
     * String, not ObjectId, deliberately: early rows carry static starter ids
     * ("closure-loop-var") from before questions moved into the DB. Those two
     * legacy rows would fail an ObjectId cast and be lost. New attempts always
     * carry a QuizQuestion _id as a string.
     */
    questionId: string;
    kitId?: Types.ObjectId;
    kitSlug: string;
    topicSlug: string;
    chosenIndex: number;
    correct: boolean;
    /**
     * Had the learner PURCHASED this kit when they attempted, or were they in
     * the free preview?
     *
     * PRD-005 §15 item 2: the Phase-0 gate is only meaningful if it can tell
     * these apart. Path A is a conversion play — it is validated by non-buyers
     * practising, and a 30% attempt rate made entirely of existing customers
     * proves nothing about conversion. This cannot be reconstructed later
     * (users buy, and then their history looks like a buyer's all along), so it
     * is stamped at attempt time.
     */
    hadAccess: boolean;
    createdAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'CompanyKitUser', required: true, index: true },
        questionId: { type: String, required: true, index: true },
        kitId: { type: Schema.Types.ObjectId, ref: 'Kit', index: true },
        kitSlug: { type: String, required: true },
        topicSlug: { type: String, required: true },
        chosenIndex: { type: Number, required: true },
        correct: { type: Boolean, required: true },
        hadAccess: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// One row per user per question — see "FIRST ATTEMPT ONLY" above. The write path
// swallows the duplicate-key error rather than treating it as a failure.
QuizAttemptSchema.index({ userId: 1, questionId: 1 }, { unique: true });
// Per-question pass rate, for the >90% / <10% auto-flagging (PRD-005 §9).
QuizAttemptSchema.index({ questionId: 1, correct: 1 });
// The go/no-go query: attempts in a window, split by buyer vs preview.
QuizAttemptSchema.index({ createdAt: -1, hadAccess: 1 });
// Per-user, per-kit progress ("how many has this learner got right in this kit").
QuizAttemptSchema.index({ userId: 1, kitId: 1, correct: 1 });

export default mongoose.models.QuizAttempt ||
    mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
