import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import DsaList, { DSA_LIST_NAME_MAX } from '@/lib/models/DsaList';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveDsaAccess, dsaDenied } from '@/lib/dsa-access';
import { getProblem } from '@/lib/dsa';

/**
 * Routes for one list: rename it, delete it, or change its membership.
 *
 * ⚠️  EVERY query filters on BOTH `_id` and `userId`. Looking a list up by id
 * alone and then comparing owners in JS is the shape that leaks another user's
 * data the day someone forgets the comparison. Putting the owner in the filter
 * means a request for someone else's list simply matches nothing — the check
 * cannot be forgotten because it is not a separate step.
 */

/** A malformed id would throw inside Mongoose; reject it as a 404 instead. */
function isValidId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
}

/** PATCH /api/dsa/lists/[listId]   { name }  — rename. */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ listId: string }> }
) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        const { listId } = await params;
        if (!isValidId(listId)) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 });
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

        try {
            const updated = await DsaList.findOneAndUpdate(
                { _id: listId, userId: access.userId },   // owner in the FILTER
                { $set: { name } },
                { new: true }
            )
                .select('name problemIds')
                .lean() as { _id: unknown; name: string; problemIds?: string[] } | null;

            if (!updated) {
                return NextResponse.json({ error: 'List not found' }, { status: 404 });
            }
            return NextResponse.json({
                list: {
                    id: String(updated._id),
                    name: updated.name,
                    problemIds: updated.problemIds || [],
                },
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                return NextResponse.json(
                    { error: 'You already have a list with that name' },
                    { status: 409 }
                );
            }
            throw err;
        }
    } catch (error: any) {
        console.error('DSA list rename error:', error.message);
        return NextResponse.json({ error: 'Failed to rename the list' }, { status: 500 });
    }
}

/** DELETE /api/dsa/lists/[listId] — remove the list. Problems are untouched. */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ listId: string }> }
) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        const { listId } = await params;
        if (!isValidId(listId)) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 });
        }

        await connectToDatabase();
        // Deleting a list never touches progress, notes or stars — it is a
        // grouping, not a container. Losing it must not lose solved ticks.
        const res = await DsaList.deleteOne({ _id: listId, userId: access.userId });
        if (res.deletedCount === 0) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('DSA list delete error:', error.message);
        return NextResponse.json({ error: 'Failed to delete the list' }, { status: 500 });
    }
}

/**
 * PUT /api/dsa/lists/[listId]   { problemId, member: boolean }
 *
 * Add or remove one problem.
 *
 * `$addToSet` rather than `$push`: adding a problem already in the list must be
 * a no-op, not a duplicate row. That makes the toggle idempotent, which matters
 * because the client fires it optimistically and a retry after a flaky
 * connection must not double-add.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ listId: string }> }
) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        const { listId } = await params;
        if (!isValidId(listId)) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 });
        }

        const body = await request.json().catch(() => null);
        const rawProblemId = typeof body?.problemId === 'string' ? body.problemId : '';
        const member = body?.member;

        if (typeof member !== 'boolean') {
            return NextResponse.json({ error: 'member must be a boolean' }, { status: 400 });
        }

        // Match, do not trust — an unvalidated id would render as a dead row.
        const match = getProblem(rawProblemId);
        if (!match) {
            return NextResponse.json({ error: 'Unknown problem' }, { status: 400 });
        }
        const problemId = match.problem.id;

        await connectToDatabase();

        const updated = await DsaList.findOneAndUpdate(
            { _id: listId, userId: access.userId },
            member
                ? { $addToSet: { problemIds: problemId } }   // idempotent add
                : { $pull: { problemIds: problemId } },
            { new: true }
        )
            .select('name problemIds')
            .lean() as { _id: unknown; name: string; problemIds?: string[] } | null;

        if (!updated) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 });
        }
        return NextResponse.json({
            list: {
                id: String(updated._id),
                name: updated.name,
                problemIds: updated.problemIds || [],
            },
        });
    } catch (error: any) {
        console.error('DSA list membership error:', error.message);
        return NextResponse.json({ error: 'Failed to update the list' }, { status: 500 });
    }
}
