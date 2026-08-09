import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * DsaProgress — a learner's ticks across the whole DSA sheet.
 *
 * SHAPE: one document per USER (not per user-per-sheet), holding a
 * problemId → state map. Two reasons, both load-bearing:
 *
 *  1. The tracker renders every section's counts on open, so it needs all ~155
 *     entries in one read. A row-per-problem collection would be a 155-document
 *     fan-out on every page view. Same trade RoadmapProgress makes.
 *
 *  2. Keyed by PROBLEM, not by (sheet, problem). If a second sheet ever ships —
 *     a company-specific list, a 30-day sprint — a problem appearing in both is
 *     the SAME problem, and someone who solved it once should see it ticked
 *     everywhere. Scoping progress to a sheet would split one learner's history
 *     into parallel copies that silently disagree.
 *
 * ⚠️  `problems` keys are written into a Mongo update path
 * (`problems.<id>.status`). A key containing a dot or `$` would be interpreted
 * as a path or an operator, so the API only ever writes an id it has first
 * matched against the authored catalogue via `getProblem()` — never a raw value
 * from the request body. Ids are additionally constrained to [a-z0-9-] and that
 * is enforced by `npm run test:dsa`.
 *
 * `pending` is the absence of a key, never a stored value: clearing a tick
 * unsets it, so an untouched sheet costs no storage.
 */

export type DsaStoredStatus = 'attempted' | 'solved';

/** One problem's state. Absent fields mean "never happened". */
export interface DsaProblemState {
    status: DsaStoredStatus;
    /**
     * Starred by the learner.
     *
     * Deliberately a plain FAVOURITE and not a "flagged for revision" state.
     * The earlier framing asked the learner to classify their own future study
     * intent at the moment they were least able to judge it, and nothing in the
     * product ever consumed the distinction — a starred problem and a
     * revise-this problem were filtered identically. A star means "I want to
     * find this again", which is a question people can answer instantly.
     *
     * Independent of `status`: you star things you solved (a neat trick worth
     * remembering) and things you did not (come back to this one).
     */
    favourite?: boolean;
    /**
     * When the problem was FIRST solved.
     *
     * ⚠️  Written with `$min`, never `$set`, so re-ticking a solved problem
     * cannot rewrite the day you actually cracked it. For `$min` to work the
     * field must be ABSENT — not null — until the first solve, since `$min`
     * will not overwrite a stored null. Never add a `default: null` here.
     * (Same rule as `savedJobs.appliedAt`; it was learned there first.)
     */
    solvedAt?: Date;
    /** First time the problem was opened on LeetCode. Also `$min`. */
    attemptedAt?: Date;
}

export interface IDsaProgress extends Document {
    userId: Types.ObjectId;
    problems: Record<string, DsaProblemState>;
    createdAt: Date;
    updatedAt: Date;
}

const DsaProgressSchema = new Schema<IDsaProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'CompanyKitUser',
            required: true,
            unique: true,
        },
        // Mixed, not a Map: read far more often than written, and this
        // serialises straight to JSON for the client with no conversion.
        problems: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export default mongoose.models.DsaProgress ||
    mongoose.model<IDsaProgress>('DsaProgress', DsaProgressSchema);
