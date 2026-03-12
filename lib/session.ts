/**
 * Session utilities — shared between API routes.
 * We use a simple signed session stored as an HTTP-only cookie named `gf_session`.
 * The token payload is: { id, email, name, exp }
 * It is HMAC-signed with SESSION_SECRET so it cannot be tampered with.
 */

import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'geeky-frontend-secret-change-in-production';
const SESSION_COOKIE = 'gf_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
    exp: number; // timestamp ms
}

function sign(payload: string): string {
    return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
    const full: SessionPayload = {
        ...payload,
        exp: Date.now() + SESSION_MAX_AGE * 1000,
    };
    const base = Buffer.from(JSON.stringify(full)).toString('base64url');
    const sig = sign(base);
    return `${base}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
    try {
        const lastDot = token.lastIndexOf('.');
        if (lastDot === -1) return null;
        const base = token.substring(0, lastDot);
        const sig = token.substring(lastDot + 1);
        const expectedSig = sign(base);
        if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
            return null;
        }
        const payload: SessionPayload = JSON.parse(Buffer.from(base, 'base64url').toString());
        if (payload.exp < Date.now()) return null; // expired
        return payload;
    } catch {
        return null;
    }
}

export function getSessionCookieString(token: string): string {
    return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function clearSessionCookieString(): string {
    return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function extractSessionFromRequest(request: Request): SessionPayload | null {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    if (!match) return null;
    return verifySessionToken(decodeURIComponent(match[1]));
}

export { SESSION_COOKIE };
