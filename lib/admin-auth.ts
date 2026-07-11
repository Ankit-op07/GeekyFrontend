import { NextRequest, NextResponse } from 'next/server';
import { extractSessionFromRequest, SessionPayload } from '@/lib/session';

export const ADMIN_EMAIL = 'geekyfrontend@gmail.com';

/** Returns the session if it belongs to the admin account, otherwise null. */
export function getAdminSession(request: NextRequest): SessionPayload | null {
    const session = extractSessionFromRequest(request);
    return session?.email?.toLowerCase() === ADMIN_EMAIL ? session : null;
}

/**
 * Guard for admin-only API routes. Returns a 403 NextResponse if the caller
 * isn't the admin — return it immediately from the route handler. Returns
 * null if the caller is verified, so the handler can proceed.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
    if (!getAdminSession(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
}
