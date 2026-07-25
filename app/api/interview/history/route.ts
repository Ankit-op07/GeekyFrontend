import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import InterviewSession from '@/lib/models/InterviewSession';
import { extractSessionFromRequest } from '@/lib/session';
import { AI_INTERVIEW } from '@/lib/appConstants';
import { istDateStr } from '@/lib/interview';

export const runtime = 'nodejs';

/**
 * GET /api/interview/history
 * The caller's past AI interviews (newest first) plus today's remaining quota,
 * for the dashboard AI Interview tab.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const [user, sessions] = await Promise.all([
            CompanyKitUser.findById(session.id).select('interviewUsage').lean() as any,
            InterviewSession.find({ userId: session.id, status: 'completed' })
                .select('mode round roundLabel kitSlug report.overallScore report.summary createdAt')
                .sort({ createdAt: -1 })
                .limit(30)
                .lean() as any,
        ]);

        const today = istDateStr();
        const usedToday = user?.interviewUsage?.date === today ? user.interviewUsage.count : 0;

        return NextResponse.json({
            sessions: (sessions || []).map((s: any) => ({
                id: String(s._id),
                mode: s.mode,
                round: s.round,
                roundLabel: s.roundLabel,
                kitSlug: s.kitSlug || null,
                overallScore: s.report?.overallScore ?? 0,
                summary: s.report?.summary || '',
                createdAt: s.createdAt,
            })),
            remaining: Math.max(0, AI_INTERVIEW.DAILY_LIMIT - usedToday),
            dailyLimit: AI_INTERVIEW.DAILY_LIMIT,
            questionCount: AI_INTERVIEW.QUESTION_COUNT,
        });
    } catch (error: any) {
        console.error('GET /api/interview/history error:', error?.message);
        return NextResponse.json({ error: 'Could not load history' }, { status: 500 });
    }
}
