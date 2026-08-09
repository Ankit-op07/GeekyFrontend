import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Contest from '@/lib/models/Contest';
import { CONTEST_PLATFORMS } from '@/lib/contests/types';

/**
 * GET /api/contests
 *
 * Upcoming contests, soonest first. Public — a contest schedule is public
 * information on every platform it comes from, and gating it would be
 * pretending otherwise.
 *
 * ⚠️  `endsAt > now` is the filter, NOT `startsAt > now`. A contest that is
 * currently running is exactly the row someone wants — they are mid-round and
 * looking for the link. Filtering on the start time hides it at the moment it
 * is most useful. The same reasoning shapes the TTL in lib/models/Contest.
 *
 * This route never triggers an ingest. Refreshing is the cron's job
 * (/api/contests/refresh); a read path that repairs the cache turns one slow
 * upstream into a slow page for whoever happens to arrive first.
 */
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const platform = request.nextUrl.searchParams.get('platform');
        const known = CONTEST_PLATFORMS.some((p) => p.id === platform);

        const filter: Record<string, unknown> = { endsAt: { $gt: new Date() } };
        // Match, do not trust: an unknown platform is ignored rather than passed
        // through to the query.
        if (platform && known) filter.platform = platform;

        const contests = (await Contest.find(filter)
            .select('fingerprint platform name url startsAt endsAt durationSeconds')
            .sort({ startsAt: 1 })
            .limit(200)
            .lean()) as {
            _id: unknown;
            fingerprint: string;
            platform: string;
            name: string;
            url: string;
            startsAt: Date;
            endsAt: Date;
            durationSeconds: number;
        }[];

        return NextResponse.json({
            contests: contests.map((c) => ({
                id: String(c._id),
                // The plan toggle keys on this, not on _id: a plan must survive
                // the Contest TTL, and a re-ingested contest gets a new _id.
                fingerprint: c.fingerprint,
                platform: c.platform,
                name: c.name,
                url: c.url,
                startsAt: c.startsAt,
                endsAt: c.endsAt,
                durationSeconds: c.durationSeconds,
            })),
            platforms: CONTEST_PLATFORMS,
        });
    } catch (error: any) {
        console.error('Contests read error:', error.message);
        return NextResponse.json({ error: 'Failed to load contests' }, { status: 500 });
    }
}
