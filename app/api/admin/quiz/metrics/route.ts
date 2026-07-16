import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import QuizAttempt from '@/lib/models/QuizAttempt';
import QuizQuestion from '@/lib/models/QuizQuestion';
import Topic from '@/lib/models/Topic';
import Kit from '@/lib/models/Kit';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/**
 * GET /api/admin/quiz/metrics?days=30
 *
 * The Phase-0 go/no-go number, plus the content health that decides whether it
 * means anything.
 *
 * WHY THIS EXISTS
 * ---------------
 * PRD-005 §7 gates the entire rest of the PRD on "≥30% of active learners
 * attempt one". Phase 0 shipped collecting QuizAttempt rows and nothing that
 * turns them into that number — so the gate could not be evaluated, and the
 * feature could not answer the only question it was built to answer.
 *
 * ⚠ ON THE DENOMINATOR — read before trusting `gate.preview`
 * -----------------------------------------------------------
 * "Attempt rate" needs a population. The only activity signal in the app is
 * `CompanyKitUser.lastActiveDate`, and app/api/learn/kits/[kitSlug]/[topicSlug]
 * only records it `if (hasAccess)` — i.e. for BUYERS. Preview users read topics
 * without leaving any trace.
 *
 * So:
 *   • buyers  — a real rate. Numerator and denominator both exist.
 *   • preview — attempt COUNTS only. There is no denominator, so there is no
 *     rate, and this endpoint refuses to invent one.
 *
 * That matters more than it sounds: PRD-005 §15 item 2 says the gate is
 * meaningless if it measures buyers, because Path A is a conversion play
 * validated by NON-buyers practising. The population the gate cares about is
 * precisely the one with no denominator. Making `gate.preview.rate` real needs a
 * preview-side activity signal; until then the buyer rate is a health metric,
 * not the go/no-go.
 */

/** Below this many attempts, a pass rate is noise, not a signal. */
const MIN_ATTEMPTS_TO_FLAG = 5;
/** PRD-005 §9 auto-flag thresholds. */
const TOO_EASY = 0.9;
const TOO_HARD = 0.1;

