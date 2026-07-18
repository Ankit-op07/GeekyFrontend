import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveTopicAccess } from '@/lib/learn-access';
import { MAX_QUESTIONS_PER_TOPIC } from '@/lib/quiz/constants';

/**
 * GET /api/quiz/questions?kit=<kitSlug>&topic=<topicSlug>
 *
 * Returns the live quiz questions for this topic, answer key STRIPPED (no
 * correctIndex, no explanation). Grading happens in POST /api/quiz/attempt.
 *
 * Access mirrors the reader exactly, via the shared resolveTopicAccess() —
 * quiz content for a paid chapter is paid content, and a session alone is not
 * entitlement. Returns an empty list rather than an error for missing kits and
 * topics: an absent quiz is a normal state, not a failure.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const kitSlug = searchParams.get('kit');
        const topicSlug = searchParams.get('topic');
        if (!kitSlug || !topicSlug) {
            return NextResponse.json({ error: 'Missing kit or topic' }, { status: 400 });
        }

        await connectToDatabase();

        const access = await resolveTopicAccess({ userId: session.id, kitSlug, topicSlug });
        if (access.reason === 'locked') {
            return NextResponse.json(
                { error: 'locked', isPreview: true, questions: [] },
                { status: 403 }
            );
        }
        if (!access.canRead || !access.topic) {
            // kit/topic/user not found — nothing to show, and nothing worth
            // distinguishing for the client.
            return NextResponse.json({ questions: [] });
        }

        const docs = (await QuizQuestion.find({ topicId: access.topic._id, status: 'live' })
            .sort({ order: 1, createdAt: 1 })
            .limit(MAX_QUESTIONS_PER_TOPIC)
            .lean()) as any[];

        const questions = docs.map((d) => ({
            id: String(d._id),
            type: d.type || 'predict-output',
            prompt: d.prompt,
            code: d.code || '',
            language: d.language || 'javascript',
            options: d.options,
        }));

        return NextResponse.json({ questions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
