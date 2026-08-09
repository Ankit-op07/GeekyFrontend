import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Contest from '@/lib/models/Contest';
import { getAdminSession } from '@/lib/admin-auth';
import { extractSessionFromRequest } from '@/lib/session';
import { ingestContests, type ContestIngestReport } from '@/lib/contests/ingest';
import { sendContestReminders, type ReminderReport } from '@/lib/contests/reminders';
import { sendMembershipRenewalReminders, type RenewalReport } from '@/lib/membership-reminders';

/**
 * POST|GET /api/contests/refresh — pull every platform and refresh the cache.
 *
 * Same three callers and the same rights as /api/jobs/refresh, for the same
 * reasons:
 *
 *  • **Vercel cron** (`Authorization: Bearer $CRON_SECRET`) — the normal path.
 *  • **Admin** — an on-demand run. The response carries the per-source report,
 *    which is the ONLY way to discover that the AtCoder page shape has changed;
 *    that adapter parses HTML and will break eventually.
 *  • **Any logged-in user, but only when the cache is COLD.** Without this the
 *    board is empty between a deploy and the first cron tick, and permanently
 *    empty on an install with no cron configured.
 *
 * ⚠️  Hobby-plan limits, and they are not preferences: exceeding either makes
 * Vercel reject the whole deployment at validation, with no build and no
 * deployment record. That already blocked every push to this repo once, for the
 * job board. Hobby allows crons only at daily granularity, and this route is
 * the second of the two the plan permits.
 */
export const maxDuration = 60;

/**
 * How stale the cache may be before a non-admin may trigger a refresh.
 *
 * Shorter than the job board's 6 hours because the data moves faster: a
 * contest can be announced and run inside a week, and a learner opening the tab
 * to find yesterday's picture has been failed by it. Daily cron plus this means
 * real traffic keeps it warmer than the schedule alone.
 */
const STALE_HOURS = 3;

/** One run at a time per instance — two users opening a cold board would
 *  otherwise each start a full fan-out at four third parties. */
let inFlight: Promise<ContestIngestReport> | null = null;

function runOnce(): Promise<ContestIngestReport> {
    if (!inFlight) {
        inFlight = ingestContests().finally(() => {
            inFlight = null;
        });
    }
    return inFlight;
}

/**
 * The reminder sweep rides on this cron rather than having its own.
 *
 * Hobby allows exactly two cron jobs and both are spoken for (jobs, contests).
 * Piggybacking is not a hack here — the two steps genuinely belong in this
 * order: refresh the schedule first, then mail people about it, so a reminder
 * can never be sent from a stale row.
 *
 * ⚠️  ONLY ON THE CRON PATH. An admin poking refresh, or a learner opening a
 * cold board, must not trigger a send — each plan gets exactly one reminder,
 * and burning it at 3pm because someone hit a button is not recoverable.
 */
async function runRemindersSafely(): Promise<ReminderReport | { error: string }> {
    try {
        return await sendContestReminders();
    } catch (err: any) {
        // A mail failure must never fail the refresh: the board being current
        // matters more than the digest going out, and the next run retries
        // anything still unclaimed.
        console.error('Contest reminder sweep failed:', err?.message);
        return { error: err?.message || 'reminder sweep failed' };
    }
}

/**
 * Membership renewal reminders, riding the same cron for the same reason.
 *
 * Hobby caps us at TWO cron jobs and both are spent — and exceeding it does not
 * fail at runtime, it rejects the DEPLOYMENT at validation, which would take the
 * whole site's next deploy down. So this is a third sweep on an existing daily
 * runner rather than a third schedule.
 *
 * Wrapped separately from the contest sweep so one failing cannot swallow the
 * other: a bad SMTP response while mailing contest digests must not also cancel
 * every renewal warning that day, and vice versa.
 */
async function runRenewalRemindersSafely(): Promise<RenewalReport | { error: string }> {
    try {
        return await sendMembershipRenewalReminders();
    } catch (err: any) {
        console.error('Membership renewal sweep failed:', err?.message);
        return { error: err?.message || 'renewal sweep failed' };
    }
}

function isCron(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    // Without the env var the cron silently 403s — the same trap the job board
    // documents. If the board stops updating in production, check this first.
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
            const newest = (await Contest.findOne()
                .sort({ lastSeenAt: -1 })
                .select('lastSeenAt')
                .lean()) as { lastSeenAt?: Date } | null;
            const ageMs = newest?.lastSeenAt
                ? Date.now() - new Date(newest.lastSeenAt).getTime()
                : Infinity;
            if (ageMs < STALE_HOURS * 60 * 60 * 1000) {
                return NextResponse.json(
                    { error: 'Contests are already up to date', lastUpdatedAt: newest?.lastSeenAt },
                    { status: 429 }
                );
            }
        }

        const report = await runOnce();

        // Reminders ride the cron path only — see runRemindersSafely.
        const reminders = cron ? await runRemindersSafely() : undefined;
        const renewals = cron ? await runRenewalRemindersSafely() : undefined;

        // Which upstream is down is an operational detail. A learner gets counts
        // and nothing about our sources — the same rule as the job board, where
        // the UI never names a feed.
        if (cron || admin) return NextResponse.json({ ...report, reminders, renewals });
        return NextResponse.json({ ok: true, upserted: report.upserted });
    } catch (error: any) {
        console.error('Contest refresh error:', error.message);
        return NextResponse.json({ error: 'Failed to refresh contests' }, { status: 500 });
    }
}

/**
 * Vercel's cron scheduler issues GETs — so this, not POST, is the path that
 * actually sends the reminders in production.
 */
export async function GET(request: NextRequest) {
    const cron = isCron(request);
    if (!cron && !getAdminSession(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        const report = await runOnce();
        const reminders = cron ? await runRemindersSafely() : undefined;
        const renewals = cron ? await runRenewalRemindersSafely() : undefined;
        return NextResponse.json({ ...report, reminders, renewals });
    } catch (error: any) {
        console.error('Contest refresh error:', error.message);
        return NextResponse.json({ error: 'Failed to refresh contests' }, { status: 500 });
    }
}
