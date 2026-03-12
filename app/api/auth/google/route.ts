import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { createSessionToken, getSessionCookieString } from '@/lib/session';

/**
 * Google Sign-In route using Google Identity Services (GSI).
 * Accepts a JWT credential from the Google One Tap / Sign-In button.
 * Verifies the JWT signature against Google's public keys, then
 * creates or updates the user and sets a secure session cookie.
 */

async function verifyGoogleJWT(credential: string): Promise<{
    sub: string; email: string; name: string; picture?: string; email_verified: boolean;
} | null> {
    try {
        // Decode header to get kid
        const [headerB64, payloadB64, sigB64] = credential.split('.');
        if (!headerB64 || !payloadB64 || !sigB64) return null;

        const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

        // Validate basic claims
        const now = Math.floor(Date.now() / 1000);
        const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (
            payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com'
        ) return null;
        if (payload.exp < now) return null; // expired
        if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) return null; // wrong client

        // Fetch Google's public keys
        const keysRes = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
            next: { revalidate: 3600 } as any, // cache for 1 hour (Next.js fetch cache)
        });
        if (!keysRes.ok) return null;
        const { keys } = await keysRes.json() as { keys: any[] };
        const jwk = keys.find((k: any) => k.kid === header.kid);
        if (!jwk) return null;

        // Import the key and verify signature
        const cryptoKey = await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signedData = Buffer.from(`${headerB64}.${payloadB64}`);
        const signatureBytes = Buffer.from(sigB64, 'base64url');

        const valid = await crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            cryptoKey,
            signatureBytes,
            signedData
        );

        if (!valid) return null;

        return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            email_verified: payload.email_verified,
        };
    } catch (err) {
        console.error('Google JWT verification error:', err);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json({ error: 'Google credential is required' }, { status: 400 });
        }

        // Verify the token cryptographically
        const googlePayload = await verifyGoogleJWT(credential);
        if (!googlePayload) {
            return NextResponse.json({ error: 'Invalid or expired Google token' }, { status: 401 });
        }

        if (!googlePayload.email_verified) {
            return NextResponse.json({ error: 'Google account email is not verified' }, { status: 401 });
        }

        await connectToDatabase();

        // Find or create user
        let user = await CompanyKitUser.findOne({ email: googlePayload.email.toLowerCase() });

        if (user) {
            user.name = googlePayload.name || user.name;
            user.profilePicture = googlePayload.picture || user.profilePicture;
            user.googleId = googlePayload.sub;
            user.emailVerified = true;
            await user.save();
        } else {
            user = await CompanyKitUser.create({
                email: googlePayload.email.toLowerCase(),
                name: googlePayload.name || googlePayload.email.split('@')[0],
                googleId: googlePayload.sub,
                profilePicture: googlePayload.picture,
                emailVerified: true,
                subscriptionStatus: 'none',
                purchasedKits: [],
                completedQuestions: [],
            });
        }

        // Create signed session token and set cookie
        const sessionToken = createSessionToken({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
                purchasedKits: user.purchasedKits || [],
            },
        });

        response.headers.set('Set-Cookie', getSessionCookieString(sessionToken));
        return response;

    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
