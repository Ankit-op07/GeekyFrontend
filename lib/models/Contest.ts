import mongoose, { Schema, Document } from 'mongoose';
import type { ContestPlatform } from '@/lib/contests/types';

/**
 * Contest — a CACHE of upcoming programming contests, not authored data.
 *
 * Every row can be rebuilt by re-running an ingest, so nothing irreplaceable
 * may live here. Same contract as `Job`, and the same consequence: a learner
 * who wants to keep a contest must EXPORT it (the board offers a calendar
 * link), because a reference into this collection would empty itself.
 *
 * ⚠️  ROWS EXPIRE, AND THE TTL IS KEYED ON `endsAt`, NOT ON `startsAt`.
 * A contest is still worth showing while it is running — someone may be
 * mid-round and want the link. Expiring on start would pull the row out from
 * under exactly the person using it. The index therefore deletes a row some
 * hours after the contest ENDS.
 *
 * The other half of the same rule: no feed ever says "this contest is over",
 * it simply stops appearing. So a finished contest is removed by the TTL rather
 * than by any ingest noticing its absence.
 */

export interface IContest extends Document {
    /** `${platform}:${platformId}` — the unique key and the upsert target. */
    fingerprint: string;
    platform: ContestPlatform;
    platformId: string;
    name: string;
    url: string;
    startsAt: Date;
    endsAt: Date;
    durationSeconds: number;
    /** Bumped on every ingest that still sees this contest. Diagnostic only. */
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ContestSchema = new Schema<IContest>(
    {
        fingerprint: { type: String, required: true, unique: true },
        platform: { type: String, required: true, index: true },
        platformId: { type: String, required: true },
        name: { type: String, required: true },
        url: { type: String, required: true },
        startsAt: { type: Date, required: true },
        endsAt: { type: Date, required: true },
        durationSeconds: { type: Number, default: 0 },
        lastSeenAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

/** The board's only sort: soonest first. */
ContestSchema.index({ startsAt: 1 });

/**
 * TTL: drop a contest six hours after it ends.
 *
 * The grace period is deliberate. A contest that finished twenty minutes ago is
 * still the thing a learner is looking for — they want the editorial link, or
 * to check they had the right one. Expiring exactly at `endsAt` would make the
 * board forget a round the moment it mattered most.
 */
ContestSchema.index({ endsAt: 1 }, { expireAfterSeconds: 6 * 60 * 60 });

export default mongoose.models.Contest ||
    mongoose.model<IContest>('Contest', ContestSchema);
