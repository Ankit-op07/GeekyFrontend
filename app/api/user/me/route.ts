import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

/**
 * GET /api/user/me
 * Lightweight identity for prefilling checkout. Returns 401 when logged out —
 * the caller treats that as "guest" and simply shows empty fields.
 */
export async function GET() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session) {
        return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    return NextResponse.json({
        id: session.id,
        email: session.email,
        name: session.name,
        profilePicture: session.profilePicture ?? null,
    });
}
