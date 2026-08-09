import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Contest from '@/lib/models/Contest';
import ContestPlan from '@/lib/models/ContestPlan';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveFeatureAccess } from '@/lib/feature-access';

/**
 * The learner's contest plans — "I intend to sit this one".
 *
 * GET  /api/contests/plans                       — everything they have planned
 * PUT  /api/contests/plans { fingerprint, planned } — toggle one
 *
 * MEMBERSHIP-GATED — but only the PLANNING, not the schedule.
 *
 * /api/contests stays public and stays that way: a contest calendar is published
 * openly by Codeforces, AtCoder, CodeChef and LeetCode, and charging for a copy
 * of public information would be indefensible. What membership buys is the part
 * we actually built and run — planning a contest, the dashboard calendar, and
 * the morning-of reminder email that costs us a cron and a mail send per member.
 *
 * Existing plans are NEVER deleted when a membership lapses; they simply stop
 * being editable and stop generating reminders. They return intact on renewal.
 */

/** GET — plans in date order, for the list toggles and the calendar. */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveFeatureAccess(session?.id ?? null, 'contests');
        if (!access.allowed) {
            // Not an error — a signed-out visitor, or a signed-in non-member,
            // can still read the schedule. They just cannot plan. An empty array
            // keeps the client simple, and `reason` lets it show the right
            // prompt rather than one generic message for two different asks.
            return NextResponse.json({
                plans: [],
                canPlan: false,
                reason: access.reason,
                membership: {
                    active: access.membership.active,
                    expiresAt: access.membership.expiresAt,
                },
            });
        }

        await connectToDatabase();
        const plans = (await ContestPlan.find({ userId: session!.id })
            .select('fingerprint platform name url startsAt endsAt reminderSentAt')
            .sort({ startsAt: 1 })
            .lean()) as any[];

        return NextResponse.json({
            canPlan: true,
            plans: plans.map((p) => ({
                fingerprint: p.fingerprint,
                platform: p.platform,
                name: p.name,
                url: p.url,
                startsAt: p.startsAt,
                endsAt: p.endsAt,
                reminded: Boolean(p.reminderSentAt),
            })),
        });
    } catch (error: any) {
        console.error('Contest plans read error:', error.message);
        return NextResponse.json({ error: 'Failed to load your plans' }, { status: 500 });
    }
}

/**
 * PUT — mark a contest as planned, or un-mark it.
 *
 * ⚠️  The snapshot is built from OUR Contest row, never from the request body.
 * Taking the name and url from the client would let anyone write arbitrary text
 * and an arbitrary link into a row we later put in an email — a stored-content
 * injection with a delivery mechanism attached. The client sends a fingerprint;
 * everything else is looked up.
 */
export async function PUT(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveFeatureAccess(session?.id ?? null, 'contests');
        if (!access.allowed) {
            return NextResponse.json(
                {
                    error:
                        access.reason === 'needs-auth'
                            ? 'Unauthorized'
                            : 'A membership is required to plan contests.',
                    reason: access.reason,
                },
                { status: access.reason === 'needs-auth' ? 401 : 403 }
            );
        }

        const body = await request.json().catch(() => null);
        const fingerprint = typeof body?.fingerprint === 'string' ? body.fingerprint : '';
        const planned = body?.planned;

        if (!fingerprint || typeof planned !== 'boolean') {
            return NextResponse.json(
                { error: 'fingerprint and planned are required' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        if (!planned) {
            await ContestPlan.deleteOne({ userId: session!.id, fingerprint });
            return NextResponse.json({ ok: true, planned: false });
        }

        // Match, do not trust: the contest must exist in our cache.
        const contest = (await Contest.findOne({ fingerprint })
            .select('platform name url startsAt endsAt')
            .lean()) as any;

        if (!contest) {
            return NextResponse.json({ error: 'Unknown contest' }, { status: 400 });
        }

        /**
         * Upsert rather than insert, so a double-click is a no-op instead of a
         * duplicate-key error the user would see as a failure.
         *
         * `reminderSentAt` is deliberately NOT touched here. Re-planning a
         * contest you had already been reminded about must not re-arm the
         * email — the guard is the field's absence, and clearing it would send
         * a second copy.
         */
        await ContestPlan.updateOne(
            { userId: session!.id, fingerprint },
            {
                $set: {
                    platform: contest.platform,
                    name: contest.name,
                    url: contest.url,
                    startsAt: contest.startsAt,
                    endsAt: contest.endsAt,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ ok: true, planned: true });
    } catch (error: any) {
        // A racing upsert can still lose on the unique index; the row exists
        // either way, which is what the caller asked for.
        if (error?.code === 11000) {
            return NextResponse.json({ ok: true, planned: true });
        }
        console.error('Contest plan write error:', error.message);
        return NextResponse.json({ error: 'Failed to save your plan' }, { status: 500 });
    }
}