export async function GET(req: NextRequest) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();

        const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days')) || 30, 1), 365);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [windowed, buyersActive, perKitRaw, coverageRaw, questionStats, liveUnverified] =
            await Promise.all([
                // ── attempts in the window, split buyer vs preview ──
                QuizAttempt.aggregate([
                    { $match: { createdAt: { $gte: since } } },
                    {
                        $group: {
                            _id: '$hadAccess',
                            attempts: { $sum: 1 },
                            correct: { $sum: { $cond: ['$correct', 1, 0] } },
                            users: { $addToSet: '$userId' },
                        },
                    },
                    {
                        $project: {
                            hadAccess: '$_id',
                            attempts: 1,
                            correct: 1,
                            learners: { $size: '$users' },
                        },
                    },
                ]),

                // ── the only real denominator we have: active BUYERS ──
                CompanyKitUser.countDocuments({
                    lastActiveDate: { $gte: since },
                    purchasedKits: { $exists: true, $ne: [] },
                }),

                // ── per-kit rollup (all time) ──
                QuizAttempt.aggregate([
                    {
                        $group: {
                            _id: '$kitSlug',
                            attempts: { $sum: 1 },
                            correct: { $sum: { $cond: ['$correct', 1, 0] } },
                            users: { $addToSet: '$userId' },
                        },
                    },
                    {
                        $project: {
                            kitSlug: '$_id',
                            attempts: 1,
                            correct: 1,
                            learners: { $size: '$users' },
                        },
                    },
                    { $sort: { attempts: -1 } },
                ]),

                // ── coverage: which topics actually have a live quiz ──
                QuizQuestion.aggregate([
                    { $match: { status: 'live' } },
                    { $group: { _id: '$topicId', n: { $sum: 1 } } },
                ]),

                // ── per-question pass rate, for §9 auto-flagging ──
                QuizAttempt.aggregate([
                    {
                        $group: {
                            _id: '$questionId',
                            attempts: { $sum: 1 },
                            correct: { $sum: { $cond: ['$correct', 1, 0] } },
                        },
                    },
                    { $match: { attempts: { $gte: MIN_ATTEMPTS_TO_FLAG } } },
                ]),

                // Live questions nothing corroborated — the review debt.
                QuizQuestion.countDocuments({ status: 'live', verified: false }),
            ]);

        const bucket = (hadAccess: boolean) =>
            windowed.find((w: any) => w.hadAccess === hadAccess) || {
                attempts: 0,
                correct: 0,
                learners: 0,
            };
        const buyer = bucket(true);
        const preview = bucket(false);

        const totalTopics = await Topic.countDocuments();
        const topicsWithLive = coverageRaw.length;

        // Flagged questions: resolve prompts only for the ones that flagged.
        const flaggedIds = questionStats
            .filter((q: any) => {
                const rate = q.correct / q.attempts;
                return rate > TOO_EASY || rate < TOO_HARD;
            })
            .map((q: any) => q._id);

        const flaggedDocs = flaggedIds.length
            ? ((await QuizQuestion.find({
                  _id: { $in: flaggedIds.filter((id: string) => mongoose.isValidObjectId(id)) },
              })
                  .select('prompt type topicId')
                  .lean()) as any[])
            : [];
        const promptById = Object.fromEntries(flaggedDocs.map((d) => [String(d._id), d]));

        const flagged = questionStats
            .map((q: any) => {
                const passRate = q.correct / q.attempts;
                if (passRate <= TOO_EASY && passRate >= TOO_HARD) return null;
                return {
                    questionId: String(q._id),
                    prompt: promptById[String(q._id)]?.prompt ?? '(question no longer exists)',
                    type: promptById[String(q._id)]?.type ?? 'unknown',
                    attempts: q.attempts,
                    passRate: Number(passRate.toFixed(2)),
                    // >90% passing = trivial or the options give it away.
                    // <10% = broken, ambiguous, or the answer key is wrong.
                    flag: passRate > TOO_EASY ? 'too-easy' : 'likely-broken',
                };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => a.passRate - b.passRate);

        const kits = (await Kit.find({}).select('slug name').lean()) as any[];
        const kitName = Object.fromEntries(kits.map((k) => [k.slug, k.name]));

        return NextResponse.json({
            window: { days, since },
            gate: {
                target: 0.3,
                buyers: {
                    learnersAttempted: buyer.learners,
                    activeLearners: buyersActive,
                    // The §7 number — for buyers only.
                    rate: buyersActive > 0 ? Number((buyer.learners / buyersActive).toFixed(3)) : null,
                    attempts: buyer.attempts,
                },
                preview: {
                    learnersAttempted: preview.learners,
                    attempts: preview.attempts,
                    rate: null,
                    // Surfaced so the number is never read as if it were a rate.
                    note:
                        'No denominator: preview users have no activity record — ' +
                        'app/api/learn/.../[topicSlug] only writes lastActiveDate when hasAccess is true. ' +
                        'This is the population PRD-005 §15 says the gate actually depends on.',
                },
            },
            totals: {
                attempts: buyer.attempts + preview.attempts,
                learners: buyer.learners + preview.learners,
                correct: buyer.correct + preview.correct,
                accuracy:
                    buyer.attempts + preview.attempts > 0
                        ? Number(
                              (
                                  (buyer.correct + preview.correct) /
                                  (buyer.attempts + preview.attempts)
                              ).toFixed(3)
                          )
                        : null,
            },
            perKit: perKitRaw.map((k: any) => ({
                kitSlug: k.kitSlug,
                kitName: kitName[k.kitSlug] ?? k.kitSlug,
                attempts: k.attempts,
                learners: k.learners,
                correct: k.correct,
                accuracy: k.attempts ? Number((k.correct / k.attempts).toFixed(3)) : null,
            })),
            coverage: {
                topicsWithLiveQuiz: topicsWithLive,
                totalTopics,
                percent: totalTopics ? Number(((topicsWithLive / totalTopics) * 100).toFixed(1)) : 0,
            },
            health: {
                liveButUnverified: liveUnverified,
                flagged,
                minAttemptsToFlag: MIN_ATTEMPTS_TO_FLAG,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
