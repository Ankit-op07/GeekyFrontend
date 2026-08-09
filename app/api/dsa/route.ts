import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import DsaProgress from '@/lib/models/DsaProgress';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveDsaAccess } from '@/lib/dsa-access';
import { SECTIONS, DSA_SHEET, TOTAL_PROBLEMS, hasApproach } from '@/lib/dsa';

/**
 * GET /api/dsa
 *
 * The whole sheet plus this user's ticks, in ONE request.
 *
 * WHY ONE REQUEST AND NOT ONE PER SECTION
 * ---------------------------------------
 * The catalogue is authored code (lib/dsa), so serialising all 17 sections
 * costs no database work at all — the only query is the single progress
 * document. Paginating by section would turn a free response into 17 round
 * trips on a connection that, for most of our users, is the expensive part.
 * Gzipped this is a few kilobytes.
 *
 * `sources` of truth to keep straight: everything under `sections` comes from
 * git and is identical for every visitor; everything under `progress` is
 * per-user. The client never merges them into one object, so a caching layer
 * can treat the first as static.
 *
 * Signed out is a valid state — the sheet is free to read. You just get an
 * empty progress map and `canTrack: false`, which is what greys out the ticks.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);

        let progress: Record<string, unknown> = {};

        if (access.canTrack && access.userId) {
            await connectToDatabase();
            const row = (await DsaProgress.findOne({ userId: access.userId })
                .select('problems')
                .lean()) as { problems?: Record<string, unknown> } | null;
            progress = row?.problems || {};
        }

        return NextResponse.json({
            sheet: {
                id: DSA_SHEET.id,
                title: DSA_SHEET.title,
                tagline: DSA_SHEET.tagline,
                totalProblems: TOTAL_PROBLEMS,
            },
            sections: SECTIONS.map((section) => ({
                id: section.id,
                title: section.title,
                blurb: section.blurb,
                goal: section.goal,
                est: section.est,
                accent: section.accent,
                youtubeVideoId: section.youtubeVideoId ?? null,
                problems: section.problems.map((p) => ({
                    id: p.id,
                    title: p.title,
                    difficulty: p.difficulty,
                    platform: p.platform,
                    externalUrl: p.externalUrl,
                    tags: p.tags,
                    companies: p.companies ?? [],
                    youtubeVideoId: p.youtubeVideoId ?? null,
                    // Computed server-side so the client never has to guess
                    // whether /dsa/<section>/<problem> exists — an optimistic
                    // link into a 404 is worse than an honest "coming soon".
                    hasApproach: hasApproach(p.id),
                })),
            })),
            progress,
            canTrack: access.canTrack,
            /* WHY tracking is off, so the client shows the right prompt.
             * "Sign in" and "Subscribe" are very different asks, and a signed-in
             * non-member told to sign in concludes the site is broken. The sheet
             * itself is returned in full either way — the content is public,
             * only the ticks are gated. */
            accessReason: access.reason,
            membership: {
                active: access.membership.active,
                expiresAt: access.membership.expiresAt,
                daysRemaining: access.membership.daysRemaining,
            },
        });
    } catch (error: any) {
        console.error('DSA sheet error:', error.message);
        return NextResponse.json({ error: 'Failed to load the sheet' }, { status: 500 });
    }
}
