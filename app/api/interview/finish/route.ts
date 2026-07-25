import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';
import { AI_INTERVIEW } from '@/lib/appConstants';
import { callGeminiJSON, GeminiError } from '@/lib/gemini';
import { contextFromParts, systemPrompt, gradePrompt, sanitizeReport } from '@/lib/interview';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/interview/finish  { sessionId, answer? }
 * Grades the SERVER-owned transcript with Gemini, marks the session completed,
 * and returns the report. Idempotent: if already graded, returns the stored
 * report without another model call — so a retry after a transient failure
 * never burns the reserved daily slot.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => null);
        const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
        const answer = typeof body?.answer === 'string' ? body.answer.trim().slice(0, 8000) : null;
        if (!mongoose.isValidObjectId(sessionId)) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
        }

        await connectToDatabase();
        const doc = (await InterviewSession.findOne({ _id: sessionId, userId: session.id })) as any;
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Already graded — return the stored report (no extra Gemini call).
        if (doc.status === 'completed') {
            return NextResponse.json({ sessionId: String(doc._id), report: doc.report, roundLabel: doc.roundLabel });
        }

        if (doc.turns.length === 0) {
            return NextResponse.json({ error: 'Empty transcript' }, { status: 400 });
        }
        // Capture a final in-progress answer (e.g. the user hit "End") and persist
        // it BEFORE the risky grading call, so a retry after a transient Gemini
        // failure still has the full transcript.
        if (answer !== null) {
            doc.turns[doc.turns.length - 1].answer = answer;
            await doc.save();
        }

        const ctx = contextFromParts({
            mode: doc.mode, round: doc.round, roundLabel: doc.roundLabel, focus: doc.focus,
        });
        const transcript = doc.turns.map((t: any) => ({ question: t.question, answer: t.answer || '' }));

        const raw = await callGeminiJSON<any>({
            system: systemPrompt(ctx),
            user: gradePrompt(ctx, transcript),
            model: AI_INTERVIEW.GRADE_MODEL,
            temperature: 0.3,
        });

        // Sanitize the model output — never trust its shape.
        doc.report = sanitizeReport(raw);
        doc.status = 'completed';
        await doc.save();

        return NextResponse.json({ sessionId: String(doc._id), report: doc.report, roundLabel: doc.roundLabel });
    } catch (error: any) {
        const status = error instanceof GeminiError ? error.status : 500;
        console.error('POST /api/interview/finish error:', error?.message);
        const msg = error instanceof GeminiError
            ? 'The AI interviewer is temporarily unavailable (rate limited). Please try again shortly.'
            : 'Could not grade interview';
        return NextResponse.json({ error: msg }, { status });
    }
}
