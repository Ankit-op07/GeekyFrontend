import mongoose, { Schema, Document } from 'mongoose';
import type { EmploymentType, JobCategory, JobLevel, JobSource } from '@/lib/jobs/types';

/**
 * Job — one opening on the dashboard job board.
 *
 * This is a CACHE of external feeds, not user data. Nothing here is authored:
 * every row was fetched from an upstream source by `ingestJobs()` and can be
 * rebuilt by running a refresh. Two consequences shape the schema:
 *
 *  • **The unique key is `fingerprint`, not `sourceId`.** The same opening is
 *    posted to RemoteOK, Remotive AND the company's own Greenhouse board. The
 *    board must show it once. So the upsert is keyed on the cross-source
 *    fingerprint (company+title+locality) and `sourceIds` accumulates every
 *    feed the row was seen in — which doubles as a credibility signal.
 *
 *  • **Rows expire.** External feeds never tell us a job closed; it just stops
 *    appearing. `expiresAt` is pushed forward on every refresh that still sees
 *    the job, and a TTL index deletes it once refreshes stop finding it. A job
 *    board whose listings are dead links is worse than no job board.
 */

export const JOB_TTL_DAYS = 21;

export interface IJob extends Document {
    fingerprint: string;
    /** Every `${source}:${externalId}` this opening was seen under. */
    sourceIds: string[];
    sources: JobSource[];
    /** How many feeds carried this opening in the LAST run. Not `sources.length`
     *  — that set only ever grows, while this decays as feeds drop the job,
     *  which is exactly the signal the "most relevant" sort wants. */
    sourceCount: number;

    title: string;
    company: string;
    companyLogo?: string;
    applyUrl: string;

    location: string;
    isRemote: boolean;
    countryCode?: string;
    /** Indian metro or 'Remote'. The board's location filter. */
    city?: string;

    employmentType: EmploymentType;
    category: JobCategory;
    level: JobLevel;
    tags: string[];
    isStartup: boolean;

    description: string;

    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryText?: string;

    postedAt: Date;
    firstSeenAt: Date;
    lastSeenAt: Date;
    expiresAt: Date;
}

const JobSchema = new Schema<IJob>(
    {
        fingerprint: { type: String, required: true, unique: true },
        sourceIds: [{ type: String }],
        sources: [{ type: String }],
        sourceCount: { type: Number, default: 1 },

        title: { type: String, required: true },
        company: { type: String, required: true },
        companyLogo: { type: String },
        applyUrl: { type: String, required: true },

        location: { type: String, default: 'Not specified' },
        isRemote: { type: Boolean, default: false },
        countryCode: { type: String },
        city: { type: String },

        employmentType: { type: String, default: 'unknown' },
        category: { type: String, default: 'other' },
        level: { type: String, default: 'unknown' },
        tags: [{ type: String }],
        isStartup: { type: Boolean, default: false },

        description: { type: String, default: '' },

        salaryMin: { type: Number },
        salaryMax: { type: Number },
        salaryCurrency: { type: String },
        salaryText: { type: String },

        postedAt: { type: Date, required: true },
        firstSeenAt: { type: Date, default: Date.now },
        lastSeenAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: false }
);

// Default listing order, and the fallback for every filtered query.
JobSchema.index({ postedAt: -1 });
// Category is the filter almost every session applies (the audience is
// frontend), so it gets the compound index that keeps the sort covered.
JobSchema.index({ category: 1, postedAt: -1 });
JobSchema.index({ isRemote: 1, postedAt: -1 });
// City is the location filter on an India-only board, so it gets the same
// treatment as category: indexed with the default sort so the chip stays fast.
JobSchema.index({ city: 1, postedAt: -1 });
// Backs the "most relevant" sort.
JobSchema.index({ sourceCount: -1, postedAt: -1 });
// Lets a re-fetch find the row it already wrote from a different source.
JobSchema.index({ sourceIds: 1 });
// Every board load asks for the most recently refreshed row to render "updated
// N hours ago" and to decide whether the cache has gone cold — that lookup is
// on the hot path, so it gets an index rather than an in-memory sort.
JobSchema.index({ lastSeenAt: -1 });
// Self-pruning: a job no refresh has seen for JOB_TTL_DAYS is gone.
JobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
