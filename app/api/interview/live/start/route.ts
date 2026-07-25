import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';
import { AI_INTERVIEW } from '@/lib/appConstants';
import { mintLiveToken, buildLiveConfig } from '@/lib/gemini-live';
import { resolveContext, systemPrompt, checkAccess, istDateStr, type InterviewMode } from '@/lib/interview';
import { loadKitContext, reserveDailySlot, refundDailySlot } from '@/lib/interview-data';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/interview/live/start  { mode, round, kitSlug? }
 * Buyer-gated. Reserves a VOICE slot (separate 2/day cap), creates the session,
 * and mints a short-lived ephemeral token the browser uses to connect directly
 * to Gemini Live. Refunds the slot if minting fails.
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

        const today = istDateStr();
        const newCount = await reserveDailySlot(session.id, 'voiceUsage', AI_INTERVIEW.VOICE_DAILY_LIMIT, today);
        if (newCount === null) {
            return NextResponse.json(
                { error: 'daily-limit', limit: AI_INTERVIEW.VOICE_DAILY_LIMIT },
                { status: 429 },
            );
        }

        try {
            const kitCtx = mode === 'kit' && kitSlug ? await loadKitContext(kitSlug) : {};
            const ctx = resolveContext(mode, round, kitCtx);
            const instruction = `${systemPrompt(ctx)} This is a SPOKEN interview conducted ENTIRELY in ENGLISH — speak only English regardless of the candidate's accent or any non-English words. Keep each turn short and conversational (1-2 sentences), ask one question at a time, and wait for the candidate to answer before continuing.`;

            // One config, used both to lock the token and by the browser to connect.
            const config = buildLiveConfig(instruction);
            const token = await mintLiveToken(config, AI_INTERVIEW.VOICE_MAX_SECONDS);

            const doc = await InterviewSession.create({
                userId: session.id, mode, round: ctx.round, roundLabel: ctx.roundLabel,
                kitSlug: mode === 'kit' ? kitSlug : undefined, channel: 'voice', focus: ctx.focus,
                status: 'active', turns: [],
            });

            return NextResponse.json({
                sessionId: String(doc._id),
                token,
                model: AI_INTERVIEW.LIVE_MODEL,
                config,
                roundLabel: ctx.roundLabel,
                maxSeconds: AI_INTERVIEW.VOICE_MAX_SECONDS,
                remaining: AI_INTERVIEW.VOICE_DAILY_LIMIT - newCount,
            });
        } catch (inner) {
            await refundDailySlot(session.id, 'voiceUsage', today);
            throw inner;
        }
    } catch (error: any) {
        console.error('POST /api/interview/live/start error:', error?.message);
        return NextResponse.json(
            { error: 'Could not start the voice interview. Please try again shortly.' },
            { status: 502 },
        );
    }
}
