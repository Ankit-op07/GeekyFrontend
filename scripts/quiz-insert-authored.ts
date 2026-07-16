/**
 * Import authored quiz questions into the DB, gated on corroboration.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * Questions are authored per topic (grounded in that topic's real lesson) and
 * dropped as JSON. This is the ONLY thing that writes them to the database, so
 * that "may this question be shown to a paying learner?" is decided in exactly
 * one place, by rules that are readable, rather than by whoever authored it.
 *
 * A question goes LIVE only if something INDEPENDENT of the author corroborated
 * its answer key:
 *
 *   predict-output → the snippet is EXECUTED (lib/quiz/verify-output) and its
 *                    real output must match the marked option. That is proof.
 *                    'mismatch' is a proven-wrong answer and can never be live.
 *
 *   concept        → a second author answered it BLIND (never saw the key) from
 *                    the lesson alone. It goes live only if they picked the same
 *                    option, said they were confident, and the author quoted the
 *                    lesson to support it. Weaker than execution — hence
 *                    verifiedBy:'peer', so a reviewer can tell the two apart.
 *
 * Everything else lands as `draft` in the admin review queue with a note saying
 * exactly why. Nothing is silently published; nothing is silently dropped.
 *
 * IDEMPOTENT: a topic that already has authored (source:'ai') questions is
 * skipped, so re-running never duplicates. To act on an already-imported topic,
 * prefer --promote (re-judges in place) over --replace (deletes and re-inserts,
 * minting new _ids and orphaning the QuizAttempt rows that point at them).
 *
 * Usage:
 *   node --experimental-strip-types scripts/quiz-insert-authored.ts             # dry run
 *   node --experimental-strip-types scripts/quiz-insert-authored.ts --apply     # import new topics
 *   node --experimental-strip-types scripts/quiz-insert-authored.ts --promote   # re-judge in place (dry)
 *   node --experimental-strip-types scripts/quiz-insert-authored.ts --promote --apply
 *   node --experimental-strip-types scripts/quiz-insert-authored.ts --apply --replace   # ⚠ churns _ids
 */
import fs from 'node:fs';
import path from 'node:path';
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
const REPLACE = process.argv.includes('--replace');
const FORCE = process.argv.includes('--force');
/**
 * Re-judge questions ALREADY in the DB and update their verdict in place.
 *
 * Use this when corroboration arrives after the import — e.g. a blind-solve run
 * died partway and left questions sitting as draft/'no independent solve'. It
 * matches on (topicId, order), and rewrites ONLY status/verified/verifiedBy/
 * verifyNote. Prompt, code, options and _id are never touched.
 *
 * Why not --replace: that deletes and re-inserts, minting new _ids. QuizAttempt
 * rows reference questions by id, so replacing would orphan real learner history
 * (and silently corrupt the per-question pass rate that PRD-005 §9's flagging
 * depends on). Promotion is the non-destructive path; prefer it.
 */
const PROMOTE = process.argv.includes('--promote');

/**
 * Refuse to publish a set whose answers cluster in one position.
 *
 * This is not hypothetical. The first authoring pass put the correct option
 * FIRST in 405 of 435 questions (93%). Two things break at once when that
 * happens, and neither is visible in a pass/fail count:
 *   • the quiz stops measuring knowledge — a learner who notices scores 93% by
 *     always picking A;
 *   • the blind-solver check stops meaning anything — author bias and solver
 *     bias line up, so they agree for reasons unrelated to correctness. That
 *     pass "agreed" on 100% of questions, which read as a triumph and was noise.
 * Shuffle before importing. --force overrides, and you should have a reason.
 */
const MAX_SHARE_PER_POSITION = 0.4;

const SCRATCH =
    process.env.QUIZ_SCRATCH ||
    '/private/tmp/claude-501/-Users-ankitnagar-Desktop-Geeky-Frontend-new-/007fd039-fa6d-46c6-8f87-43253a4969f3/scratchpad';
const AUTHORED = path.join(SCRATCH, 'authored');
const SOLVED = path.join(SCRATCH, 'solved');

interface Authored {
    type: 'predict-output' | 'concept';
    prompt: string;
    code?: string;
    language?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty?: string;
    tags?: string[];
    citation?: string;
}
interface SolvedAnswer {
    index: number;
    chosenIndex: number;
    confident: boolean;
    reason: string;
}

interface Decision {
    status: 'live' | 'draft';
    verified: boolean;
    verifiedBy?: 'vm' | 'peer';
    verifyNote: string;
    reason: string; // short bucket, for the summary
}

