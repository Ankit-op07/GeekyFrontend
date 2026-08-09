import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import DsaProgress from '@/lib/models/DsaProgress';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveDsaAccess, dsaDenied } from '@/lib/dsa-access';
import { getProblem } from '@/lib/dsa';

/** What a client is allowed to ask for. `pending` clears the tick entirely. */
const STATUSES = ['pending', 'attempted', 'solved'] as const;
type RequestedStatus = (typeof STATUSES)[number];

/**
 * PUT /api/dsa/progress   { problemId, status?, favourite? }
 *
 * Set one problem's tick and/or its star. Both fields are optional; sending
 * only `favourite` leaves the status untouched, which is what lets you star a
 * problem without claiming to have solved it.
 *
 * ⚠️  `problemId` builds a Mongo update PATH (`problems.<id>.status`). It is
 * therefore never taken from the body directly: it is matched against the
 * authored catalogue first and the MATCHED value is what gets written. A dot or
 * `$` in an attacker-supplied key would otherwise be read as a path or an
 * operator. Same rule, same reason, as /api/roadmap/progress.
 *
 * THE ONE-WAY RULES, both deliberate:
 *
 *  • `solved` is never downgraded to `attempted`. Opening a problem you have
 *    already cracked (to revise it) must not erase the fact that you cracked
 *    it — and the Apply-button equivalent on the jobs tracker taught us that
 *    the automatic write is the one that does the damage. Only an explicit
 *    `pending` clears a tick, and that is a deliberate click.
 *
 *  • `solvedAt` / `attemptedAt` are written with `$min`, never `$set`, so
 *    re-ticking cannot rewrite the day it first happened. `$min` requires the
 *    field to be ABSENT (not null) to take effect, which is why nothing ever
 *    initialises them.
 */
export async function PUT(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        const body = await request.json().catch(() => null);
        const rawProblemId = typeof body?.problemId === 'string' ? body.problemId : '';
        const rawStatus = typeof body?.status === 'string' ? body.status : undefined;
        const favourite = typeof body?.favourite === 'boolean' ? body.favourite : undefined;

        // Match, do not trust: this is OUR id, not theirs.
        const match = getProblem(rawProblemId);
        if (!match) {
            return NextResponse.json({ error: 'Unknown problem' }, { status: 400 });
        }
        const problemId = match.problem.id;

        if (rawStatus !== undefined && !STATUSES.includes(rawStatus as RequestedStatus)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        if (rawStatus === undefined && favourite === undefined) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        await connectToDatabase();

        const path = `problems.${problemId}`;
        const set: Record<string, unknown> = {};
        const unset: Record<string, ''> = {};
        const min: Record<string, Date> = {};
        const now = new Date();

        if (rawStatus === 'pending') {
            // Clearing the tick drops the whole entry — including favourite and the
            // timestamps. "Pending" is the absence of a key, not a stored value,
            // so an un-ticked problem costs nothing.
            unset[path] = '';
        } else if (rawStatus !== undefined) {
            set[`${path}.status`] = rawStatus;
            min[`${path}.${rawStatus === 'solved' ? 'solvedAt' : 'attemptedAt'}`] = now;
        }

        if (favourite !== undefined && rawStatus !== 'pending') {
            // `false` unsets rather than storing false — same "absence is the
            // zero state" rule, so un-starring leaves no residue.
            if (favourite) set[`${path}.favourite`] = true;
            else unset[`${path}.favourite`] = '';
        }

        const update: Record<string, unknown> = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;
        if (Object.keys(min).length) update.$min = min;

        /**
         * The no-downgrade guard, done in the QUERY rather than by reading the
         * current status and branching in JS.
         *
         * `attempted` is the one status a client writes automatically — it fires
         * when the learner clicks through to LeetCode, including when they are
         * re-opening something they solved last month to revise it. Read-then-
         * write would be correct almost always and wrong exactly when someone
         * has the sheet open in two tabs, which is the case that produces a
         * support ticket nobody can reproduce. Making the filter itself refuse
         * to match a solved row means the database enforces it.
         */
        const isAutomaticWrite = rawStatus === 'attempted';
        const filter: Record<string, unknown> = { userId: access.userId };
        if (isAutomaticWrite) {
            filter[`problems.${problemId}.status`] = { $ne: 'solved' };
        }

        const save = () =>
            DsaProgress.findOneAndUpdate(filter, update, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            })
                .select('problems')
                .lean() as Promise<{ problems?: Record<string, unknown> } | null>;

        let row: { problems?: Record<string, unknown> } | null;
        try {
            row = await save();
        } catch (err: any) {
            if (err?.code !== 11000) throw err;
            /**
             * A duplicate key on the unique `userId` index means the upsert tried
             * to INSERT because the filter did not match an existing row. Two
             * different situations produce that, and they need opposite handling:
             *
             *  • guard on  → the row exists and is already `solved`, so the
             *    filter excluded it on purpose. The write is a no-op by design;
             *    return what is already stored.
             *  • guard off → a genuine race (two ticks in the same instant with
             *    no document yet). The loser's row now exists, so a retry is a
             *    plain update and succeeds.
             */
            if (!isAutomaticWrite) {
                row = await save();
            } else {
                row = (await DsaProgress.findOne({ userId: access.userId })
                    .select('problems')
                    .lean()) as { problems?: Record<string, unknown> } | null;
            }
        }

        return NextResponse.json({ ok: true, problems: row?.problems || {} });
    } catch (error: any) {
        console.error('DSA progress error:', error.message);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}
