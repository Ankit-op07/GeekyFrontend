/**
 * Migration: retire the duplicated starter questions.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * The seed route used to keyword-match against each topic's full lesson content.
 * Since practically every JS lesson mentions "let" or "closure" somewhere in
 * ~13k characters, 8 starter questions fanned out into 186 live rows across 62
 * topics — the TDZ snippet alone landed on 48 of them. That is not coverage; a
 * learner reading three topics in a row met the same question three times, which
 * reads as broken rather than thin.
 *
 * The matcher is fixed (title+slug only) and real per-topic questions now exist,
 * so these rows are superseded.
 *
 * WHAT IT CHANGES
 * ---------------
 *   • source:'seed' questions → status:'archived'.
 *
 * ARCHIVED, NOT DELETED — deliberately:
 *   • The learner API reads status:'live' only, so archiving is enough to stop
 *     them rendering.
 *   • Existing QuizAttempt rows reference these _ids. Deleting would leave the
 *     metrics' per-question join pointing at nothing, and PRD-005 §9's pass-rate
 *     flagging silently mis-reporting on the gap.
 *   • These 8 questions are hand-written and all 8 pass the fixed QA gate. The
 *     fault was the fan-out, not the content. Archived rows are recoverable
 *     (flip status back) if you ever want them on their true topics.
 *
 * WHAT IT DOES *NOT* TOUCH
 * ------------------------
 *   • source:'ai' / 'manual' questions — never in scope.
 *   • QuizAttempt rows — untouched, so history stays intact.
 *
 * Usage:
 *   node --experimental-strip-types scripts/quiz-archive-wallpaper.ts          # dry run
 *   node --experimental-strip-types scripts/quiz-archive-wallpaper.ts --apply  # writes
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
}

const APPLY = process.argv.includes('--apply');

const run = async () => {
    await mongoose.connect(MONGODB_URI);
    const questions = mongoose.connection.db!.collection('quizquestions');
    const attempts = mongoose.connection.db!.collection('quizattempts');

    const target = { source: 'seed', status: { $ne: 'archived' } };
    const rows = await questions.find(target).toArray();

    console.log(`${APPLY ? '✍️  APPLY' : '🔍 DRY RUN'}\n`);
    console.log(`seed questions to archive: ${rows.length}`);

    // Show the fan-out that motivated this, so the number is legible.
    const byCode: Record<string, number> = {};
    for (const r of rows) byCode[r.code as string] = (byCode[r.code as string] || 0) + 1;
    const distinct = Object.keys(byCode).length;
    console.log(`  ${distinct} distinct snippets spread across ${rows.length} rows`);
    for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        console.log(`   ${String(n).padStart(3)}×  ${code.replace(/\n/g, ' ⏎ ').slice(0, 62)}`);
    }

    const referenced = await attempts.countDocuments({
        questionId: { $in: rows.map((r) => String(r._id)) },
    });
    console.log(`\nattempt rows referencing them: ${referenced} (preserved — archive, not delete)`);

    const remainingLive = await questions.countDocuments({
        status: 'live',
        source: { $ne: 'seed' },
    });
    console.log(`live questions remaining after this: ${remainingLive}`);
    if (remainingLive === 0) {
        console.log(
            '\n⚠ This leaves ZERO live questions — every topic renders no quiz until\n' +
            '  authored questions are inserted. Run the insert first if that matters.'
        );
    }

    if (APPLY) {
        const r = await questions.updateMany(target, { $set: { status: 'archived' } });
        console.log(`\n✅ archived ${r.modifiedCount} questions`);
    } else {
        console.log('\nNothing was written. Re-run with --apply to commit.');
    }

    await mongoose.disconnect();
};

run().catch((e) => {
    console.error('ERR', e instanceof Error ? e.message : e);
    process.exit(1);
});
