import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../../lib/db';
import CompanyKitUser from '../../../../lib/models/CompanyKitUser';

export async function POST(request: NextRequest) {
    console.log('[reset-password] ── POST called ──');

    try {
        // ── 1. Parse body ────────────────────────────────────────
        let token: string, newPassword: string;
        try {
            const body = await request.json();
            token = body.token;
            newPassword = body.newPassword;
            console.log('[reset-password] Body parsed OK | token present:', !!token, '| password length:', newPassword?.length ?? 0);
        } catch (parseErr: any) {
            console.error('[reset-password] ❌ Failed to parse request body:', parseErr.message);
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // ── 2. Basic validation ──────────────────────────────────
        if (!token || !newPassword) {
            console.warn('[reset-password] ❌ Missing token or password');
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            console.warn('[reset-password] ❌ Password too short:', newPassword.length);
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // ── 3. Verify JWT ────────────────────────────────────────
        const jwtSecret = process.env.JWT_SECRET || 'secret_key';
        console.log('[reset-password] JWT_SECRET configured:', !!process.env.JWT_SECRET);

        let decoded: any;
        try {
            decoded = jwt.verify(token, jwtSecret);
            console.log('[reset-password] Token decoded OK | id:', decoded.id, '| type:', decoded.type, '| exp:', new Date((decoded.exp ?? 0) * 1000).toISOString());
        } catch (jwtErr: any) {
            console.error('[reset-password] ❌ JWT verify failed:', jwtErr.name, '-', jwtErr.message);
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        // ── 4. Token type check ──────────────────────────────────
        if (decoded.type !== 'reset' && decoded.type !== 'set-password') {
            console.warn('[reset-password] ❌ Wrong token type:', decoded.type);
            return NextResponse.json({ error: 'Invalid token type' }, { status: 400 });
        }

        // ── 5. Connect to DB ─────────────────────────────────────
        console.log('[reset-password] Connecting to database…');
        try {
            await connectToDatabase();
            console.log('[reset-password] DB connected OK');
        } catch (dbConnErr: any) {
            console.error('[reset-password] ❌ DB connection failed:', dbConnErr.message);
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // ── 6. Find user ─────────────────────────────────────────
        console.log('[reset-password] Looking up user by id:', decoded.id);

        // Guard: decoded.id must be a valid MongoDB ObjectId (24 hex chars)
        // Test tokens use id: 'test' which causes a Mongoose CastError
        const isValidObjectId = /^[a-f\d]{24}$/i.test(String(decoded.id));
        if (!isValidObjectId) {
            console.warn('[reset-password] ❌ Invalid ObjectId in token (likely a test token):', decoded.id);
            return NextResponse.json({ error: 'This is a test token and cannot be used to reset a real password.' }, { status: 400 });
        }

        const user = await CompanyKitUser.findById(decoded.id);

        if (!user) {
            console.warn('[reset-password] ❌ User not found for id:', decoded.id);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        console.log('[reset-password] User found:', user.email, '| mustChangePassword:', user.mustChangePassword);

        // ── 7. Save new password ─────────────────────────────────
        try {
            user.password = newPassword;
            user.mustChangePassword = false;
            await user.save();
            console.log('[reset-password] ✅ Password saved for:', user.email);
        } catch (saveErr: any) {
            console.error('[reset-password] ❌ Failed to save user:', saveErr.message, saveErr.errors ?? '');
            return NextResponse.json({ error: 'Failed to save new password' }, { status: 500 });
        }

        console.log('[reset-password] ✅ Done — password reset successfully for:', user.email);
        return NextResponse.json({ success: true, message: 'Password has been reset successfully' });

    } catch (error: any) {
        console.error('[reset-password] ❌ Unexpected error:', error.message, error.stack);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
