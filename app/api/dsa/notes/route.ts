import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import DsaNote, { DSA_NOTE_MAX_LENGTH } from '@/lib/models/DsaNote';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveDsaAccess, dsaDenied } from '@/lib/dsa-access';
import { getProblem } from '@/lib/dsa';

/**
 * GET /api/dsa/notes                → every note this user has, newest first
 * GET /api/dsa/notes?problemId=xyz  → just that one
 *
 * The single-problem form is what the drawer calls when it opens. The list form
 * backs the "my notes" view — it exists so a learner can revise from their own
 * writing without clicking through 155 rows looking for the ones they annotated.
 *
 * Notes are private. There is no shape of this endpoint that returns another
 * user's note: `userId` always comes from the signed session, never a param.
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

        const problemId = request.nextUrl.searchParams.get('problemId');
        await connectToDatabase();

        if (problemId) {
            const match = getProblem(problemId);
            if (!match) {
                return NextResponse.json({ error: 'Unknown problem' }, { status: 400 });
            }
            const note = (await DsaNote.findOne({
                userId: access.userId,
                problemId: match.problem.id,
            })
                .select('problemId body updatedAt')
                .lean()) as { problemId: string; body: string; updatedAt: Date } | null;

            return NextResponse.json({
                note: note ? { problemId: note.problemId, body: note.body, updatedAt: note.updatedAt } : null,
            });
        }

        const notes = (await DsaNote.find({ userId: access.userId })
            .select('problemId body updatedAt')
            .sort({ updatedAt: -1 })
            .limit(300)
            .lean()) as { problemId: string; body: string; updatedAt: Date }[];

        // Titles are attached from the catalogue rather than denormalized onto
        // the row: the catalogue is authored code, so a renamed problem should
        // show its new title everywhere immediately. (Contrast savedJobs, which
        // DOES denormalize — because job rows expire and a reference would empty
        // itself. Nothing in lib/dsa expires.)
        return NextResponse.json({
            notes: notes
                .map((n) => {
                    const match = getProblem(n.problemId);
                    if (!match) return null; // problem retired from the sheet
                    return {
                        problemId: n.problemId,
                        title: match.problem.title,
                        sectionId: match.section.id,
                        sectionTitle: match.section.title,
                        body: n.body,
                        updatedAt: n.updatedAt,
                    };
                })
                .filter(Boolean),
        });
    } catch (error: any) {
        console.error('DSA notes read error:', error.message);
        return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 });
    }
}

/**
 * PUT /api/dsa/notes   { problemId, body }
 *
 * Create, update or delete one note. An empty (or whitespace-only) body DELETES
 * the row rather than storing "" — an emptied note is a note the learner got rid
 * of, and keeping a blank row would make it show up in the "my notes" list as a
 * phantom entry.
 *
 * Upsert against the unique (userId, problemId) index, so two tabs saving at
 * once cannot create a second note for the same problem.
 */
export async function PUT(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveDsaAccess(session);
        if (!access.canTrack || !access.userId) {
            // 401 for "who are you", 403 for "you need a membership" — see dsaDenied.
            const denied = dsaDenied(access);
            return NextResponse.json(denied.body, { status: denied.status });
        }

        const payload = await request.json().catch(() => null);
        const rawProblemId = typeof payload?.problemId === 'string' ? payload.problemId : '';
        const rawBody = typeof payload?.body === 'string' ? payload.body : '';

        const match = getProblem(rawProblemId);
        if (!match) {
            return NextResponse.json({ error: 'Unknown problem' }, { status: 400 });
        }
        const problemId = match.problem.id;

        if (rawBody.length > DSA_NOTE_MAX_LENGTH) {
            return NextResponse.json(
                { error: `Notes are limited to ${DSA_NOTE_MAX_LENGTH} characters` },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const body = rawBody.trim();
        if (!body) {
            await DsaNote.deleteOne({ userId: access.userId, problemId });
            return NextResponse.json({ ok: true, note: null });
        }

        const save = () =>
            DsaNote.findOneAndUpdate(
                { userId: access.userId, problemId },
                { $set: { body } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
                .select('problemId body updatedAt')
                .lean() as Promise<{ problemId: string; body: string; updatedAt: Date } | null>;

        let note: { problemId: string; body: string; updatedAt: Date } | null;
        try {
            note = await save();
        } catch (err: any) {
            // Two tabs saving the first version of the same note at once: both
            // upserts try to insert, one loses on the unique index. The row now
            // exists, so the retry is a plain update.
            if (err?.code !== 11000) throw err;
            note = await save();
        }

        return NextResponse.json({ ok: true, note });
    } catch (error: any) {
        console.error('DSA notes write error:', error.message);
        return NextResponse.json({ error: 'Failed to save the note' }, { status: 500 });
    }
}
