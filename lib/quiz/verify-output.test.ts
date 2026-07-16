import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPredictOutput } from './verify-output.ts';

/**
 * Tests for the predict-output QA gate.
 *
 * This is the only thing standing between a wrong AI draft and a live question
 * that tells a correct learner they are wrong — PRD-005 §13 Q13 calls that a
 * trust incident, not a bug — so it earns tests even though the repo has no
 * other suite.
 *
 * Run: npm run test:quiz
 */

// ── the realm bugs these tests exist to pin ──────────────────────────────────

test('reports the real error name across the vm realm boundary', async () => {
    // Regression: the gate read `e instanceof Error ? e.name : 'Error'`. Errors
    // thrown inside a vm come from that realm, so host `instanceof Error` is
    // false and EVERY error collapsed to "Error" — which matched no option and
    // made all 15 error questions inconclusive. 48 live rows were stuck this way.
    const r = await verifyPredictOutput({
        code: 'console.log(y);\nlet y = 5;',
        options: ['5', 'undefined', 'ReferenceError', 'null'],
        correctIndex: 2,
    });
    assert.equal(r.actualOutput, 'ReferenceError');
    assert.equal(r.status, 'match');
});

test('distinguishes error types rather than flattening them', async () => {
    const r = await verifyPredictOutput({
        code: 'null.foo;',
        options: ['undefined', 'TypeError', 'ReferenceError', 'null'],
        correctIndex: 1,
    });
    assert.equal(r.actualOutput, 'TypeError');
    assert.equal(r.status, 'match');
});

test('object literals inherit from the sandbox realm, not the host', async () => {
    // Regression: passing host Object/Array/... into the context shadowed the
    // realm-native intrinsics, so `({}) instanceof Object` was false inside the
    // vm and every prototype/coercion question graded against broken semantics.
    const r = await verifyPredictOutput({
        code: 'console.log(({}) instanceof Object, [] instanceof Array);',
        options: ['true true', 'false false', 'true false', 'TypeError'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});

test('built-ins the snippet never received still resolve from its own realm', async () => {
    const r = await verifyPredictOutput({
        code: 'console.log(JSON.stringify({ a: [1, 2] }), Math.max(1, 9));',
        options: ['{"a":[1,2]} 9', 'undefined', 'ReferenceError', '[object Object] 9'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});

// ── event-loop modelling ────────────────────────────────────────────────────

test('microtasks drain before timers', async () => {
    const r = await verifyPredictOutput({
        code: `console.log('sync');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('micro'));`,
        options: ['sync\nmicro\ntimeout', 'sync\ntimeout\nmicro', 'micro\nsync\ntimeout', 'sync'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});

test('a timer scheduled by another timer fires in delay order', async () => {
    // Regression: timers were sorted ONCE before the drain loop, so anything
    // scheduled from inside a callback was appended and ran last regardless of
    // its delay. A virtual clock re-picks the earliest each tick.
    const r = await verifyPredictOutput({
        code: `setTimeout(() => {
  console.log('outer');
  setTimeout(() => console.log('inner-0'), 0);
}, 0);
setTimeout(() => console.log('later'), 50);`,
        options: ['outer\ninner-0\nlater', 'outer\nlater\ninner-0', 'later\nouter\ninner-0', 'outer'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});

test('timers fire in delay order regardless of scheduling order', async () => {
    const r = await verifyPredictOutput({
        code: `setTimeout(() => console.log('c'), 100);
setTimeout(() => console.log('a'), 0);
setTimeout(() => console.log('b'), 10);`,
        options: ['a\nb\nc', 'c\na\nb', 'a\nc\nb', 'c\nb\na'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});

test('equal-delay timers keep scheduling order', async () => {
    const r = await verifyPredictOutput({
        code: `setTimeout(() => console.log('first'), 0);
setTimeout(() => console.log('second'), 0);`,
        options: ['first\nsecond', 'second\nfirst', 'first', 'second'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});

test('the classic var-vs-let closure pair grades correctly', async () => {
    const withVar = await verifyPredictOutput({
        code: 'for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }',
        options: ['0 1 2', '3 3 3', '0 0 0', 'undefined'],
        correctIndex: 1,
    });
    assert.equal(withVar.actualOutput, '3\n3\n3');
    assert.equal(withVar.status, 'match', withVar.note);

    const withLet = await verifyPredictOutput({
        code: 'for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }',
        options: ['0 1 2', '3 3 3', '0 0 0', 'ReferenceError'],
        correctIndex: 0,
    });
    assert.equal(withLet.actualOutput, '0\n1\n2');
    assert.equal(withLet.status, 'match', withLet.note);
});

// ── verdicts ────────────────────────────────────────────────────────────────

test('mismatch names the option the output actually matches', async () => {
    const r = await verifyPredictOutput({
        code: "console.log('a');",
        options: ['a', 'b'],
        correctIndex: 1, // wrong on purpose
    });
    assert.equal(r.status, 'mismatch');
    assert.match(r.note, /option 0/);
});

test('ambiguous options are inconclusive, never a pass', async () => {
    const r = await verifyPredictOutput({
        code: "console.log('dup');",
        options: ['dup', 'dup'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'inconclusive');
    assert.match(r.note, /more than one option/);
});

test('output matching no option is inconclusive, not a mismatch', async () => {
    const r = await verifyPredictOutput({
        code: "console.log('surprise');",
        options: ['a', 'b'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'inconclusive');
});

test('malformed questions are rejected without executing', async () => {
    const r = await verifyPredictOutput({ code: "console.log('x')", options: [], correctIndex: 0 });
    assert.equal(r.status, 'inconclusive');
    assert.match(r.note, /Malformed/);
});

test('an infinite loop is killed by the timeout and never hangs the gate', async () => {
    const r = await verifyPredictOutput({
        code: 'while (true) {}',
        options: ['nothing', 'hangs'],
        correctIndex: 0,
    });
    // Whatever the verdict, the point is it RETURNS. A hang here would wedge the
    // admin generate route for every question after it.
    assert.ok(['inconclusive', 'mismatch'].includes(r.status));
});

test('never throws, whatever the snippet does', async () => {
    for (const code of ['throw new Error("boom")', 'syntax ~~~ error', '', 'process.exit(1)']) {
        const r = await verifyPredictOutput({ code, options: ['a', 'b'], correctIndex: 0 });
        assert.ok(r.status, `returned a verdict for ${JSON.stringify(code)}`);
    }
});

test('matching tolerates quoting and whitespace noise in authored options', async () => {
    const r = await verifyPredictOutput({
        code: "console.log('hello');",
        options: ['  "hello"  ', 'goodbye'],
        correctIndex: 0,
    });
    assert.equal(r.status, 'match', r.note);
});
