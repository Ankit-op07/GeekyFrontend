// lib/dsa-access.ts
//
// The single source of truth for "who can see what" on the DSA sheet.
//
// THE DAY THIS FILE ANTICIPATED HAS ARRIVED — the sheet is now membership-gated,
// and the change was one file, exactly as intended.
//
// CONTENT STAYS PUBLIC; THE TRACKER DOES NOT.
// -------------------------------------------
// Problem statements, our approach pages and the video solutions remain readable
// by anyone, signed in or not. Neither reason is generosity:
//
//   • They are 155 statically generated, indexed pages — the top of the funnel
//     that sells the membership. Gating them deletes the thing that brings
//     people here.
//   • Nobody pays for tooling wrapped around content they have never seen.
//
// What a membership buys is the TRACKER: solved state, favourites, notes, lists,
// and the dashboard tab that pulls them together. That is the part with ongoing
// per-user value, which is what a recurring charge is for.
//
// If you later want the approach pages gated too, `canRead` below is the one
// place it changes and every surface follows. That was always the point.
//
// The original warning still stands: the quiz APIs once checked only "is there a
// session" and re-derived the content rule per route, which leaked paid
// questions to free signups because one route out of several forgot. Never
// re-derive access in a route — call `resolveDsaAccess()`.

import type { SessionPayload } from '@/lib/session';
import { resolveFeatureAccess } from '@/lib/feature-access';
import type { MembershipStatus } from '@/lib/membership-access';

export interface DsaAccess {
    /** Can this visitor read problem statements, approaches and videos? */
    canRead: boolean;
    /**
     * Can this visitor have progress/notes stored?
     *
     * Now requires an identity AND an active membership. Note what this does
     * NOT do: it never deletes anything. A lapsed member's solved ticks, notes
     * and lists stay in the database untouched and come straight back on
     * renewal. Destroying someone's notes because they stopped paying would be
     * indefensible, and it would also make renewal pointless.
     */
    canTrack: boolean;
    /** The user id to key progress by, or null for a signed-out visitor. */
    userId: string | null;
    /** Membership state, so a route can tell "sign in" from "subscribe". */
    membership: MembershipStatus;
    /** 'needs-auth' | 'needs-membership' when canTrack is false. */
    reason: string;
}

/**
 * Resolve what a visitor may do with the DSA sheet.
 *
 * `session` is the verified session payload (or null). Pass the result of
 * `extractSessionFromRequest()`; never anything derived from a request body —
 * the point is that identity here is signed.
 *
 * ASYNC as of the membership tier: the answer now depends on a stored expiry,
 * so it needs a database read. Callers must have run connectToDatabase().
 */
export async function resolveDsaAccess(session: SessionPayload | null): Promise<DsaAccess> {
    const access = await resolveFeatureAccess(session?.id ?? null, 'dsa');

    return {
        // Public — see the header before changing this.
        canRead: true,
        canTrack: access.allowed,
        userId: session?.id ?? null,
        membership: access.membership,
        reason: access.reason,
    };
}

/**
 * The standard refusal for a tracker write, so all eight write paths answer
 * identically.
 *
 * 401 vs 403 is the point. A signed-in non-member who is told "Unauthorized"
 * with a 401 will try logging in again, fail to see any change, and conclude the
 * site is broken — the status code has to distinguish "we do not know who you
 * are" from "we know exactly who you are and this needs a membership".
 */
export function dsaDenied(access: DsaAccess): { body: Record<string, unknown>; status: number } {
    const needsAuth = access.reason === 'needs-auth';
    return {
        body: {
            error: needsAuth
                ? 'Sign in to track your progress.'
                : 'A membership is required to track DSA progress.',
            reason: access.reason,
            membership: {
                active: access.membership.active,
                expiresAt: access.membership.expiresAt,
            },
        },
        status: needsAuth ? 401 : 403,
    };
}
