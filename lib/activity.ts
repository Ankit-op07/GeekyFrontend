import type { SessionPayload } from '@/lib/session';
import UserActivity, { type ActivityEvent } from '@/lib/models/UserActivity';

/**
 * Best-effort behaviour logger for the admin Live Users view.
 *
 * Writes a single UserActivity row for a logged-in user. It is deliberately
 * non-throwing: a logging failure must never break the caller (grading a quiz,
 * confirming a payment). Callers should already have an open DB connection.
 *
 * We deliberately do NOT store IP or user-agent — the admin view never surfaces
 * them, and keeping raw client IPs for 30 days is PII we have no use for.
 */
export async function logActivity(opts: {
    session: Pick<SessionPayload, 'id' | 'email' | 'name'>;
    event: ActivityEvent;
    path: string;
    meta?: Record<string, unknown>;
}): Promise<void> {
    try {
        const { session, event, path, meta } = opts;
        await UserActivity.create({
            userId: session.id,
            email: session.email,
            name: session.name || '',
            path,
            event,
            meta,
        });
    } catch {
        // Signal loss is acceptable — never let logging break the caller.
    }
}
