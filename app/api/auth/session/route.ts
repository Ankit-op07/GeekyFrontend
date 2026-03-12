import { NextRequest, NextResponse } from 'next/server';
import { extractSessionFromRequest } from '@/lib/session';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

/**
 * GET /api/auth/session
 * Returns the currently logged-in user from the session cookie,
 * or { user: null } if not logged in / session expired.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);

        if (!session) {
            return NextResponse.json({ user: null });
        }

        // Optionally hydrate fresh data from DB (e.g. to get purchasedKits)
        await connectToDatabase();
        const user = await CompanyKitUser.findById(session.id).select(
            'email name profilePicture purchasedKits subscriptionStatus mustChangePassword'
        );

        if (!user) {
            // User was deleted — clear stale session
            const response = NextResponse.json({ user: null });
            response.headers.set('Set-Cookie', 'gf_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
            return response;
        }

        return NextResponse.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
                purchasedKits: user.purchasedKits || [],
                mustChangePassword: user.mustChangePassword || false,
            },
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ user: null });
    }
}

/**
 * DELETE /api/auth/session  → log out
 */
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', 'gf_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return response;
}
