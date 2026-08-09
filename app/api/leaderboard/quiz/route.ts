import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import QuizAttempt from '@/lib/models/QuizAttempt';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import QuizQuestion from '@/lib/models/QuizQuestion';
import Kit from '@/lib/models/Kit';
import { extractSessionFromRequest } from '@/lib/session';

/**
 * GET /api/leaderboard/quiz[?kitSlug=...]
 *
 * Ranks learners by questions completed from the LEARNING-KIT end-of-topic
 * quizzes. It does not cover the DSA sheet — DSA progress is a self-ticked
 * checkbox (lib/models/DsaProgress), which is not a rankable signal. The UI
 * says so on the board itself; keep the two straight if this route ever grows
 * a second source.
 *
 * WHY THIS IS A HONEST LEADERBOARD, which is not true of most metrics we hold.
 * Almost every other progress signal on the platform is SELF-REPORTED — the DSA
 * tracker's "solved" tick and the reader's completed-topics list are both just
 * a user clicking a box, and a ranking built on either is gamed in an afternoon
 * by clicking 155 of them.
 *
 * Quiz attempts are different, for two reasons that already existed:
 *
 *   1. They are GRADED SERVER-SIDE. /api/quiz/questions strips the answer key
 *      before it reaches the browser and /api/quiz/attempt decides correctness.
 *      A learner cannot mark their own answer right.
 *
 *   2. They are FIRST-ATTEMPT-ONLY, via a unique index on (userId, questionId).
 *      A question counts once per person, and it counts as the answer they gave
 *      BEFORE the UI showed them the correct one. This route ALSO enforces the
 *      rule itself at read time — see the double $group below, and read the
 *      reason there before deleting it.
 *
 * Those two properties are what make "questions completed" a real measure of
 * work done rather than of time spent clicking.
 *
 * RANKED BY CORRECT ANSWERS, not raw attempts. "Completing" a question sensibly
 * means getting it right — ranking on attempts alone would put someone who
 * guessed through 200 questions above someone who carefully answered 150, which
 * is the opposite of what a leaderboard should reward. Attempts and accuracy are
 * both returned and displayed, so the full picture is visible; if you ever want
 * the pure-attempts ordering it is one line in the sort below.
 */

/** Safety bound. Sorting happens in memory (see below), so this caps the work
 *  regardless of how the platform grows. */
const MAX_RANKED = 1000;
/** How many rows the board shows. The caller's own row is always included on
 *  top of these, however far down they are. */
const TOP_N = 50;

function initialsFrom(name: string): string {
    return (
        name
            .split(' ')
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?'
    );
}

