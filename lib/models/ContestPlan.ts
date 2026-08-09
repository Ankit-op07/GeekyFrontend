import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * ContestPlan — "I intend to sit this contest."
 *
 * ⚠️  THIS IS A DENORMALIZED SNAPSHOT, NOT A REFERENCE. `Contest` rows are a
 * cache with a TTL that deletes them six hours after the contest ends, so a
 * plan holding only a fingerprint would empty itself exactly when the learner
 * wanted to look back at what they had planned. The name, url, platform and
 * times are therefore copied onto this row at the moment it is created.
 *
 * The same reasoning already produced `CompanyKitUser.savedJobs`, and for the
 * same reason: a bookmark must outlive the listing it points at.
 *
 * WHAT THIS COSTS: if a platform reschedules a contest, the plan keeps the old
 * time. That is a real trade and it is the right way round — a stale time on a
 * row you can see and delete beats a row that silently vanishes. The ingest
 * refreshes `startsAt` on plans whose contest is still in the cache, so the
 * drift only affects contests that have already left it.
 */

export interface IContestPlan extends Document {
    userId: Types.ObjectId;
    /** `${platform}:${platformId}` — matches Contest.fingerprint. */
    fingerprint: string;

    // ── Snapshot, so the row survives the Contest TTL ──
    platform: string;
    name: string;
    url: string;
    startsAt: Date;
    endsAt: Date;

    /**
     * When the morning-of reminder was emailed.
     *
     * ⚠️  ABSENT until sent — never initialised to null. The cron claims a plan
     * by atomically matching `reminderSentAt: { $exists: false }` and setting
     * it, which is what makes "exactly one email per plan" hold even if two
     * cron invocations overlap. A stored null would match `$exists: true` and
     * silently disable the guard.
     *
     * Same discipline as `savedJobs.appliedAt` and `DsaProgress.solvedAt`.
     */
    reminderSentAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const ContestPlanSchema = new Schema<IContestPlan>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'CompanyKitUser',
            required: true,
        },
        fingerprint: { type: String, required: true },
        platform: { type: String, required: true },
        name: { type: String, required: true },
        url: { type: String, required: true },
        startsAt: { type: Date, required: true },
        endsAt: { type: Date, required: true },
        reminderSentAt: { type: Date },
    },
    { timestamps: true }
);

/** One plan per user per contest. This is what makes the toggle idempotent
 *  against a double-click and against two open tabs. */
ContestPlanSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });

/** Drives the calendar view: one user's plans in date order. */
ContestPlanSchema.index({ userId: 1, startsAt: 1 });

/**
 * Drives the reminder sweep: everything starting soon that has not been mailed.
 *
 * Sparse on `reminderSentAt` would be wrong here — the query looks for its
 * ABSENCE, and a sparse index omits exactly those documents.
 */
ContestPlanSchema.index({ startsAt: 1, reminderSentAt: 1 });

/**
 * Plans are kept for 30 days after the contest ends, then dropped.
 *
 * Long enough to be a short history of what you actually turned up for, short
 * enough that the collection cannot grow without bound. Unlike the Contest
 * cache this is user-authored, so the window is generous rather than hours.
 */
ContestPlanSchema.index({ endsAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.ContestPlan ||
    mongoose.model<IContestPlan>('ContestPlan', ContestPlanSchema);
