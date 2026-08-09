/**
 * Repairs the (userId, questionId) uniqueness that QuizAttempt only *claims*.
 *
 * THE BUG
 * -------
 * lib/models/QuizAttempt.ts declares:
 *
 *     QuizAttemptSchema.index({ userId: 1, questionId: 1 }, { unique: true })
 *
 * and its docblock states that a repeat submit "does not write a second row".
 * Neither is true of the live collection. A NON-unique index of the same shape
 * already existed when `unique: true` was added, and Mongoose's autoIndex will
 * not upgrade an index in place — it sees a `userId_1_questionId_1` index, finds
 * the name taken, and silently leaves the old one. `db.quizattempts.indexes()`
 * shows no unique flag to this day.
 *
 * WHAT IT COSTS
 * -------------
 * Two things the codebase believes are guaranteed are not:
 *   • PRD-005 §9 auto-flags questions passing >90% or <10% as broken. That
 *     mechanism assumes re-answers are not recorded. They are, and a re-answer
 *     comes after the UI has revealed the correct option, so every duplicated
 *     question drifts toward a 100% pass rate — exactly the blindness the
 *     model's docblock says the unique index exists to prevent.
 *   • The attempt-rate gate counts "people, not clicks", per the same docblock.
 *
 * (The leaderboard at app/api/leaderboard/quiz is NOT affected — it stopped
 * trusting the index and de-duplicates in its own aggregation. This script is
 * for the read paths that still query the collection directly.)
 *
 * WHAT IT DOES
 * ------------
 * Keeps the EARLIEST attempt for each (userId, questionId) and deletes the
 * rest, then builds the unique index. Earliest, not latest, because "first
 * attempt only" is the rule the whole design rests on: the first answer is the
 * only one given without having seen the key.
 *
 * ⚠️ This DELETES rows and cannot be undone. Take a backup first. Dry-run by
 * default, like every other script here.
 *
 *   node --experimental-strip-types --env-file=.env scripts/quiz-dedupe-attempts.ts
 *   node --experimental-strip-types --env-file=.env scripts/quiz-dedupe-attempts.ts --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const INDEX_NAME = 'userId_1_questionId_1';

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set (pass --env-file=.env)');

    await mongoose.connect(uri);
    const col = mongoose.connection.db!.collection('quizattempts');

    const total = await col.countDocuments();
    const existing = (await col.indexes()).find((i) => i.name === INDEX_NAME);
    console.log(`attempt rows      : ${total}`);
    console.log(`existing index    : ${existing ? `${INDEX_NAME} (unique: ${Boolean(existing.unique)})` : 'none'}`);

    // Every (user, question) with more than one row, oldest first so the
    // survivor is deterministic and matches the leaderboard's $first.
    const groups = await col
        .aggregate<{ _id: { userId: unknown; questionId: string }; ids: unknown[] }>([
            { $sort: { userId: 1, questionId: 1, createdAt: 1 } },
            {
                $group: {
                    _id: { userId: '$userId', questionId: '$questionId' },
                    ids: { $push: '$_id' },
                },
            },
            { $match: { $expr: { $gt: [{ $size: '$ids' }, 1] } } },
        ])
        .toArray();

    // Drop everything after the first in each group.
    const doomed = groups.flatMap((g) => g.ids.slice(1));
    console.log(`duplicated pairs  : ${groups.length}`);
    console.log(`rows to delete    : ${doomed.length}`);

    if (!APPLY) {
        console.log('\nDRY RUN — nothing written. Re-run with --apply to perform the repair.');
        await mongoose.disconnect();
        return;
    }

    if (doomed.length) {
        const res = await col.deleteMany({ _id: { $in: doomed as any[] } });
        console.log(`deleted           : ${res.deletedCount}`);
    }

    // Only now can the unique index build. The old non-unique index must go
    // first — that name is what blocked the upgrade in the first place.
    if (existing && !existing.unique) {
        await col.dropIndex(INDEX_NAME);
        console.log(`dropped           : ${INDEX_NAME} (non-unique)`);
    }
    await col.createIndex({ userId: 1, questionId: 1 }, { unique: true, name: INDEX_NAME });
    console.log(`created           : ${INDEX_NAME} (unique)`);

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