/** Decide publication for one question. The whole policy, in one function. */
async function decide(q: Authored, solved: SolvedAnswer | undefined): Promise<Decision> {
    const draft = (verifyNote: string, reason: string): Decision => ({
        status: 'draft',
        verified: false,
        verifyNote,
        reason,
    });

    if (!q.options || q.options.length < 2) return draft('malformed: fewer than 2 options.', 'malformed');
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length)
        return draft('malformed: correctIndex out of range.', 'malformed');

    if (q.type === 'predict-output') {
        const r = await verifyPredictOutput({
            code: q.code || '',
            options: q.options,
            correctIndex: q.correctIndex,
        });
        if (r.status === 'match') {
            return {
                status: 'live',
                verified: true,
                verifiedBy: 'vm',
                verifyNote: `match: ${r.note}`,
                reason: 'vm-proved',
            };
        }
        // mismatch = proven wrong. inconclusive = gate couldn't evaluate it.
        // Neither is publishable without a human; both are honest about which.
        return draft(`${r.status}: ${r.note}`, r.status === 'mismatch' ? 'vm-disproved' : 'vm-inconclusive');
    }

    // ── concept ──
    if (!q.citation || q.citation.trim().length === 0)
        return draft('concept: no lesson citation — grounding unproven.', 'no-citation');
    if (!solved) return draft('concept: no independent solve recorded.', 'no-solver');
    if (!solved.confident)
        return draft(`concept: solver was unsure — ${solved.reason}`, 'solver-unsure');
    if (solved.chosenIndex !== q.correctIndex) {
        return draft(
            `concept: DISAGREEMENT — blind solver chose option ${solved.chosenIndex} ` +
                `("${q.options[solved.chosenIndex] ?? '?'}"), author marked ${q.correctIndex} ` +
                `("${q.options[q.correctIndex]}"). Solver's reasoning: ${solved.reason}`,
            'solver-disagreed'
        );
    }
    return {
        status: 'live',
        verified: true,
        verifiedBy: 'peer',
        verifyNote: `agree: blind solver independently chose the same option. ${solved.reason}`,
        reason: 'peer-agreed',
    };
}

