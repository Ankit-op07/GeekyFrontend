import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';
import { AI_INTERVIEW } from '@/lib/appConstants';
import { callGemini, GeminiError } from '@/lib/gemini';
import { contextFromParts, systemPrompt, nextQuestionPrompt } from '@/lib/interview';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/interview/next  { sessionId, answer }
 * Records the answer to the current question on the SERVER-owned session (the
 * client can't fabricate the transcript), then returns the next question — or
 * { done:true } once QUESTION_COUNT questions have been answered. Bounded by the
 * persisted turn count, so it can't be hammered for unbounded Gemini calls.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => null);
        const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
        const answer = typeof body?.answer === 'string' ? body.answer.trim().slice(0, 8000) : '';
        if (!mongoose.isValidObjectId(sessionId)) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
        }

        await connectToDatabase();
        // Scope to the caller + active status — never advance someone else's or a
        // finished interview.
        const doc = (await InterviewSession.findOne({
            _id: sessionId, userId: session.id, status: 'active',
        })) as any;
        if (!doc) return NextResponse.json({ error: 'not-active' }, { status: 409 });

        // Record the answer to the current (last) question.
        if (doc.turns.length > 0) {
            doc.turns[doc.turns.length - 1].answer = answer;
        }

        // Interview ends once QUESTION_COUNT questions have been answered.
        if (doc.turns.length >= AI_INTERVIEW.QUESTION_COUNT) {
            await doc.save();
            return NextResponse.json({ done: true });
        }

        const ctx = contextFromParts({
            mode: doc.mode, round: doc.round, roundLabel: doc.roundLabel, focus: doc.focus,
        });
        const question = (await callGemini({
            system: systemPrompt(ctx),
            user: nextQuestionPrompt(doc.turns.map((t: any) => ({ question: t.question, answer: t.answer }))),
            model: AI_INTERVIEW.QUESTION_MODEL,
            temperature: 0.8,
            maxOutputTokens: 512,
        })).trim();

        doc.turns.push({ question, answer: '' });
        await doc.save();

        return NextResponse.json({ question, done: false });
    } catch (error: any) {
        const status = error instanceof GeminiError ? error.status : 500;
        console.error('POST /api/interview/next error:', error?.message);
        const msg = error instanceof GeminiError
            ? 'The AI interviewer is temporarily unavailable (rate limited). Please try again shortly.'
            : 'Could not get next question';
        return NextResponse.json({ error: msg }, { status });
    }
}
