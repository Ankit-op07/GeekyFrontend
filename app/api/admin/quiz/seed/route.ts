import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Topic from '@/lib/models/Topic';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { requireAdmin } from '@/lib/admin-auth';
import { getQuestionsForTopic } from '@/lib/quiz/phase0-questions';
import { verifyPredictOutput } from '@/lib/quiz/verify-output';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/quiz/seed   Body: { kitId? }
 *
 * One-time bootstrap: promotes the static Phase-0 starter questions
 * (lib/quiz/phase0-questions.ts) into DB rows, for a topic whose TITLE names the
 * concept the question tests.
 *
 * ⚠ HISTORY — why the guards below exist. This route once matched keywords
 * against each topic's full lesson content, which made 8 questions fan out into
 * 186 near-duplicate live rows across 62 topics. Two things stop that now:
 *   1. getQuestionsForTopic() matches title+slug only, never body text.
 *   2. A topic that ALREADY has questions is skipped entirely — real authored
 *      questions outrank generic starters, and this route must never dilute them.
 *
 * Consequently this is a no-op on a populated database, which is the intended
 * end state: it is a bootstrap for empty topics, not a content source.
 *
 * Seeded questions are created `live` (hand-written and reviewed); AI/manual ones
 * start as `draft`.
 */
export async function POST(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const body = await req.json().catch(() => ({}));
        const kitFilter = body?.kitId ? { _id: body.kitId } : {};

        const kits = await Kit.find(kitFilter).select('_id').lean() as any[];
        if (kits.length === 0) {
            return NextResponse.json({ error: 'No kits found' }, { status: 404 });
        }

        let created = 0;
        let skipped = 0;
        let verified = 0;

        for (const kit of kits) {
            const topics = await Topic.find({ kitId: kit._id })
                .select('_id title slug content')
                .lean() as any[];

            for (const topic of topics) {
                // Never dilute a topic that already has questions — see the
                // header. Authored content wins; starters are only for gaps.
                const already = await QuizQuestion.countDocuments({ topicId: topic._id });
                if (already > 0) {
                    skipped++;
                    continue;
                }

                const matches = getQuestionsForTopic(topic.title || '', topic.slug || '');
                for (const q of matches) {
                    const gate = await verifyPredictOutput({
                        code: q.code,
                        options: q.options,
                        correctIndex: q.correctIndex,
                    });
                    await QuizQuestion.create({
                        kitId: kit._id,
                        topicId: topic._id,
                        type: 'predict-output',
                        prompt: q.prompt,
                        code: q.code,
                        language: q.language || 'javascript',
                        options: q.options,
                        correctIndex: q.correctIndex,
                        explanation: q.explanation,
                        difficulty: 'medium',
                        tags: q.topics,
                        status: 'live',
                        source: 'seed',
                        verified: gate.status === 'match',
                        verifiedBy: gate.status === 'match' ? 'vm' : undefined,
                        verifyNote: `${gate.status}: ${gate.note}`,
                        order: 0,
                    });
                    created++;
                    if (gate.status === 'match') verified++;
                }
            }
        }

        return NextResponse.json({ created, skipped, verified });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
