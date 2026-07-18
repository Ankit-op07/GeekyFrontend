import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/activity';

/**
 * POST /api/presence
 * Body: { path: string, type: 'pageview' | 'heartbeat' }
 *
 * Records real-time presence for a logged-in user (feeds the admin Live Users
 * view). Anonymous callers short-circuit with a no-op BEFORE any DB work, so
 * signed-out marketing traffic costs nothing.
 *
 * - Every call bumps CompanyKitUser.lastSeenAt + currentPath (presence).
 * - A 'pageview' on a non-admin/non-api path also appends a UserActivity row
 *   (behaviour). Heartbeats never write activity — they only keep the user
 *   marked online.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ tracked: false });
        }

        const body = await request.json().catch(() => null);
        // Only accept a real in-app route ("/..."), capped in length. Anything
        // else (missing, malformed, external) is treated as "no path" — we still
        // bump presence but never blank an existing currentPath with garbage.
        const rawPath = typeof body?.path === 'string' ? body.path : '';
        const path = rawPath.startsWith('/') ? rawPath.slice(0, 512) : '';
        const type = body?.type === 'heartbeat' ? 'heartbeat' : 'pageview';

        await connectToDatabase();

        const set: Record<string, unknown> = { lastSeenAt: new Date() };
        if (path) set.currentPath = path;

        // The presence bump and the behaviour insert are independent — run them
        // together so the per-navigation hot path costs one round-trip, not two.
        const writes: Promise<unknown>[] = [
            CompanyKitUser.updateOne({ _id: session.id }, { $set: set }),
        ];

        // Log the page view for the behaviour timeline — but not admin's own
        // browsing or internal API hits (self-noise / not user behaviour).
        if (type === 'pageview' && path && !path.startsWith('/admin') && !path.startsWith('/api')) {
            writes.push(logActivity({ session, event: 'pageview', path }));
        }

        await Promise.all(writes);

        return NextResponse.json({ tracked: true });
    } catch (error: any) {
        // Presence is non-critical; never surface a 500 (or internal error text)
        // to the tracker.
        console.error('Presence write failed:', error?.message);
        return NextResponse.json({ tracked: false });
    }
}
