/**
 * Migration: re-run the predict-output QA gate over every stored QuizQuestion.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * `verified` / `verifyNote` are stamped once, at write time, by whichever build
 * of lib/quiz/verify-output.ts was deployed then. Two realm bugs in the original
 * gate made it wrong about a whole class of questions:
 *
 *   1. `e instanceof Error` is FALSE for errors thrown inside a vm context (they
 *      carry that realm's prototype chain), so every thrown error was reported as
 *      the literal "Error" instead of "ReferenceError"/"TypeError". Every
 *      error-prediction question came back `inconclusive`.
 *   2. Host intrinsics (Object, Array, Promise…) were injected into the sandbox,
 *      shadowing its realm-native ones — so `({}) instanceof Object` was false
 *      inside the gate and prototype/coercion questions graded against broken
 *      semantics.
 *
 * Both are fixed. The stored verdicts are therefore stale, and stale here means
 * "questions a working gate would have caught are sitting live". This re-runs
 * the fixed gate and rewrites the verdicts.
 *
 * WHAT IT CHANGES
 * ---------------
 *   • `verified` + `verifyNote` on every question — recomputed.
 *   • Any question whose verdict is `mismatch` (the snippet's real output
 *     contradicts the marked answer — a PROVEN-WRONG question) is demoted
 *     'live' → 'draft'. That is the one failure mode PRD-005 §13 Q13 calls a
 *     trust incident: telling a correct learner they are wrong.
 *
 * WHAT IT DOES *NOT* TOUCH
 * ------------------------
 *   • `inconclusive` questions keep their current status. The gate could not
 *     evaluate them (async shape, formatting, unrunnable) — that is not evidence
 *     of being wrong, and a human made the call to publish them.
 *   • prompt / code / options / correctIndex / explanation — never rewritten.
 *     This script grades; it does not author.
 *   • QuizAttempt rows — untouched.
 *
 * Usage:
 *   node --experimental-strip-types scripts/quiz-reverify.ts          # dry run
 *   node --experimental-strip-types scripts/quiz-reverify.ts --apply  # writes
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { verifyPredictOutput } from '../lib/quiz/verify-output.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
}

const APPLY = process.argv.includes('--apply');

interface Row {
    _id: unknown;
    code: string;
    options: string[];
    correctIndex: number;
    status: string;
    verified: boolean;
    verifyNote?: string;
    prompt: string;
}

const run = async () => {
    await mongoose.connect(MONGODB_URI);
    const col = mongoose.connection.db!.collection('quizquestions');
    const rows = (await col.find({}).toArray()) as unknown as Row[];

    console.log(`${APPLY ? '✍️  APPLY' : '🔍 DRY RUN'} — re-grading ${rows.length} questions\n`);

    const verdicts: Record<string, number> = { match: 0, mismatch: 0, inconclusive: 0 };
    let flippedToVerified = 0;
    let flippedToUnverified = 0;
    const demote: Row[] = [];
    const writes: Array<Promise<unknown>> = [];

    for (const q of rows) {
        const r = await verifyPredictOutput({
            code: q.code,
            options: q.options,
            correctIndex: q.correctIndex,
        });
        verdicts[r.status]++;

        const verified = r.status === 'match';
        if (verified && !q.verified) flippedToVerified++;
        if (!verified && q.verified) flippedToUnverified++;

        const update: Record<string, unknown> = { verified, verifyNote: `${r.status}: ${r.note}` };
        if (r.status === 'mismatch' && q.status === 'live') {
            update.status = 'draft';
            demote.push(q);
        }
        if (APPLY) writes.push(col.updateOne({ _id: q._id as never }, { $set: update }));
    }

    await Promise.all(writes);

    console.log('verdicts from the fixed gate:', verdicts);
    console.log(`  newly verified (the realm-bug fix):  +${flippedToVerified}`);
    console.log(`  lost verification (gate now stricter): -${flippedToUnverified}`);

    console.log(`\n⚠ proven-wrong questions ${APPLY ? 'demoted live → draft' : 'that WOULD be demoted'}: ${demote.length}`);
    for (const q of demote.slice(0, 10)) {
        console.log(`   ✗ ${JSON.stringify(q.prompt.slice(0, 50))}`);
        console.log(`     ${q.code.replace(/\n/g, ' ⏎ ').slice(0, 78)}`);
    }
    if (demote.length > 10) console.log(`   … and ${demote.length - 10} more`);

    if (!APPLY) console.log('\nNothing was written. Re-run with --apply to commit.');
    await mongoose.disconnect();
};

run().catch((e) => {
    console.error('ERR', e instanceof Error ? e.message : e);
    process.exit(1);
});
