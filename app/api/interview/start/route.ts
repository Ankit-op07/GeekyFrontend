import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';
import { AI_INTERVIEW } from '@/lib/appConstants';
import { callGemini, GeminiError } from '@/lib/gemini';
import {
    resolveContext, systemPrompt, firstQuestionPrompt, checkAccess, istDateStr,
    type InterviewMode,
} from '@/lib/interview';
import { loadKitContext, reserveDailySlot, refundDailySlot } from '@/lib/interview-data';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/interview/start  { mode, round, kitSlug? }
 * Buyer-gated. Atomically reserves one of the day's interview slots, then asks
 * Gemini for the first question and creates a server-owned session. The slot is
 * refunded if the model call fails. Returns { sessionId, question, remaining }.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => null);
        const mode: InterviewMode = body?.mode === 'kit' ? 'kit' : 'role';
        const round = typeof body?.round === 'string' ? body.round : '';
        const kitSlug = typeof body?.kitSlug === 'string' ? body.kitSlug : undefined;
        if (!round) return NextResponse.json({ error: 'Missing round' }, { status: 400 });

        await connectToDatabase();
        const user = (await CompanyKitUser.findById(session.id).select('purchasedKits').lean()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (!checkAccess(user.purchasedKits, mode, kitSlug)) {
            return NextResponse.json({ error: 'locked' }, { status: 403 });
        }

        // Atomically reserve one of today's slots (race-safe; see reserveDailySlot).
        const today = istDateStr();
        const newCount = await reserveDailySlot(session.id, 'interviewUsage', AI_INTERVIEW.DAILY_LIMIT, today);
        if (newCount === null) {
            return NextResponse.json(
                { error: 'daily-limit', limit: AI_INTERVIEW.DAILY_LIMIT },
                { status: 429 },
            );
        }

        try {
            const kitCtx = mode === 'kit' && kitSlug ? await loadKitContext(kitSlug) : {};
            const ctx = resolveContext(mode, round, kitCtx);

            const question = (await callGemini({
                system: systemPrompt(ctx),
                user: firstQuestionPrompt(),
                model: AI_INTERVIEW.QUESTION_MODEL,
                temperature: 0.8,
                maxOutputTokens: 512,
            })).trim();

            const doc = await InterviewSession.create({
                userId: session.id,
                mode,
                round: ctx.round,
                roundLabel: ctx.roundLabel,
                kitSlug: mode === 'kit' ? kitSlug : undefined,
                channel: 'text',
                focus: ctx.focus,
                status: 'active',
                turns: [{ question, answer: '' }],
            });

            return NextResponse.json({
                sessionId: String(doc._id),
                question,
                roundLabel: ctx.roundLabel,
                remaining: AI_INTERVIEW.DAILY_LIMIT - newCount,
            });
        } catch (inner) {
            // Refund the reserved slot so a transient model failure doesn't burn it.
            await refundDailySlot(session.id, 'interviewUsage', today);
            throw inner;
        }
    } catch (error: any) {
        const status = error instanceof GeminiError ? error.status : 500;
        console.error('POST /api/interview/start error:', error?.message);
        const msg = error instanceof GeminiError
            ? 'The AI interviewer is temporarily unavailable (rate limited). Please try again shortly.'
            : 'Could not start interview';
        return NextResponse.json({ error: msg }, { status });
    }
}