const run = async () => {
    await mongoose.connect(MONGODB_URI);
    const col = mongoose.connection.db!.collection('quizquestions');

    const files = fs.existsSync(AUTHORED)
        ? fs.readdirSync(AUTHORED).filter((f) => f.endsWith('.json'))
        : [];
    if (files.length === 0) {
        console.error(`❌ no authored files in ${AUTHORED}`);
        process.exit(1);
    }

    console.log(`${APPLY ? '✍️  APPLY' : '🔍 DRY RUN'} — ${files.length} topic files\n`);

    // ── answer-position bias check, before anything is written ──
    const positions: Record<number, number> = {};
    let totalForBias = 0;
    for (const file of files) {
        const rec = JSON.parse(fs.readFileSync(path.join(AUTHORED, file), 'utf8'));
        for (const q of rec.questions || []) {
            if (!Array.isArray(q.options) || q.options.length < 2) continue;
            positions[q.correctIndex] = (positions[q.correctIndex] || 0) + 1;
            totalForBias++;
        }
    }
    const worst = Object.entries(positions).sort((a, b) => b[1] - a[1])[0];
    const worstShare = worst ? worst[1] / totalForBias : 0;
    console.log('answer position spread:');
    for (const k of Object.keys(positions).sort()) {
        const n = positions[Number(k)];
        console.log(`  index ${k}: ${String(n).padStart(4)} (${Math.round((n / totalForBias) * 100)}%)`);
    }
    if (worstShare > MAX_SHARE_PER_POSITION) {
        console.error(
            `\n❌ REFUSING: ${Math.round(worstShare * 100)}% of answers sit at index ${worst[0]} ` +
                `(limit ${Math.round(MAX_SHARE_PER_POSITION * 100)}%).\n` +
                `   A learner who notices scores without reading, and any blind-solver\n` +
                `   corroboration is confounded by the same bias. Shuffle the options first.\n` +
                `   Override with --force if you truly mean it.`
        );
        if (!FORCE) {
            await mongoose.disconnect();
            process.exit(1);
        }
        console.error('   --force given; continuing anyway.\n');
    } else {
        console.log(`  ✓ no position clusters above ${Math.round(MAX_SHARE_PER_POSITION * 100)}%\n`);
    }

    const reasons: Record<string, number> = {};
    let live = 0;
    let drafted = 0;
    let skippedTopics = 0;
    let topicsTouched = 0;
    const disagreements: string[] = [];
    // --promote bookkeeping
    let promoted = 0;
    let demoted = 0;
    let unchanged = 0;
    let unmatched = 0;

    for (const file of files) {
        const rec = JSON.parse(fs.readFileSync(path.join(AUTHORED, file), 'utf8'));
        const questions: Authored[] = rec.questions || [];
        if (questions.length === 0) continue;

        const topicId = new mongoose.Types.ObjectId(rec.topicId);
        const existing = await col.countDocuments({ topicId, source: 'ai' });

        let solvedAnswers: SolvedAnswer[] = [];
        const solvedPath = path.join(SOLVED, file);
        if (fs.existsSync(solvedPath)) {
            try {
                solvedAnswers = JSON.parse(fs.readFileSync(solvedPath, 'utf8')).answers || [];
            } catch {
                /* a corrupt solve file just means no corroboration → draft */
            }
        }

        // ── re-judge in place, no id churn ──
        if (PROMOTE) {
            if (existing === 0) continue;
            const rows = (await col
                .find({ topicId, source: 'ai' })
                .sort({ order: 1 })
                .toArray()) as any[];

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const row = rows.find((r) => r.order === i);
                // Match on (topicId, order), but only trust it if the prompt still
                // agrees — otherwise the file and the DB have diverged and we would
                // be stamping one question's verdict onto another.
                if (!row || row.prompt !== q.prompt) {
                    unmatched++;
                    continue;
                }
                const d = await decide(q, solvedAnswers.find((a) => a.index === i));
                reasons[d.reason] = (reasons[d.reason] || 0) + 1;
                if (d.reason === 'solver-disagreed' && disagreements.length < 8) {
                    disagreements.push(`${rec.title}: ${q.prompt.slice(0, 60)}`);
                }

                if (row.status === d.status) unchanged++;
                else if (d.status === 'live') promoted++;
                else demoted++;

                if (APPLY) {
                    await col.updateOne(
                        { _id: row._id },
                        {
                            $set: {
                                status: d.status,
                                verified: d.verified,
                                verifiedBy: d.verifiedBy ?? null,
                                verifyNote: d.verifyNote,
                                updatedAt: new Date(),
                            },
                        }
                    );
                }
            }
            topicsTouched++;
            continue;
        }

        if (existing > 0 && !REPLACE) {
            skippedTopics++;
            continue;
        }

        const docs = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const d = await decide(q, solvedAnswers.find((a) => a.index === i));
            reasons[d.reason] = (reasons[d.reason] || 0) + 1;
            if (d.status === 'live') live++;
            else drafted++;
            if (d.reason === 'solver-disagreed' && disagreements.length < 5) {
                disagreements.push(`${rec.title}: ${q.prompt.slice(0, 60)}`);
            }

            docs.push({
                kitId: new mongoose.Types.ObjectId(rec.kitId),
                topicId: new mongoose.Types.ObjectId(rec.topicId),
                type: q.type,
                prompt: q.prompt,
                code: q.type === 'predict-output' ? q.code || '' : '',
                language: q.language || 'javascript',
                options: q.options.map(String),
                correctIndex: q.correctIndex,
                explanation: q.explanation || '',
                difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty || '') ? q.difficulty : 'medium',
                tags: Array.isArray(q.tags) ? q.tags.slice(0, 3) : [],
                status: d.status,
                source: 'ai',
                verified: d.verified,
                verifiedBy: d.verifiedBy,
                verifyNote: d.verifyNote,
                order: i,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        topicsTouched++;
        if (APPLY && docs.length) {
            if (REPLACE && existing > 0) {
                await col.deleteMany({ topicId: new mongoose.Types.ObjectId(rec.topicId), source: 'ai' });
            }
            await col.insertMany(docs);
        }
    }

    if (PROMOTE) {
        console.log(`topics re-judged: ${topicsTouched}`);
        console.log(`  ↑ promoted draft → live: ${promoted}`);
        console.log(`  ↓ demoted live → draft:  ${demoted}${demoted ? '   ⚠ corroboration now disputes these' : ''}`);
        console.log(`  = unchanged:             ${unchanged}`);
        if (unmatched) console.log(`  ? unmatched (file/DB diverged, skipped): ${unmatched}`);
    } else {
        const total = live + drafted;
        console.log(`topics imported: ${topicsTouched}${skippedTopics ? `  (skipped ${skippedTopics} already imported — use --replace or --promote)` : ''}`);
        console.log(`questions:       ${total}`);
        console.log(`  → live:        ${live}  (${total ? Math.round((live / total) * 100) : 0}%)`);
        console.log(`  → draft:       ${drafted}  (need your review at /admin/quiz)`);
    }
    console.log('\nwhy:');
    const label: Record<string, string> = {
        'vm-proved': 'live  · snippet executed, output matched the key',
        'peer-agreed': 'live  · blind solver independently agreed',
        'vm-disproved': 'draft · PROVEN WRONG by execution',
        'vm-inconclusive': 'draft · gate could not evaluate the snippet',
        'solver-disagreed': 'draft · blind solver picked a different option',
        'solver-unsure': 'draft · solver found it ambiguous',
        'no-citation': 'draft · author could not quote the lesson',
        'no-solver': 'draft · no independent solve recorded',
        malformed: 'draft · malformed question',
    };
    for (const [k, n] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(n).padStart(4)}  ${label[k] || k}`);
    }

    if (disagreements.length) {
        console.log('\nsample disagreements (author vs blind solver — these are the interesting ones):');
        for (const d of disagreements) console.log(`   · ${d}`);
    }

    if (!APPLY) console.log('\nNothing was written. Re-run with --apply to commit.');
    await mongoose.disconnect();
};

run().catch((e) => {
    console.error('ERR', e instanceof Error ? e.message : e);
    process.exit(1);
});
