import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import QuizAttempt from '@/lib/models/QuizAttempt';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveTopicAccess } from '@/lib/learn-access';
import { logActivity } from '@/lib/activity';

/**
 * POST /api/quiz/attempt
 * Body: { questionId, chosenIndex, kitSlug, topicSlug }
 *
 * Grades a quiz answer server-side against the DB (so the answer key never ships
 * to the client before the learner commits) and records the attempt — the raw
 * material for the §7 attempt-rate go/no-go gate.
 *
 * Access mirrors the reader via resolveTopicAccess(): grading a question is
 * reading its answer and explanation, which is paid content on a paid chapter.
 *
 * Trust note (PRD-005 §6.5): this is a learning signal, not a ranked one. A
 * determined user could POST a different chosenIndex; cheating a self-check only
 * cheats themselves. Nothing here feeds a leaderboard.
 */
export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
        }

        const { questionId, chosenIndex, kitSlug, topicSlug } = body;
        if (typeof questionId !== 'string' || !mongoose.isValidObjectId(questionId)) {
            return NextResponse.json({ error: 'Unknown question' }, { status: 404 });
        }
        if (typeof kitSlug !== 'string' || typeof topicSlug !== 'string') {
            return NextResponse.json({ error: 'Missing kit or topic' }, { status: 400 });
        }

        await connectToDatabase();

        const access = await resolveTopicAccess({ userId: session.id, kitSlug, topicSlug });
        if (!access.canRead || !access.topic) {
            return NextResponse.json({ error: 'locked', isPreview: true }, { status: 403 });
        }

        const question = (await QuizQuestion.findById(questionId)
            .select('correctIndex explanation options status topicId')
            .lean()) as any;

        // Must be live AND actually belong to the topic the caller claims — else
        // a caller could grade any question in the catalogue by naming a topic
        // they happen to have access to, and pollute that topic's pass rate.
        if (
            !question ||
            question.status !== 'live' ||
            String(question.topicId ?? '') !== String(access.topic._id)
        ) {
            return NextResponse.json({ error: 'Unknown question' }, { status: 404 });
        }

        if (
            typeof chosenIndex !== 'number' ||
            !Number.isInteger(chosenIndex) ||
            chosenIndex < 0 ||
            chosenIndex >= question.options.length
        ) {
            return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });
        }

        const correct = chosenIndex === question.correctIndex;

        // Non-critical: a failed write must not block the learner's reveal.
        // A duplicate key here is the EXPECTED path for a re-answer — the first
        // attempt is the one that counts (see QuizAttempt) — so it is success,
        // not an error to report.
        let firstAttempt = false;
        try {
            await QuizAttempt.create({
                userId: session.id,
                questionId,
                kitId: access.kit?._id,
                kitSlug,
                topicSlug,
                chosenIndex,
                correct,
                hadAccess: access.hasFullAccess,
            });
            firstAttempt = true;
        } catch (e: any) {
            if (e?.code !== 11000) {
                /* signal loss is acceptable; grading still returns */
            }
        }

        // Behaviour log for the admin Live Users view (best-effort, non-blocking).
        // Only on the FIRST attempt — mirror QuizAttempt's dedupe so re-answers
        // don't flood the behaviour timeline with repeat rows.
        if (firstAttempt) {
            await logActivity({
                session,
                event: 'quiz_attempt',
                path: `/learn/${kitSlug}/${topicSlug}`,
                meta: { kitSlug, topicSlug, correct },
            });
        }

        return NextResponse.json({
            correct,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
