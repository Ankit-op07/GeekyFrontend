import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Job from '@/lib/models/Job';
import { getAdminSession } from '@/lib/admin-auth';
import { extractSessionFromRequest } from '@/lib/session';
import { ingestJobs, type IngestSummary } from '@/lib/jobs/ingest';

/**
 * POST /api/jobs/refresh — pull every source and upsert the board.
 *
 * Three callers, three different rights:
 *
 *  • **Vercel cron** (`Authorization: Bearer $CRON_SECRET`) — the normal path.
 *    Scheduled in vercel.json; this is what keeps the board fresh.
 *  • **Admin** — an on-demand run. The response includes the per-source health
 *    report, which is the only way to find out that an ATS board slug in
 *    lib/jobs/sources/ats.ts has gone stale.
 *  • **Any logged-in user, but ONLY when the board is empty or cold.** Without
 *    this the board is blank between a fresh deploy and the first cron tick,
 *    and on a self-hosted install with no cron configured it would never fill
 *    at all. It is not a general-purpose trigger: a warm board returns 429 to a
 *    non-admin, so it cannot be used to make us hammer two dozen third parties.
 */

/**
 * Both this and the cron schedule in vercel.json are pinned to the HOBBY plan's
 * limits, and neither is a preference — exceed either and Vercel rejects the
 * whole deployment at validation, before a build, with no deployment record to
 * show for it. A 6-hourly cron and maxDuration 300 silently blocked every push
 * to this repo until they were brought back down.
 *
 *   maxDuration  60s  (a full fan-out measures ~16s)
 *   cron         daily, 02:30 UTC / 08:00 IST
 *
 * Raise both if the account moves to Pro. Note the board is not actually
 * limited to one refresh a day: any logged-in user opening the tab when the
 * newest row is over STALE_HOURS old triggers one, so real traffic keeps it
 * warmer than the schedule alone.
 */
export const maxDuration = 60;
/** How old the newest row may be before a non-admin may trigger a refresh. */
const STALE_HOURS = 6;

/**
 * One run at a time per instance.
 *
 * Two users opening the dashboard on an empty board would otherwise each start
 * a full fan-out. The writes are idempotent upserts so a double run is not
 * *incorrect*, just a wasteful double hit on every upstream — and the ones with
 * rate limits (RemoteOK, RapidAPI) are the ones we would lose. Concurrent
 * callers await the run already in flight and get its result.
 */
let inFlight: Promise<IngestSummary> | null = null;

function runOnce(): Promise<IngestSummary> {
    if (!inFlight) {
        inFlight = ingestJobs().finally(() => {
            inFlight = null;
        });
    }
    return inFlight;
}

function isCron(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
    try {
        const cron = isCron(request);
        const admin = !cron && Boolean(getAdminSession(request));
        const session = extractSessionFromRequest(request);

        if (!cron && !admin && !session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        if (!cron && !admin) {
            await connectToDatabase();
            const newest = (await Job.findOne()
                .sort({ lastSeenAt: -1 })
                .select('lastSeenAt')
                .lean()) as { lastSeenAt?: Date } | null;
            const ageMs = newest?.lastSeenAt ? Date.now() - new Date(newest.lastSeenAt).getTime() : Infinity;
            if (ageMs < STALE_HOURS * 60 * 60 * 1000) {
                return NextResponse.json(
                    { error: 'Job board is already up to date', lastUpdatedAt: newest?.lastSeenAt },
                    { status: 429 }
                );
            }
        }

        const summary = await runOnce();

        // The per-source report is an operational detail — who is down, which
        // board slug 404s. Only the admin and cron see it; a learner gets the
        // counts and nothing about our upstreams.
        if (cron || admin) return NextResponse.json(summary);

        return NextResponse.json({
            ok: true,
            unique: summary.unique,
            totalInDb: summary.totalInDb,
        });
    } catch (error: any) {
        console.error('Job refresh error:', error.message);
        return NextResponse.json({ error: 'Failed to refresh jobs' }, { status: 500 });
    }
}

/**
 * GET — Vercel's cron scheduler issues GETs. Same guard, same work.
 */
export async function GET(request: NextRequest) {
    if (!isCron(request) && !getAdminSession(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        return NextResponse.json(await runOnce());
    } catch (error: any) {
        console.error('Job refresh error:', error.message);
        return NextResponse.json({ error: 'Failed to refresh jobs' }, { status: 500 });
    }
}
