import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/live-users
 * Admin-only. Returns everyone seen in the last 7 days (sorted most-recent
 * first) plus rolled-up counts for the stat cards. "Online" = seen within the
 * last 5 minutes (roughly one heartbeat window on either side).
 */

const ONLINE_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export async function GET(request: NextRequest) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    await connectToDatabase();

    const now = Date.now();
    const weekAgo = new Date(now - WEEK_MS);

    // Bounded so a large active base can't blow up the 15s-polled payload.
    // The roster is "most-recently-seen first"; the counts below are computed
    // from this window, which is the population the admin actually watches.
    const ROSTER_LIMIT = 500;
    const users = await CompanyKitUser.find({ lastSeenAt: { $gte: weekAgo } })
        .select('name email lastSeenAt currentPath purchasedKits subscriptionStatus')
        .sort({ lastSeenAt: -1 })
        .limit(ROSTER_LIMIT)
        .lean();

    let online = 0;
    let last24h = 0;
    for (const u of users as any[]) {
        const seen = u.lastSeenAt ? new Date(u.lastSeenAt).getTime() : 0;
        if (now - seen <= ONLINE_MS) online++;
        if (now - seen <= DAY_MS) last24h++;
    }

    return NextResponse.json({
        users,
        counts: { online, last24h, last7d: users.length },
        onlineWindowMs: ONLINE_MS,
        now: new Date(now).toISOString(),
    });
}
