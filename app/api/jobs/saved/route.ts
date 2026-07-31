import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectToDatabase from '@/lib/db';
import Job from '@/lib/models/Job';
import CompanyKitUser, {
    JOB_APPLICATION_STATUSES,
    type JobApplicationStatus,
} from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';

/**
 * Saved jobs and the application tracker — the same list.
 *
 * A row is stored as a denormalized snapshot on `CompanyKitUser.savedJobs`, not
 * as a reference to `Job`: `Job` is a cache of external feeds that expires on a
 * TTL, and a shortlist that deletes its own entries when a feed moves on would
 * be actively harmful — you would lose the record that you applied somewhere.
 * That is also why DELETE is the ONLY way a row leaves this list.
 *
 *   GET    — the tracker, newest first, with per-status counts
 *   POST   — save a job, or move one to a new status (idempotent upsert)
 *   DELETE — drop it from the list entirely
 */

/** Bound on the list. Generous for a real job hunt, and it keeps a single user
 *  document from growing without limit. */
const MAX_SAVED = 200;
const MAX_NOTES = 2000;

function isStatus(value: unknown): value is JobApplicationStatus {
    return typeof value === 'string' && (JOB_APPLICATION_STATUSES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        await connectToDatabase();
        const user = (await CompanyKitUser.findById(session.id)
            .select('savedJobs')
            .lean()) as { savedJobs?: any[] } | null;

        const saved = [...(user?.savedJobs || [])].sort(
            (a, b) =>
                new Date(b.updatedAt || b.savedAt).getTime() -
                new Date(a.updatedAt || a.savedAt).getTime()
        );

        // Which of them are still live listings — the UI marks the rest as
        // "no longer listed" rather than sending someone to a dead link.
        const liveIds = new Set<string>();
        const lookupIds = saved.map((s) => s.jobId).filter((id) => isValidObjectId(id));
        if (lookupIds.length) {
            const live = await Job.find({ _id: { $in: lookupIds } })
                .select('_id')
                .lean();
            for (const row of live as any[]) liveIds.add(String(row._id));
        }

        const counts: Record<string, number> = {};
        for (const status of JOB_APPLICATION_STATUSES) counts[status] = 0;
        for (const row of saved) counts[row.status || 'saved'] = (counts[row.status || 'saved'] || 0) + 1;

        return NextResponse.json({
            jobs: saved.map((s) => ({
                id: s.jobId,
                title: s.title,
                company: s.company,
                applyUrl: s.applyUrl,
                location: s.location || '',
                // Rows written before the tracker shipped have no status.
                status: s.status || 'saved',
                appliedAt: s.appliedAt || null,
                notes: s.notes || '',
                savedAt: s.savedAt,
                stillListed: liveIds.has(s.jobId),
            })),
            counts,
            total: saved.length,
        });
    } catch (error: any) {
        console.error('Saved jobs list error:', error.message);
        return NextResponse.json({ error: 'Failed to load saved jobs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const body = await request.json();
        const { jobId } = body;
        // Checked before it reaches Mongo: findById on a malformed id throws a
        // CastError, which would surface as a 500 for what is a bad request.
        if (!jobId || typeof jobId !== 'string' || !isValidObjectId(jobId)) {
            return NextResponse.json({ error: 'A valid jobId is required' }, { status: 400 });
        }
        // An unrecognised status is rejected, not silently coerced — a typo'd
        // status that quietly became 'saved' would look like the tracker losing
        // an application.
        if (body.status !== undefined && !isStatus(body.status)) {
            return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
        }
        if (body.notes !== undefined && typeof body.notes !== 'string') {
            return NextResponse.json({ error: 'notes must be a string' }, { status: 400 });
        }

        /**
         * `undefined` when the caller didn't send one — NOT defaulted to
         * 'saved'. This endpoint is also how notes are saved, and notes are
         * posted as `{ jobId, notes }` with no status: defaulting here meant
         * typing a note on an "interviewing" row silently demoted it back to
         * "saved" and threw away the application's stage. Absent means "leave
         * the stage alone"; only the insert path needs a default.
         */
        const requestedStatus: JobApplicationStatus | undefined = isStatus(body.status)
            ? body.status
            : undefined;
        const notes = typeof body.notes === 'string' ? body.notes.slice(0, MAX_NOTES) : undefined;
        const now = new Date();

        await connectToDatabase();

        /**
         * Update first, insert only if there was nothing to update.
         *
         * The positional `$` operator needs the array element matched in the
         * filter, so this cannot be one upsert. The `$ne` guard on the insert
         * path is what makes the two-step safe: if a concurrent request
         * inserted the row between our update and our push, the push matches
         * nothing instead of creating a duplicate.
         */
        const set: Record<string, unknown> = { 'savedJobs.$.updatedAt': now };
        if (requestedStatus !== undefined) set['savedJobs.$.status'] = requestedStatus;
        if (notes !== undefined) set['savedJobs.$.notes'] = notes;

        const update: Record<string, unknown> = { $set: set };
        if (requestedStatus !== undefined && requestedStatus !== 'saved') {
            /**
             * `$min`, not `$set` — it writes the field when absent and
             * otherwise keeps the SMALLER (earlier) value. That is exactly the
             * rule we want: stamp the application date the first time the row
             * reaches applied-or-later, and never move it afterwards. Walking
             * a row applied → interviewing → rejected must not keep rewriting
             * "applied on" to today.
             *
             * It also has to be its own operator: `$set` and `$min` on the same
             * path in one update is a conflict error, not a merge.
             */
            update.$min = { 'savedJobs.$.appliedAt': now };
        }

        const updated = await CompanyKitUser.updateOne(
            { _id: session.id, 'savedJobs.jobId': jobId },
            update
        );

        if (updated.matchedCount === 0) {
            // The snapshot is taken from OUR row, never from the request body —
            // otherwise the client could write any title and any apply URL into
            // a user's saved list.
            const job = (await Job.findById(jobId)
                .select('title company applyUrl location')
                .lean()) as any;
            if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

            // Only the insert path defaults: a brand-new row with no stage
            // named is a plain bookmark.
            const status: JobApplicationStatus = requestedStatus ?? 'saved';
            const entry: Record<string, unknown> = {
                jobId,
                title: job.title,
                company: job.company,
                applyUrl: job.applyUrl,
                location: job.location,
                status,
                notes: notes || '',
                savedAt: now,
                updatedAt: now,
            };
            /**
             * `appliedAt` is OMITTED, not written as null, when the row starts
             * life as a plain bookmark. The later transition to 'applied' uses
             * `$min`, and `$min` against a stored null keeps the null forever
             * (null sorts below any date in BSON) — the row would then never
             * get an application date at all. An absent field is the only value
             * `$min` will overwrite.
             */
            if (status !== 'saved') entry.appliedAt = now;

            await CompanyKitUser.updateOne(
                { _id: session.id, 'savedJobs.jobId': { $ne: jobId } },
                {
                    $push: {
                        savedJobs: {
                            $each: [entry],
                            // Keeps the most recent MAX_SAVED. Trimming the
                            // oldest is the only bound that never blocks a save.
                            $slice: -MAX_SAVED,
                        },
                    },
                }
            );
        }

        return NextResponse.json({ ok: true, saved: true, status: requestedStatus ?? null });
    } catch (error: any) {
        console.error('Save job error:', error.message);
        return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const jobId = request.nextUrl.searchParams.get('jobId');
        if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });

        await connectToDatabase();
        await CompanyKitUser.updateOne({ _id: session.id }, { $pull: { savedJobs: { jobId } } });

        return NextResponse.json({ ok: true, saved: false });
    } catch (error: any) {
        console.error('Unsave job error:', error.message);
        return NextResponse.json({ error: 'Failed to remove saved job' }, { status: 500 });
    }
}
