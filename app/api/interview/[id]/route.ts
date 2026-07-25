import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * GET /api/interview/[id]
 * Full report + transcript for one of the caller's own interviews.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        }

        await connectToDatabase();
        // Scope to the caller — never expose another user's interview.
        const doc = (await InterviewSession.findOne({ _id: id, userId: session.id }).lean()) as any;
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({
            id: String(doc._id),
            mode: doc.mode,
            round: doc.round,
            roundLabel: doc.roundLabel,
            kitSlug: doc.kitSlug || null,
            turns: doc.turns || [],
            report: doc.report,
            createdAt: doc.createdAt,
        });
    } catch (error: any) {
        console.error('GET /api/interview/[id] error:', error?.message);
        return NextResponse.json({ error: 'Could not load interview' }, { status: 500 });
    }
}
