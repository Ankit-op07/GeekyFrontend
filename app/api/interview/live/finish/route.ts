import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';
import { AI_INTERVIEW } from '@/lib/appConstants';
import { callGeminiJSON, GeminiError } from '@/lib/gemini';
import { contextFromParts, systemPrompt, gradePrompt, sanitizeReport, istDateStr } from '@/lib/interview';
import { refundDailySlot } from '@/lib/interview-data';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Line { role: string; text: string }

/** Pair a spoken transcript into {question,answer}: each AI line opens a turn,
 *  following user line(s) answer it. Each line's text is length-bounded. */
function toTurns(transcript: Line[]): { question: string; answer: string }[] {
    const turns: { question: string; answer: string }[] = [];
    let cur: { question: string; answer: string } | null = null;
    for (const t of transcript.slice(0, 200)) {
        const text = String(t?.text || '').trim().slice(0, 4000);
        if (!text) continue;
        if (t?.role !== 'user') {
            if (cur) turns.push(cur);
            cur = { question: text, answer: '' };
        } else {
            if (!cur) cur = { question: '(opening)', answer: '' };
            cur.answer = ((cur.answer ? cur.answer + ' ' : '') + text).slice(0, 8000);
        }
    }
    if (cur) turns.push(cur);
    return turns;
}

/**
 * POST /api/interview/live/finish  { sessionId, transcript: [{role,text}] }
 * Grades a completed VOICE interview from the client-collected transcript (the
 * server isn't in the audio path). Only voice sessions are gradeable here — text
 * sessions have server-owned transcripts and must NOT be graded from client data.
 * If the candidate never actually answered, the reserved daily slot is REFUNDED
 * and the session marked abandoned (no meaningless grade, no burned slot).
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => null);
        const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
        const transcript: Line[] = Array.isArray(body?.transcript) ? body.transcript : [];
        if (!mongoose.isValidObjectId(sessionId)) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
        }

        await connectToDatabase();
        // Scope to the caller's own VOICE session — never grade a text session
        // (server-owned, un-forgeable) from a client-supplied transcript.
        const doc = (await InterviewSession.findOne({ _id: sessionId, userId: session.id, channel: 'voice' })) as any;
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Idempotent terminal states.
        if (doc.status === 'completed') {
            return NextResponse.json({ sessionId: String(doc._id), report: doc.report, roundLabel: doc.roundLabel });
        }
        if (doc.status === 'abandoned') {
            return NextResponse.json({ aborted: true });
        }

        const turns = toTurns(transcript);
        const answered = turns.filter((t) => t.answer.trim()).length;

        // Ended with nothing to grade → refund the slot, don't bill a grade.
        if (answered === 0) {
            await refundDailySlot(session.id, 'voiceUsage', istDateStr(new Date(doc.createdAt)));
            doc.status = 'abandoned';
            await doc.save();
            return NextResponse.json({ aborted: true });
        }

        // Persist the transcript before the risky grading call (retry-safe).
        doc.turns = turns;
        await doc.save();

        const ctx = contextFromParts({
            mode: doc.mode, round: doc.round, roundLabel: doc.roundLabel, focus: doc.focus,
        });
        const raw = await callGeminiJSON<any>({
            system: systemPrompt(ctx),
            user: gradePrompt(ctx, turns),
            model: AI_INTERVIEW.GRADE_MODEL,
            temperature: 0.3,
        });

        doc.report = sanitizeReport(raw);
        doc.status = 'completed';
        await doc.save();

        return NextResponse.json({ sessionId: String(doc._id), report: doc.report, roundLabel: doc.roundLabel });
    } catch (error: any) {
        const status = error instanceof GeminiError ? error.status : 500;
        console.error('POST /api/interview/live/finish error:', error?.message);
        return NextResponse.json({ error: 'Could not grade the interview.' }, { status });
    }
}
