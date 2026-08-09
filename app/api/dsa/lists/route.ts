import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import DsaList, { DSA_MAX_LISTS, DSA_LIST_NAME_MAX } from '@/lib/models/DsaList';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveDsaAccess, dsaDenied } from '@/lib/dsa-access';

/**
 * GET /api/dsa/lists — every list this user owns, with their membership.
 *
 * Returns the full `problemIds` array rather than a count, because the tracker
 * needs to answer "which lists is THIS problem in?" for 155 rows at once. A
 * count would force one request per row; the arrays are bounded by the
 * catalogue size, so the whole payload is a few kilobytes.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        await connectToDatabase();
        const lists = (await DsaList.find({ userId: access.userId })
            .select('name problemIds updatedAt')
            .sort({ createdAt: 1 })
            .lean()) as { _id: unknown; name: string; problemIds?: string[] }[];

        return NextResponse.json({
            lists: lists.map((l) => ({
                id: String(l._id),
                name: l.name,
                problemIds: l.problemIds || [],
            })),
        });
    } catch (error: any) {
        console.error('DSA lists read error:', error.message);
        return NextResponse.json({ error: 'Failed to load lists' }, { status: 500 });
    }
}

/**
 * POST /api/dsa/lists   { name }
 *
 * Create a list. The unique (userId, name) index is what makes this safe
 * against a double-click: the loser gets a duplicate-key error, which is
 * reported as a friendly 409 rather than a 500.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        const body = await request.json().catch(() => null);
        const name = typeof body?.name === 'string' ? body.name.trim() : '';

        if (!name) {
            return NextResponse.json({ error: 'A list needs a name' }, { status: 400 });
        }
        if (name.length > DSA_LIST_NAME_MAX) {
            return NextResponse.json(
                { error: `Names are limited to ${DSA_LIST_NAME_MAX} characters` },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Checked before inserting rather than relying on the index, so the
        // limit produces a clear message instead of a generic write failure.
        const count = await DsaList.countDocuments({ userId: access.userId });
        if (count >= DSA_MAX_LISTS) {
            return NextResponse.json(
                { error: `You can have at most ${DSA_MAX_LISTS} lists` },
                { status: 400 }
            );
        }

        try {
            const created = await DsaList.create({
                userId: access.userId,
                name,
                problemIds: [],
            });
            return NextResponse.json({
                list: { id: String(created._id), name: created.name, problemIds: [] },
            });
        } catch (err: any) {
            // Unique index on (userId, name), case-insensitive.
            if (err?.code === 11000) {
                return NextResponse.json(
                    { error: 'You already have a list with that name' },
                    { status: 409 }
                );
            }
            throw err;
        }
    } catch (error: any) {
        console.error('DSA list create error:', error.message);
        return NextResponse.json({ error: 'Failed to create the list' }, { status: 500 });
    }
}