export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const kitSlug = request.nextUrl.searchParams.get('kitSlug');
        const match: Record<string, unknown> = {};
        if (kitSlug) match.kitSlug = kitSlug;

        /**
         * TWO groupings. The first one is belt-and-braces — keep it anyway.
         *
         * The database now enforces one row per (userId, questionId): the index
         * is unique and verified rejecting duplicates with E11000. So in theory
         * a single { $group: { _id: '$userId' } } with { $sum: 1 } would do.
         *
         * ⚠️ It is still not safe to collapse this, because that constraint was
         * absent for most of the collection's life and nothing structural stops
         * it going absent again. `unique: true` had been declared in the schema
         * for months while the live index carried no unique flag at all — a
         * non-unique version existed first, and Mongoose's autoIndex will not
         * upgrade an index in place, so it silently kept the old one. That gap
         * accumulated 163 duplicate rows across 150 (user, question) pairs,
         * many reading correct: [false, true] — people re-answering after the
         * UI revealed the key. They were deleted by scripts/quiz-dedupe-
         * attempts.ts, and de-duplicating here would have made this board
         * correct throughout, which is the point: a read path that depends on
         * a constraint should not be the thing that breaks when the constraint
         * silently lapses.
         *
         * So the first $group reduces to ONE entry per (user, question) and
         * takes the FIRST attempt by time. The $sort before it is what makes
         * $first mean "earliest". On this data it is a no-op that costs a sort
         * over a few thousand rows; that is a fair price for not having to
         * trust an index declaration again.
         */
        const grouped = (await QuizAttempt.aggregate([
            { $match: match },
            { $sort: { userId: 1, questionId: 1, createdAt: 1 } },
            {
                $group: {
                    _id: { userId: '$userId', questionId: '$questionId' },
                    correct: { $first: '$correct' },
                    at: { $first: '$createdAt' },
                    lastAt: { $max: '$createdAt' },
                },
            },
            {
                $group: {
                    _id: '$_id.userId',
                    // Distinct questions, now that duplicates are collapsed.
                    completed: { $sum: 1 },
                    correct: { $sum: { $cond: ['$correct', 1, 0] } },
                    // `firstAt` breaks ties: two people on the same score are
                    // ordered by who got there first — fair, and stable across
                    // refreshes in a way a random tiebreak would not be.
                    firstAt: { $min: '$at' },
                    lastAt: { $max: '$lastAt' },
                },
            },
            { $sort: { correct: -1, completed: -1, firstAt: 1 } },
            { $limit: MAX_RANKED },
        ])) as {
            _id: unknown;
            completed: number;
            correct: number;
            firstAt: Date;
            lastAt: Date;
        }[];

        // Hydrate names in ONE query rather than a $lookup per group.
        const userIds = grouped.map((g) => g._id);
        const users = (await CompanyKitUser.find({ _id: { $in: userIds } })
            // No `email`: nothing here displays it, and PII you do not fetch
            // cannot leak from a response by accident.
            .select('name profilePicture currentStreak')
            .lean()) as any[];
        const userById = new Map(users.map((u) => [String(u._id), u]));

        const rows = grouped
            // A group whose user row is gone (deleted account) would render as a
            // blank rank. Drop it rather than showing a ghost.
            .filter((g) => userById.has(String(g._id)))
            .map((g, i) => {
                const user = userById.get(String(g._id))!;
                /* NO EMAIL-DERIVED NAMES.
                 *
                 * This previously fell back to the email's local part, which
                 * publishes a real identifier — "john.smith" out of
                 * john.smith@gmail.com — to every signed-in user on the board.
                 * Dropping the domain is not anonymisation. 'Student' is what
                 * /api/leaderboard/react has always used for a nameless row, so
                 * this matches it. */
                const name: string = user.name?.trim() || 'Student';
                return {
                    rank: i + 1,
                    userId: String(g._id),
                    name,
                    initials: initialsFrom(name),
                    profilePicture: user.profilePicture || null,
                    streak: user.currentStreak || 0,
                    completed: g.completed,
                    correct: g.correct,
                    accuracy: g.completed ? Math.round((g.correct / g.completed) * 100) : 0,
                    lastActiveAt: g.lastAt,
                };
            })
            // Re-rank after the filter so numbering has no gaps.
            .map((row, i) => ({ ...row, rank: i + 1 }));

        const me = rows.find((r) => r.userId === session.id) || null;

        /**
         * How many questions exist to be completed — the denominator that makes
         * a score legible ("142 of 380") rather than an unanchored number.
         *
         * ⚠️ QuizQuestion has NO `kitSlug` field, only `kitId` — the slug lives
         * on Kit. Filtering questions by slug would match nothing and quietly
         * report a total of 0, so the slug is resolved to an id first. An
         * unknown slug yields a null id and, correctly, a total of 0.
         */
        const questionFilter: Record<string, unknown> = { status: 'live' };
        if (kitSlug) {
            const kit = (await Kit.findOne({ slug: kitSlug }).select('_id').lean()) as {
                _id: unknown;
            } | null;
            questionFilter.kitId = kit?._id ?? null;
        }
        const totalQuestions = await QuizQuestion.countDocuments(questionFilter);

        return NextResponse.json({
            leaderboard: rows.slice(0, TOP_N),
            // Sent separately so the caller's own row can be pinned even when
            // they are rank 300 — a board you never appear on is not motivating.
            me,
            participants: rows.length,
            totalQuestions,
            kitSlug: kitSlug || null,
        });
    } catch (error: any) {
        console.error('Quiz leaderboard error:', error.message);
        return NextResponse.json({ error: 'Failed to load the leaderboard' }, { status: 500 });
    }
}
