/**
 * Node.js Backend Kit — Chapter 13: Testing.
 * Pure data module (no runtime deps). Diagrams are referenced via
 * {{fig:filename.svg|ALT|CAPTION}} markers, resolved by the seed script.
 *
 * Depth target: every topic 1800-2500+ words of accurate, modern testing
 * practice (Jest + supertest, node:test/Vitest noted). Sections are fixed
 * and ordered: Why it matters / The concept, simply / How it works /
 * Code examples / Common mistakes & gotchas / Best practices /
 * ⭐ Interview lens / Cheat-card.
 */
module.exports = {
  title: 'Testing',
  slug: 'testing',
  order: 12,
  topics: [
    // ────────────────────────────────────────────────────────────────
    // TOPIC 0 — Testing fundamentals
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Testing Fundamentals',
      slug: 'testing-fundamentals',
      order: 0,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Tests are the only thing that lets a codebase grow without slowing down. Every backend you will ever work on faces the same quiet crisis: it starts small and easy to change, and then, feature by feature, it becomes something no one dares to touch. Automated tests are the mechanism that keeps a system changeable. They are an <strong>executable specification</strong> — a description of what the code is supposed to do that the machine re-checks on every commit — and a <strong>regression net</strong> that catches the day your innocent one-line fix silently breaks a login flow written two years ago.</p>`,
        `<p>For a Node.js backend the stakes are concrete. Your code touches money, auth tokens, other people's data, and third-party APIs. A bug is not a wrong pixel; it is a double-charged customer or a leaked record. Manual testing — clicking through Postman before each deploy — does not scale past a handful of endpoints and cannot be run a thousand times a day in CI. Tests turn "I think this still works" into "the machine just proved it in nine seconds."</p>`,
        `<p>In interviews, testing is where seniority shows. Juniors say "yeah, we write tests." Seniors talk about the <em>shape</em> of their test suite — how much is unit versus integration, what they mock and why, how they keep the suite fast and non-flaky, and how they decide what is even worth testing. This topic gives you the vocabulary and the mental map. The three topics after it go deep on writing each layer.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A test is just a small program that runs your real code with known inputs and <strong>asserts</strong> that the output matches what you expect. If the assertion holds, the test passes; if it throws, the test fails. That is the entire idea. Everything else — runners, mocks, coverage — is tooling built around that core loop.</p>`,
        `<p>Tests come in layers, and the classic way to picture the mix is the <strong>testing pyramid</strong>. At the bottom sit many small, fast <em>unit tests</em> that check one function in isolation. In the middle, fewer <em>integration tests</em> check that several pieces work together — a route, its middleware, and the database. At the top, a handful of slow <em>end-to-end (e2e) tests</em> drive the whole system the way a real user would. The pyramid shape is a recommendation: lots of cheap tests at the base, very few expensive ones at the peak.</p>`,
        `{{fig:ch13-testing-pyramid.svg|Pyramid with a wide green Unit base many fast tests a blue Integration middle and a small purple E2E tip few slow tests|Favour many fast unit tests at the base and only a few slow end-to-end tests at the tip.}}`,
        `<p>Why the shape? Because the layers trade <strong>speed and precision</strong> against <strong>realism and confidence</strong>. A unit test runs in a millisecond and, when it fails, points at exactly one function — but it proves nothing about how the pieces fit together. An e2e test exercises the real system and gives you enormous confidence — but it is slow, needs a running database and network, and when it goes red you get "something in the checkout flow broke" with no arrow pointing at the culprit. You want most of your failures to be precise and cheap, so you weight the suite toward the bottom.</p>`,
        `<h2>How it works</h2>`,
        `<p>Let's define the three layers precisely, because the boundaries are the exact thing interviewers push on.</p>`,
        `<p><strong>Unit tests</strong> exercise one "unit" — usually a single function or class — with all of its collaborators replaced by test doubles. A unit test for a <code>calculateTax()</code> function passes in a cart and checks the number that comes back. No database, no HTTP, no clock, no file system. Because there is nothing external, it is deterministic and fast, and it can run thousands of times per second. The trade-off: a passing unit test tells you the function is internally correct, not that it is wired into anything.</p>`,
        `<p><strong>Integration tests</strong> exercise several real units together across a boundary. The canonical backend integration test fires a real HTTP request at your Express app, lets it flow through routing, middleware, the controller, and a <em>real</em> (test) database, then asserts on the response and the resulting DB state. Nothing is mocked except perhaps the outside world (a payment provider). These catch the bugs unit tests structurally cannot: a wrong route path, a middleware ordering mistake, a schema mismatch, a bad SQL query. They are slower because real I/O is involved.</p>`,
        `<p><strong>End-to-end tests</strong> drive the fully deployed system — often through the actual UI or a public API — with every dependency real. For a backend-only service, "e2e" often means hitting a running instance over the network with its real database and downstream services. They give the most confidence and are the most expensive and the most flaky, because every real dependency is another thing that can be slow or down. Hence: very few of them, reserved for critical happy paths (sign up, log in, pay).</p>`,
        `<p>Running any of these needs a <strong>test runner</strong>: a program that discovers your test files, executes each test in isolation, catches assertion failures, and reports a summary plus a process exit code (0 = all passed, non-zero = something failed) that CI reads. Modern Node has three mainstream choices.</p>`,
        `{{fig:ch13-test-runners.svg|Three cards Jest batteries included Vitest native ESM and TS node:test built into Node all sharing find run isolate report|Jest, Vitest, and node:test differ in packaging but all discover, isolate, run, and report tests.}}`,
        `<p><strong>Jest</strong> is the long-standing default in the Node/React world. It is "batteries included": runner, assertion library (<code>expect</code>), mocking, coverage, and snapshot testing all ship together, and it runs test files in parallel across worker processes. Its historical weak spot is native ES modules and TypeScript, which need transform configuration. <strong>Vitest</strong> is a newer runner with a near-identical API to Jest but built on Vite's transform pipeline, so it handles ESM and TypeScript natively and has a very fast watch mode — the natural choice in Vite/modern-TS projects. <strong>node:test</strong> is the runner built into Node itself (stable since Node 20): <code>import { test } from 'node:test'</code>, assert with <code>node:assert</code>, run with <code>node --test</code>. Zero dependencies, but leaner on features like rich mocking and snapshots. The key interview point: the <em>concepts</em> — describe/it, arrange-act-assert, mocks, coverage — are identical across all three; only the imports change.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The anatomy of a test file in Jest. <code>describe</code> groups related tests; <code>it</code> (alias <code>test</code>) is one case; <code>expect(...).matcher(...)</code> is the assertion.</p>`,
        `<pre><code class="language-javascript">// sum.js — the code under test
function sum(a, b) {
  return a + b;
}
module.exports = { sum };
</code></pre>`,
        `<pre><code class="language-javascript">// sum.test.js — Jest discovers *.test.js automatically
const { sum } = require('./sum');

describe('sum()', () => {
  it('adds two positive numbers', () => {
    expect(sum(2, 3)).toBe(5);        // strict equality (===)
  });

  it('handles negatives', () => {
    expect(sum(-4, 1)).toBe(-3);
  });
});
</code></pre>`,
        `<p>The same test with the two other runners, to show the concepts transfer and only the imports move:</p>`,
        `<pre><code class="language-javascript">// node:test — built in, no install, run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from './sum.js';

test('adds two positive numbers', () => {
  assert.equal(sum(2, 3), 5);
});

// Vitest — near-identical to Jest, run with: vitest
import { describe, it, expect } from 'vitest';
import { sum } from './sum.js';

describe('sum()', () => {
  it('adds two positive numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
</code></pre>`,
        `<p>Wiring the runner into the project so CI and teammates run it the same way. This is the <code>package.json</code> that turns <code>npm test</code> into a gate:</p>`,
        `<pre><code class="language-javascript">{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --runInBand"
  }
}
// CI runs \`npm run test:ci\`; a non-zero exit code fails the build
// and blocks the merge. That exit code is the whole point.
</code></pre>`,
        `<p>Choosing what layer a test belongs to is a judgement call. A quick heuristic in code comments:</p>`,
        `<pre><code class="language-javascript">// Pure logic, no I/O?            -> UNIT (mock nothing, it is already isolated)
// Route + middleware + real DB?  -> INTEGRATION (supertest + test database)
// Whole system over the network? -> E2E (few, critical paths only)
//
// Rule of thumb split for a typical backend: ~70% unit, ~20% integration,
// ~10% e2e. Adjust to where YOUR bugs actually come from.
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Chasing a coverage number instead of confidence.</strong> "100% coverage" only means every line executed during the suite — not that any behaviour was actually asserted. You can hit 100% with tests that assert nothing. Coverage finds untested code; it never proves code is correct.</li>`,
        `<li><strong>Inverting the pyramid (the "ice-cream cone").</strong> A suite that is mostly slow e2e tests with few unit tests is the classic anti-pattern: it takes twenty minutes to run, fails intermittently, and never tells you <em>where</em> the bug is. Teams end up ignoring it.</li>`,
        `<li><strong>Testing implementation instead of behaviour.</strong> Asserting that a private helper was called, or snapshotting internal state, makes tests break on every refactor even when behaviour is unchanged. Test the observable output, not the mechanism.</li>`,
        `<li><strong>Confusing "no tests failed" with "the feature works."</strong> If you only test the happy path, a green suite is a false comfort. Untested branches are just as broken as failing ones — they are simply silent.</li>`,
        `<li><strong>Slow tests treated as normal.</strong> A unit test that talks to a real database is not a unit test; it is a slow integration test wearing the wrong label, and it drags the whole feedback loop down.</li>`,
        `<li><strong>Shared mutable state between tests.</strong> Tests that pass alone but fail when run together (or in a different order) almost always share a module-level variable, a global, or a database row nobody reset.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Weight toward the base of the pyramid.</strong> Many fast, isolated unit tests; enough integration tests to prove the wiring; a thin layer of e2e for the flows you cannot afford to break.</li>`,
        `<li><strong>Make tests deterministic.</strong> No real time, randomness, network, or ordering assumptions. The same inputs must give the same result on every machine, every run.</li>`,
        `<li><strong>One behaviour per test.</strong> A focused test names one expectation, so a failure reads like a sentence: "sum handles negatives — failed."</li>`,
        `<li><strong>Keep the suite fast.</strong> Sub-second unit runs mean developers actually run them before pushing. Speed is a feature; a slow suite gets skipped.</li>`,
        `<li><strong>Wire tests into CI as a hard gate.</strong> A merge must be blocked on red. Tests that do not gate anything decay into decoration.</li>`,
        `<li><strong>Pick one runner per project and standardise the scripts.</strong> Consistency (<code>npm test</code> means the same thing for everyone) matters more than which runner you chose.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What is the testing pyramid and why that shape?"</strong><br>A: A guideline for the mix of tests: many fast, isolated unit tests at the base, fewer integration tests in the middle, and a few slow end-to-end tests at the tip. The shape balances speed and precision (bottom) against realism and confidence (top). You want most failures to be cheap and to point at exactly one function, so you weight the suite toward unit tests. The inverted version — mostly e2e — is slow, flaky, and vague, and teams stop trusting it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Unit vs integration vs e2e — draw the line."</strong><br>A: A unit test exercises one function with all collaborators replaced by doubles: no I/O, deterministic, milliseconds. An integration test exercises several real units across a boundary — a route through middleware into a real test database — and catches wiring bugs. An e2e test drives the whole running system with every dependency real. Confidence rises and speed falls as you go up. The trap: calling a test that hits a real DB a "unit test" — it isn't.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does 100% coverage mean the code is well tested?"</strong><br>A: No. Coverage measures which lines <em>executed</em> during the suite, not whether anything was asserted about them. You can reach 100% with tests that assert nothing, and you can have superb tests at 80%. Coverage is a tool to <em>find</em> untested code, especially uncovered branches; it is not a proof of correctness. Chasing the number is a classic anti-pattern.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Jest, Vitest, or node:test — how do you choose?"</strong><br>A: Jest is the batteries-included default with a huge ecosystem, historically weaker on native ESM/TS. Vitest has a near-identical API but native ESM/TS via Vite and a fast watch mode — great for modern TS or Vite projects. node:test ships in Node itself with zero dependencies, ideal when you want no extra deps, though leaner on mocking and snapshots. The concepts are identical across all three; I'd pick based on the repo's module system and existing tooling, not dogma.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why bother writing tests at all — isn't it slower?"</strong><br>A: Slower to write the first line, faster over the life of the code. Tests are an executable spec and a regression net: they let you change and refactor without fear, they document intended behaviour, and they catch breakage in seconds instead of in production. On a backend touching money and auth, that is not optional. The cost is front-loaded; the payback is every subsequent change.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What makes a good test, in one sentence?"</strong><br>A: It checks one observable behaviour, is deterministic and fast, fails clearly when that behaviour breaks, and does not break when you refactor internals that don't change behaviour. If a test only breaks when the implementation changes but the behaviour didn't, it's testing the wrong thing.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Test = </strong>run real code with known input, <code>assert</code> the output; pass or throw.</li>`,
        `<li><strong>Pyramid:</strong> many unit (fast, isolated) &#8594; some integration (real wiring) &#8594; few e2e (whole system).</li>`,
        `<li><strong>Unit:</strong> one function, doubles for collaborators, no I/O, ms.</li>`,
        `<li><strong>Integration:</strong> route + middleware + real test DB (supertest).</li>`,
        `<li><strong>E2E:</strong> full system, all real, few &amp; critical paths only.</li>`,
        `<li><strong>Runners:</strong> Jest (batteries-included), Vitest (ESM/TS-native), node:test (built in).</li>`,
        `<li><strong>Runner does:</strong> discover &#183; isolate &#183; run &#183; report &#183; exit code for CI.</li>`,
        `<li><strong>Coverage &#8800; correctness</strong> — it shows lines ran, not that behaviour is right.</li>`,
        `<li><strong>Good test:</strong> one behaviour, deterministic, fast, refactor-proof.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 1 — Unit testing
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Unit Testing',
      slug: 'unit-testing',
      order: 1,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Unit tests are the workhorses of any healthy suite — the wide green base of the pyramid. They are the tests you run hundreds of times a day, the ones that finish before you've taken your hand off the keyboard, and the ones that, when they go red, tell you <em>exactly</em> which function you just broke. A backend with strong unit coverage is a backend you can refactor at speed, because you have a fast, precise alarm that trips the instant behaviour changes.</p>`,
        `<p>The reason unit tests earn their keep is <strong>localisation of failure</strong>. When an integration test fails you get "the orders endpoint returned 500"; you then go spelunking. When a unit test fails you get "calculateDiscount() returns 0 for a 10% coupon" — the bug and its address in one line. Multiply that across a day of edits and the difference is enormous. Fast, precise feedback is the whole reason the base of the pyramid is wide.</p>`,
        `<p>Unit testing also has a second, sneakier payoff: it is a <strong>design pressure</strong>. Code that is hard to unit-test is almost always badly factored — it does too much, reaches for globals, or hard-wires its dependencies. When you feel that pain, the test is telling you the design is wrong. Learning to write testable code is, in large part, learning to write well-decoupled code. In interviews, "how would you make this testable?" is really "do you understand dependency injection and pure functions?"</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A unit test takes one unit of code — a function or a class method — feeds it known inputs, and checks the output, with every external collaborator (database, network, clock, file system) replaced or absent. Because nothing external is involved, the test is <strong>deterministic</strong> (same input, same result, every time) and <strong>fast</strong> (no I/O to wait on).</p>`,
        `<p>The universal skeleton is <strong>Arrange–Act–Assert</strong> (AAA). <em>Arrange</em>: set up the inputs and any state the unit needs. <em>Act</em>: call the one thing under test — a single invocation. <em>Assert</em>: check the observable result. Three visual blocks, separated by blank lines, so anyone reading the test sees intent at a glance.</p>`,
        `{{fig:ch13-aaa-pattern.svg|Three boxes left to right Arrange set up inputs Act call the unit under test Assert check the observable result with arrows between them|Every unit test is Arrange then Act then Assert — set up, do the one thing, check the result.}}`,
        `<p>The <strong>assertion</strong> is the heart of the test. It states, in code, what you expect: <code>expect(result).toBe(5)</code>. If reality disagrees, the assertion throws and the runner marks the test failed. Choosing the right assertion matters — <code>toBe</code> for primitives (strict <code>===</code>), <code>toEqual</code> for deep structural equality of objects and arrays, <code>toThrow</code> for expected errors. A test with no assertion is not a test; it only proves the code didn't crash.</p>`,
        `<h2>How it works</h2>`,
        `<p>The runner discovers your test files, and for each <code>it()</code> it executes the callback inside a try/catch. If the callback returns without throwing, the test passes. If any assertion inside it throws (which is what a failed <code>expect</code> does), the runner records the failure, the message, and where it happened, then moves on to the next test. Tests are isolated — the failure of one does not stop the others — and Jest runs separate test <em>files</em> in parallel worker processes for speed, which is exactly why tests must not share mutable global state.</p>`,
        `<p><strong>What counts as "a unit" is a judgement call, and interviewers probe it.</strong> The pragmatic definition is "a unit of behaviour you'd want to verify independently" — often a function, sometimes a small cluster of functions that only make sense together. Purists insist a unit is exactly one function with every collaborator mocked; pragmatists let a few pure helpers ride along rather than mock them. The useful line is the <em>boundary</em>: the moment your code would reach for I/O — a DB call, an HTTP request, the clock, the file system — that is where a unit test stops and you either inject a fake or split the logic out.</p>`,
        `<p>Which leads to the central skill: <strong>writing testable code</strong>. Three techniques do most of the work.</p>`,
        `<p><strong>1. Prefer pure functions.</strong> A pure function's output depends only on its inputs and it causes no side effects. Pure functions are trivially testable — pass input, assert output, no setup at all. The art is separating the pure decision-making ("what discount applies?") from the impure effects ("save the order to the DB"). Push logic into pure functions and keep the impure shell thin.</p>`,
        `<p><strong>2. Inject dependencies instead of importing them.</strong> If a function creates its own database client inside itself, a test cannot replace it. If the function <em>receives</em> the client as a parameter (or via a constructor), the test hands it a fake. This is dependency injection, and it is the single biggest lever for testability.</p>`,
        `<p><strong>3. Isolate the non-deterministic.</strong> Anything that varies run-to-run — <code>Date.now()</code>, <code>Math.random()</code>, <code>process.env</code> — should come in through a parameter or a small wrapper you can control, so the test can pin it to a fixed value.</p>`,
        `<h2>Code examples</h2>`,
        `<p>A pure function and its unit tests, in clean AAA form. Notice the blank lines splitting the three phases and the one-behaviour-per-test discipline:</p>`,
        `<pre><code class="language-javascript">// discount.js
function calculateDiscount(price, coupon) {
  if (price <= 0) throw new Error('price must be positive');
  if (!coupon) return price;
  if (coupon.type === 'percent') {
    return price - (price * coupon.value) / 100;
  }
  return Math.max(0, price - coupon.value);
}
module.exports = { calculateDiscount };
</code></pre>`,
        `<pre><code class="language-javascript">// discount.test.js
const { calculateDiscount } = require('./discount');

describe('calculateDiscount()', () => {
  it('applies a percentage coupon', () => {
    // Arrange
    const price = 200;
    const coupon = { type: 'percent', value: 10 };

    // Act
    const result = calculateDiscount(price, coupon);

    // Assert
    expect(result).toBe(180);
  });

  it('never returns a negative price for a large flat coupon', () => {
    const result = calculateDiscount(50, { type: 'flat', value: 80 });
    expect(result).toBe(0);
  });

  it('returns the full price when there is no coupon', () => {
    expect(calculateDiscount(99, null)).toBe(99);
  });

  it('throws on a non-positive price', () => {
    // note: pass a FUNCTION to toThrow, or the throw escapes the assertion
    expect(() => calculateDiscount(0, null)).toThrow('price must be positive');
  });
});
</code></pre>`,
        `<p>Untestable versus testable, side by side. The first function reaches for the clock and a hard-wired dependency; the second receives them, so a test can control both:</p>`,
        `<pre><code class="language-javascript">// HARD to unit-test: hidden clock + self-created dependency
const db = require('./db');
async function createTrialUser(email) {
  const expiresAt = new Date(Date.now() + 7 * 864e5); // real clock
  return db.users.insert({ email, expiresAt });        // real DB
}

// EASY to unit-test: dependencies injected
function makeTrialUser({ now }) {
  return function build(email) {
    const expiresAt = new Date(now + 7 * 864e5);
    return { email, expiresAt }; // pure: returns data, no I/O
  };
}
</code></pre>`,
        `<pre><code class="language-javascript">// makeTrialUser.test.js — a fixed clock makes the result deterministic
const { makeTrialUser } = require('./trial');

it('sets a 7-day expiry from the injected clock', () => {
  const now = new Date('2026-01-01T00:00:00Z').getTime();
  const build = makeTrialUser({ now });

  const user = build('a@b.com');

  expect(user.expiresAt.toISOString()).toBe('2026-01-08T00:00:00.000Z');
});
</code></pre>`,
        `<p>Choosing the right matcher matters — <code>toBe</code> compares by identity, so it fails on two distinct-but-equal objects:</p>`,
        `<pre><code class="language-javascript">const a = { id: 1, tags: ['x'] };

expect(a).toBe({ id: 1, tags: ['x'] });   // FAILS: different references
expect(a).toEqual({ id: 1, tags: ['x'] }); // PASSES: deep structural equality
expect(a.id).toBe(1);                       // OK: primitives compare by value
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Forgetting to <code>return</code> or <code>await</code> an async assertion.</strong> If the test function is <code>async</code> and you don't await the promise, the test finishes and passes <em>before</em> the assertion runs. A rejected promise then surfaces later as an unhandled rejection, not a red test. Always <code>await</code> (or return) async expectations.</li>`,
        `<li><strong>Passing a value instead of a function to <code>toThrow</code>.</strong> <code>expect(fn()).toThrow()</code> calls <code>fn</code> immediately, so the error escapes before <code>expect</code> can catch it. It must be <code>expect(() =&gt; fn()).toThrow()</code>.</li>`,
        `<li><strong><code>toBe</code> on objects/arrays.</strong> <code>toBe</code> is <code>Object.is</code> (reference identity); use <code>toEqual</code> for deep equality. This is the single most common matcher bug.</li>`,
        `<li><strong>Tests with no real assertion.</strong> A test that only calls the function and never asserts passes as long as nothing throws — it proves almost nothing but inflates coverage and confidence.</li>`,
        `<li><strong>Over-mocking until you test the mocks.</strong> If you mock everything the unit touches, the test just verifies your mocks return what you told them to. Mock at boundaries, not inside your own logic.</li>`,
        `<li><strong>Non-deterministic inputs leaking in.</strong> Using the real <code>Date.now()</code> or <code>Math.random()</code> makes a test that passes today fail at a date boundary or one run in a thousand — the seed of flakiness.</li>`,
        `<li><strong>One test asserting five unrelated things.</strong> When it fails you can't tell which expectation broke, and the first failing assertion hides the rest.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Follow Arrange–Act–Assert, visibly.</strong> Blank lines between the three blocks make intent obvious and keep tests uniform.</li>`,
        `<li><strong>One behaviour per test, named as a sentence.</strong> "returns the full price when there is no coupon" reads like a spec and points straight at the failure.</li>`,
        `<li><strong>Push logic into pure functions.</strong> The more of your system that is pure, the more of it is testable with zero setup.</li>`,
        `<li><strong>Inject dependencies (DB, clock, randomness, config).</strong> A unit that receives its collaborators can be tested with fakes; one that creates them cannot.</li>`,
        `<li><strong>Test behaviour, not implementation.</strong> Assert on return values and observable effects, not on which private helper got called — so refactors don't turn tests red for no reason.</li>`,
        `<li><strong>Cover edge cases and error paths, not just the happy path.</strong> Zero, empty, negative, boundary, and thrown-error cases are where real bugs live.</li>`,
        `<li><strong>Keep each test independent.</strong> No test should depend on another running first or on leftover state; each arranges its own world.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "What exactly is a 'unit', and what do you mock in a unit test?"</strong><br>A: A unit is the smallest piece of behaviour worth verifying on its own — usually a function or method. In a unit test you replace anything that crosses a boundary: the database, network calls, the clock, the file system, randomness. What you do <em>not</em> mock is your own pure logic. The tell of a good unit test is that it's deterministic and runs in milliseconds because nothing external is involved.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is Arrange-Act-Assert?"</strong><br>A: The three-phase structure of a test. Arrange sets up inputs and state; Act invokes the single thing under test; Assert checks the observable result. Keeping them as distinct blocks makes tests readable and enforces the discipline of one action and one clear expectation per test. If you find yourself with two Act phases, that's usually two tests.</p></blockquote>`,
        `<blockquote><p><strong>Q: "This function is hard to test — how would you fix it?"</strong><br>A: Ask why it's hard. Usually it creates its own dependencies or reaches for the clock/randomness internally. I'd apply dependency injection — pass the DB client, the current time, the config in as parameters — and split the pure decision logic out from the side effects. Once the logic is pure and the collaborators are injectable, the test becomes trivial: pass fakes, assert the output. Hard-to-test almost always means poorly-decoupled.</p></blockquote>`,
        `<blockquote><p><strong>Q: "toBe vs toEqual?"</strong><br>A: <code>toBe</code> is identity comparison (<code>Object.is</code>, essentially <code>===</code>) — right for primitives and for asserting two references are the same object. <code>toEqual</code> does a deep, recursive structural comparison — right for objects and arrays where you care about contents, not identity. Using <code>toBe</code> on two equal-but-distinct objects is a classic false failure.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you test a function that uses the current date or a random value?"</strong><br>A: Remove the non-determinism from inside the function. Inject the clock or the random source as a parameter, or wrap it behind a small dependency you can control, then pin it to a fixed value in the test. Alternatively use the runner's fake timers (<code>jest.useFakeTimers()</code> / <code>vi.setSystemTime()</code>) to freeze time. The goal is that the same test gives the same result on every machine and every run.</p></blockquote>`,
        `<blockquote><p><strong>Q: "A test passes but the code is buggy — how?"</strong><br>A: Most often the test has no meaningful assertion, or it's async and the assertion runs after the test already resolved (missing await), or it asserts on a mock rather than real behaviour. Green means 'no assertion threw', which is not the same as 'the behaviour is correct'. That's why I review that every test actually asserts on the observable output and that async tests are properly awaited.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Unit test =</strong> one function, known input, assert output, no I/O.</li>`,
        `<li><strong>AAA:</strong> Arrange (set up) &#8594; Act (call once) &#8594; Assert (check result).</li>`,
        `<li><strong>Matchers:</strong> <code>toBe</code> (===/identity) &#183; <code>toEqual</code> (deep) &#183; <code>toThrow</code> (wrap in a fn!).</li>`,
        `<li><strong>Testable code =</strong> pure functions + injected dependencies + controlled time/randomness.</li>`,
        `<li><strong>async:</strong> <code>await</code> the assertion or the test passes before it runs.</li>`,
        `<li><strong>toThrow:</strong> pass <code>() =&gt; fn()</code>, never <code>fn()</code>.</li>`,
        `<li><strong>Test behaviour</strong>, not private implementation &#8594; refactor-proof.</li>`,
        `<li><strong>One behaviour per test</strong>, named as a sentence; cover edges + errors.</li>`,
        `<li><strong>Hard to test = badly decoupled</strong> &#8594; inject, don't import.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 2 — Integration testing
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Integration Testing',
      slug: 'integration-testing',
      order: 2,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Unit tests can all be green while your API is completely broken. That is not a paradox — it is the structural limitation of unit tests, and it is exactly the gap integration tests fill. A unit test proves <code>createUser()</code> returns the right object; it says nothing about whether the route is registered at the right path, whether the auth middleware runs before the handler, whether the request body is parsed, whether the validation rejects garbage, or whether the record actually lands in the database with the right shape. Those are <strong>wiring</strong> questions, and wiring is where a huge share of real backend bugs live.</p>`,
        `<p>For a Node backend the highest-value integration test is the <strong>HTTP-level API test</strong>: fire a real request at your Express app and assert on the real response and the resulting database state. One such test exercises routing, body parsing, middleware order, the controller, the model, and the database in a single pass — the whole vertical slice a user's request actually travels. When it's green you know the endpoint genuinely works, not just that its pieces work in isolation.</p>`,
        `<p>In interviews this is where you prove you understand a request's full lifecycle and can reason about test <em>infrastructure</em> — test databases, setup and teardown, isolation between tests. "How do you test an Express endpoint?" is a standard question, and the strong answer names <strong>supertest</strong>, a real test database, and a clean lifecycle. Getting the infrastructure right is the difference between a suite that's trustworthy and one that's flaky.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>An integration test exercises several real components together across a boundary, mocking only the genuinely external world (a payment gateway, an email provider). The canonical backend version sends an HTTP request into your app and checks two things: the <strong>response</strong> (status code, body, headers) and the <strong>side effects</strong> (what changed in the database).</p>`,
        `<p>The tool that makes this ergonomic is <strong>supertest</strong>. You hand it your Express <code>app</code> object — not a URL — and it spins up the server on an ephemeral random port, sends a real HTTP request, and gives you a fluent API to assert on the response. Because it binds the app itself, you never hardcode a port, never manually call <code>app.listen()</code> in the test, and never collide with a port already in use.</p>`,
        `{{fig:ch13-supertest-flow.svg|Flow from a test file calling request(app) to an ephemeral server on a random port to your real app and back with the response then expect(201)|supertest binds your Express app to a random port, sends a real request through the full stack, and returns the response to assert on.}}`,
        `<p>The other half of integration testing is the <strong>test database</strong>. You do <em>not</em> point tests at production, and you should not mock the database (that would defeat the purpose — you want to catch real schema and query bugs). Instead you run against a real database dedicated to testing — an in-memory MongoDB, a disposable Docker Postgres, or a separate test schema — and you reset it around each test so tests don't contaminate one another.</p>`,
        `<h2>How it works</h2>`,
        `<p>Structuring the app for testability is step zero. The classic mistake is calling <code>app.listen()</code> in the same file that defines the app, so importing it for a test starts a real server on a real port. The fix is to <strong>separate app creation from server start</strong>: one module exports the configured <code>app</code>; a thin entry file imports it and calls <code>listen()</code>. Tests import the app; production imports the entry file. supertest takes the app and manages the port itself.</p>`,
        `<p>Next comes the <strong>lifecycle</strong>, driven by the runner's hooks. Jest gives you <code>beforeAll</code>, <code>afterAll</code>, <code>beforeEach</code>, and <code>afterEach</code>. The standard shape:</p>`,
        `<ul>`,
        `<li><code>beforeAll</code> — connect to the test database once (expensive; do it a single time for the file).</li>`,
        `<li><code>beforeEach</code> — put the database in a known clean state (clear collections/tables, optionally seed fixtures) so every test starts from the same baseline.</li>`,
        `<li><code>afterEach</code> — optionally clean up; often folded into the next <code>beforeEach</code> instead.</li>`,
        `<li><code>afterAll</code> — disconnect and shut everything down so the process exits and no open handle leaks.</li>`,
        `</ul>`,
        `<p>The reason clean state belongs in <code>beforeEach</code> (not <code>afterEach</code>) is robustness: if a test crashes mid-way, its mess is cleaned by the <em>next</em> test's setup rather than being left behind by a skipped teardown. And it belongs at <code>beforeEach</code> granularity — not once per file — because tests run in an order you should not rely on, and any shared row is a source of order-dependent flakiness.</p>`,
        `<p><strong>Isolation strategy</strong> is the deep design decision. Three common approaches, from simplest to strongest: (1) <em>truncate between tests</em> — delete all rows in <code>beforeEach</code>; simple and the most common. (2) <em>transaction rollback</em> — wrap each test in a DB transaction and roll it back afterward, so nothing is ever committed; very fast on SQL databases but fiddly with connection pooling. (3) <em>fresh database per worker</em> — because runners parallelise across worker processes, two workers hitting the same test DB will corrupt each other; giving each worker its own database (or schema) keeps parallel runs isolated. Interviewers love the parallelism angle: "your integration tests pass alone but fail in CI" is very often two workers sharing one database.</p>`,
        `<p>For the database itself, popular choices are <code>mongodb-memory-server</code> (spins up a real, in-memory MongoDB per test run — no external service, fully isolated), a Dockerised Postgres/MySQL via Testcontainers, or a dedicated test schema on a local instance. In-memory and containerised options win because they are disposable and reproducible: every run starts from nothing, so there is no "works on my machine because my local DB has old data" drift.</p>`,
        `<h2>Code examples</h2>`,
        `<p>First, the split that makes the app importable. <code>app.js</code> builds and exports the app with no <code>listen()</code>; <code>server.js</code> starts it:</p>`,
        `<pre><code class="language-javascript">// app.js — no listen() here, so tests can import the app cleanly
const express = require('express');
const usersRouter = require('./routes/users');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', usersRouter);
  return app;
}
module.exports = { createApp };

// server.js — the only place that binds a port (production entry point)
const { createApp } = require('./app');
createApp().listen(3000, () => console.log('listening on 3000'));
</code></pre>`,
        `<p>The integration test itself, with a real in-memory MongoDB and a clean-per-test lifecycle. Note it asserts on both the HTTP response <em>and</em> the database state:</p>`,
        `<pre><code class="language-javascript">// users.integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('./app');
const User = require('./models/User');

let mongod;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();       // real Mongo, in memory
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();                       // close the connection
  await mongod.stop();                               // free the handle so Jest exits
});

beforeEach(async () => {
  await User.deleteMany({});                          // clean slate every test
});

describe('POST /users', () => {
  it('creates a user and returns 201 with the new record', async () => {
    // Act — supertest sends a real HTTP request through the whole stack
    const res = await request(app)
      .post('/users')
      .send({ email: 'a@b.com', name: 'Ann' })
      .expect(201);

    // Assert on the response
    expect(res.body).toMatchObject({ email: 'a@b.com', name: 'Ann' });
    expect(res.body.id).toBeDefined();

    // Assert on the side effect — the row really landed in the DB
    const inDb = await User.findOne({ email: 'a@b.com' });
    expect(inDb).not.toBeNull();
  });

  it('rejects an invalid body with 400', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'no email' })
      .expect(400);

    expect(res.body.error).toMatch(/email/i);
    expect(await User.countDocuments()).toBe(0);     // nothing was written
  });
});
</code></pre>`,
        `<p>Testing an authenticated route: supertest chains header calls just like a real client, so you attach a token exactly as the app expects it:</p>`,
        `<pre><code class="language-javascript">it('returns the current user for a valid token', async () => {
  const token = signTestToken({ userId: 'u1' });      // helper that mints a JWT

  const res = await request(app)
    .get('/users/me')
    .set('Authorization', \`Bearer \${token}\`)
    .expect(200);

  expect(res.body.id).toBe('u1');
});

it('rejects a missing token with 401', async () => {
  await request(app).get('/users/me').expect(401);
});
</code></pre>`,
        `<p>Mocking only the genuinely external boundary — the payment provider — while everything else stays real. You test <em>your</em> code's reaction to the gateway, not the gateway itself:</p>`,
        `<pre><code class="language-javascript">jest.mock('./services/payments'); // auto-mock the external gateway module
const payments = require('./services/payments');

it('marks the order paid when the gateway succeeds', async () => {
  payments.charge.mockResolvedValue({ id: 'ch_1', status: 'succeeded' });

  const res = await request(app)
    .post('/orders')
    .send({ item: 'book', amount: 500 })
    .expect(201);

  expect(res.body.status).toBe('paid');
  expect(payments.charge).toHaveBeenCalledWith(
    expect.objectContaining({ amount: 500 })
  );
});
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Calling <code>app.listen()</code> in the file you import for tests.</strong> It starts a real server and often throws <code>EADDRINUSE</code> when a second test file imports it. Separate app creation from server start; hand supertest the app, not a URL.</li>`,
        `<li><strong>Sharing one test database across parallel workers.</strong> Jest and Vitest run files in parallel processes; if they all write the same DB, they corrupt each other and you get tests that pass alone but fail in CI. Give each worker its own database/schema, or run integration tests serially (<code>--runInBand</code>).</li>`,
        `<li><strong>Cleaning state in <code>afterEach</code> instead of <code>beforeEach</code>.</strong> If a test crashes, its <code>afterEach</code> may not run and the mess leaks into the next test. Reset in <code>beforeEach</code> so every test guarantees its own clean start.</li>`,
        `<li><strong>Forgetting to close connections in <code>afterAll</code>.</strong> An open DB connection or server handle keeps the Node process alive; Jest then warns "did not exit" or hangs. Disconnect and stop everything you started.</li>`,
        `<li><strong>Tests that depend on execution order.</strong> Relying on a record a previous test created makes the suite fragile — reorder or parallelise it and it breaks. Each test must arrange its own data.</li>`,
        `<li><strong>Mocking the database.</strong> Then you're not integration-testing anything — you've built a slow unit test that can't catch schema or query bugs. Use a real (disposable) test DB.</li>`,
        `<li><strong>Pointing tests at a shared dev or (worse) production database.</strong> Tests must own a disposable database they can wipe freely; never run destructive setup against data you care about.</li>`,
        `<li><strong>Missing <code>await</code> on the supertest call.</strong> supertest returns a thenable; without <code>await</code> the assertions in <code>.expect()</code> may not be observed and failures slip through as unhandled rejections.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Export the app, start the server separately.</strong> One module returns the configured app; a thin entry file calls <code>listen()</code>. Tests and supertest use the app object.</li>`,
        `<li><strong>Use a real, disposable test database.</strong> In-memory Mongo or a Dockerised Postgres via Testcontainers — reproducible, isolated, wiped every run.</li>`,
        `<li><strong>Reset state in <code>beforeEach</code>; open/close once in <code>beforeAll</code>/<code>afterAll</code>.</strong> Clean slate per test, expensive connect/disconnect once per file.</li>`,
        `<li><strong>Isolate parallel workers.</strong> A database (or schema) per worker, or run integration tests serially. Never let two workers share writable state.</li>`,
        `<li><strong>Assert both the response and the side effect.</strong> Check the status/body <em>and</em> that the database actually changed (or didn't, on the error path).</li>`,
        `<li><strong>Mock only the true external boundary.</strong> Stub the payment gateway or email service; keep your routes, middleware, and DB real so the wiring is genuinely exercised.</li>`,
        `<li><strong>Test the unhappy paths too.</strong> 400 on bad input, 401 without a token, 404 for a missing resource, and confirm nothing was written when it shouldn't have been.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "How do you test an Express API endpoint?"</strong><br>A: With supertest against a real test database. I structure the app so <code>createApp()</code> returns the configured app without calling <code>listen()</code>, then in the test I do <code>request(app).post('/users').send(body).expect(201)</code>. supertest binds the app to an ephemeral port and sends a real HTTP request through routing, middleware, and the controller. I assert on the response <em>and</em> query the DB to confirm the side effect. The database is a disposable test instance reset in <code>beforeEach</code>.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Why hand supertest the app object instead of a running URL?"</strong><br>A: So the test owns the server lifecycle. supertest starts the app on a random free port for the duration of the request and tears it down after — no hardcoded port, no <code>EADDRINUSE</code> clashes, no manual <code>listen()</code>/close dance, and it works even if the app is never separately started. It also means the test hits your real app in-process rather than depending on an externally running server.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Where do you put database setup and cleanup, and why there?"</strong><br>A: Connect once in <code>beforeAll</code> and disconnect in <code>afterAll</code> — connecting is expensive and should happen once per file. Reset the data in <code>beforeEach</code>, not <code>afterEach</code>, so that if a test crashes mid-way its mess is cleaned by the next test's setup rather than left behind by a skipped teardown. That gives every test a guaranteed clean slate regardless of what happened before it.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Your integration tests pass locally but fail in CI. First hypothesis?"</strong><br>A: Parallel workers sharing one test database. Jest and Vitest run test files in separate processes; if each connects to the same DB they overwrite each other's rows and you get order-dependent, environment-dependent failures. The fix is a database or schema per worker, or forcing integration tests to run serially with <code>--runInBand</code>. Open handles not being closed in <code>afterAll</code> is a close second.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Should you mock the database in an integration test?"</strong><br>A: No — that defeats the purpose. The whole point is to catch real schema mismatches, bad queries, and migration issues, which a mock can't surface. I use a real but disposable database (in-memory Mongo, Dockerised Postgres) that's wiped around each test. I only mock genuinely external services like a payment gateway, where I want to control the response and not hit a real third party in CI.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What does an integration test catch that a unit test can't?"</strong><br>A: Everything about how the pieces connect: a wrong route path, middleware in the wrong order, body-parsing not configured, a validation rule that doesn't fire, a schema that doesn't match what the code writes, auth that lets the wrong request through. Unit tests verify each function in isolation; the integration test verifies the vertical slice a real request travels — which is where a large share of production bugs actually originate.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Integration test =</strong> real request &#8594; real routes/middleware/DB &#8594; assert response + side effect.</li>`,
        `<li><strong>supertest:</strong> <code>request(app)</code> (pass the app, not a URL) &#8594; ephemeral port, real HTTP.</li>`,
        `<li><strong>Split app from server:</strong> export <code>createApp()</code>; <code>listen()</code> only in the entry file.</li>`,
        `<li><strong>Lifecycle:</strong> connect in <code>beforeAll</code> &#183; clean in <code>beforeEach</code> &#183; disconnect in <code>afterAll</code>.</li>`,
        `<li><strong>Clean in beforeEach</strong> (survives a crashed test), not afterEach.</li>`,
        `<li><strong>Test DB:</strong> real but disposable (mongodb-memory-server, Dockerised Postgres) — never mock the DB, never use prod.</li>`,
        `<li><strong>Parallel workers</strong> &#8594; DB/schema per worker or <code>--runInBand</code>; shared DB = CI flakiness.</li>`,
        `<li><strong>Mock only</strong> the true external boundary (payments, email).</li>`,
        `<li><strong>Assert response AND DB state</strong>; test 400/401/404 paths too.</li>`,
        `</ul>`,
      ].join('\n'),
    },

    // ────────────────────────────────────────────────────────────────
    // TOPIC 3 — Mocking & coverage
    // ────────────────────────────────────────────────────────────────
    {
      title: 'Mocking &amp; Coverage',
      slug: 'mocking-coverage',
      order: 3,
      content: [
        `<h2>Why it matters</h2>`,
        `<p>Real code has dependencies you cannot or should not call for real in a test: a payment API that charges money, an email service that spams inboxes, a clock that makes results change by the day, a database call you want to keep out of a pure unit test. <strong>Test doubles</strong> — the family of spies, stubs, and mocks — are how you cut those dependencies out and take control of them, so a test can run fast, offline, deterministically, and can simulate conditions (a network timeout, a 500 from the gateway) that are hard to trigger for real.</p>`,
        `<p><strong>Coverage</strong>, meanwhile, is how you find the code your tests <em>forgot</em>. It is a map of which lines and branches ran during the suite, and its highest use is spotting the untested error path nobody thought about. But coverage is also the single most misunderstood metric in testing, and interviewers use it as a maturity test: a junior treats "100%" as the goal; a senior knows it measures execution, not correctness, and reasons about it accordingly.</p>`,
        `<p>Finally, <strong>flaky tests</strong> — tests that pass and fail without any code change — are the thing that quietly destroys a suite's value. Once a suite fails randomly, people start re-running until green and then stop trusting red altogether, which defeats the entire point of having tests. Knowing the common causes of flakiness (real time, shared state, ordering, unawaited async) and how to kill them is core senior-engineer knowledge.</p>`,
        `<h2>The concept, simply</h2>`,
        `<p>A <strong>test double</strong> is any stand-in for a real dependency. The three you must be able to distinguish: a <strong>spy</strong> records how a function was called (arguments, call count) while optionally letting the real thing still run — it's about <em>observing</em>. A <strong>stub</strong> replaces a function with a canned return value so you can control what a dependency <em>gives back</em> — it's about <em>controlling inputs</em>. A <strong>mock</strong> is a stub with built-in expectations about how it should be called — it both controls inputs and <em>verifies</em> the interaction.</p>`,
        `{{fig:ch13-test-doubles.svg|Three cards Spy records calls Stub returns canned values Mock stub plus expectations with a note that jest.fn is all three|Spies observe calls, stubs control return values, mocks add expectations — and Jest's jest.fn() does all three.}}`,
        `<p>Here's the practical catch that trips people up: <strong>Jest deliberately blurs these lines.</strong> A single <code>jest.fn()</code> is simultaneously a spy (it records every call in <code>.mock.calls</code>), a stub (you set its return with <code>mockReturnValue</code>), and a mock (you verify it with <code>expect(fn).toHaveBeenCalledWith(...)</code>). So in Jest you rarely say "make me a stub"; you make a mock function and use whichever facet you need. In interviews you should still be able to define the three precisely — the vocabulary comes from the wider testing literature (and libraries like Sinon that keep them separate).</p>`,
        `<p><strong>Coverage</strong> counts, as your tests run, which parts of the code executed. It reports four numbers: <em>statement</em>, <em>branch</em>, <em>function</em>, and <em>line</em> coverage. Branch coverage is the one that matters most, because it asks whether <em>both</em> sides of every <code>if</code> ran — the untested <code>else</code> is where bugs hide.</p>`,
        `{{fig:ch13-coverage-types.svg|Four boxes Statement each line ran Branch both if else sides Function each function called Line source lines executed with a note that coverage proves lines ran not correctness|The four coverage metrics — branch coverage, checking both sides of every decision, is the one that matters most.}}`,
        `<h2>How it works</h2>`,
        `<p><strong>Creating doubles in Jest.</strong> <code>jest.fn()</code> makes a standalone mock function. <code>jest.spyOn(obj, 'method')</code> wraps an existing method so you can observe (and optionally override) it while keeping the ability to restore the original. <code>jest.mock('./module')</code> replaces an <em>entire module</em> with auto-generated mock functions — this is how you neutralise a whole dependency like a payments client or the <code>fs</code> module. The distinction interviewers probe: <code>spyOn</code> by default calls through to the real implementation unless you add <code>.mockReturnValue()</code>, whereas <code>jest.mock</code> replaces the module wholesale.</p>`,
        `<p><strong>Module mocking is hoisted.</strong> Jest lifts <code>jest.mock()</code> calls to the top of the file, above the imports, so the mock is in place before the module under test <code>require</code>s its dependency. This is why <code>jest.mock('./payments')</code> works even though you wrote it after the import line — and why it can feel like magic until you know it's happening. (In Vitest the equivalent is <code>vi.mock()</code>, also hoisted; in ESM you sometimes need <code>vi.hoisted()</code> for values referenced inside the factory.)</p>`,
        `<p><strong>Mocking time.</strong> Real timers and <code>Date.now()</code> make tests slow (waiting for a real <code>setTimeout</code>) and non-deterministic (results change with the date). Fake timers solve both: <code>jest.useFakeTimers()</code> replaces the timer functions and the clock with controllable versions, then <code>jest.advanceTimersByTime(1000)</code> fast-forwards a second instantly and <code>jest.setSystemTime(date)</code> pins "now". A test for a function that fires after a 30-minute delay runs in microseconds. Always restore real timers afterward (<code>jest.useRealTimers()</code>) so you don't leak the fake into other tests.</p>`,
        `<p><strong>How coverage is measured.</strong> The runner <em>instruments</em> your code — it rewrites it to increment counters whenever a statement, branch, or function executes — runs the suite, and tallies the counters. Jest does this with <code>--coverage</code> (built on Istanbul); Vitest via <code>--coverage</code> (v8 or Istanbul); node:test via <code>--experimental-test-coverage</code>. The report shows percentages per file and lists the exact uncovered lines. You can set <strong>thresholds</strong> in config (e.g. fail the build under 80% branch coverage) to stop coverage silently eroding — a floor, not a target.</p>`,
        `<p><strong>Why 100% is a trap.</strong> Coverage only proves a line <em>ran</em>, not that its behaviour was <em>asserted</em>. A test that calls a function and checks nothing still marks every line it touched as covered. So 100% coverage with weak assertions is worse than 80% with strong ones: it manufactures false confidence. Use coverage to <em>find</em> gaps (especially uncovered branches), never as proof of quality.</p>`,
        `<p><strong>Flaky tests and their causes.</strong> A flaky test is non-deterministic. The usual culprits: (1) real time/timeouts — use fake timers; (2) shared state between tests — reset in <code>beforeEach</code>; (3) test-order dependence — make each test self-contained; (4) unawaited async — a floating promise resolves after the test ends; (5) real network/external services — mock them; (6) time-zone or locale assumptions. The cure is always the same principle: remove the source of non-determinism and control it explicitly.</p>`,
        `<h2>Code examples</h2>`,
        `<p>The three faces of <code>jest.fn()</code> — spy, stub, and verification — in one place:</p>`,
        `<pre><code class="language-javascript">const fn = jest.fn();          // a mock function

fn.mockReturnValue(42);        // STUB: control what it returns
const out = fn('a', 'b');

expect(out).toBe(42);
expect(fn).toHaveBeenCalledTimes(1);            // SPY: it recorded the call
expect(fn).toHaveBeenCalledWith('a', 'b');      // MOCK: verify the interaction
expect(fn.mock.calls[0]).toEqual(['a', 'b']);   // raw record of arguments
</code></pre>`,
        `<p>Mocking a whole module so the code under test never touches the real service. Here we test that our code reacts correctly to a gateway <em>failure</em> — a condition that's hard to trigger for real:</p>`,
        `<pre><code class="language-javascript">// jest.mock is hoisted above the imports, so the mock is ready first
jest.mock('./services/payments');
const payments = require('./services/payments');
const { placeOrder } = require('./orders');

describe('placeOrder()', () => {
  afterEach(() => jest.clearAllMocks()); // reset call history between tests

  it('returns a friendly error when the gateway declines', async () => {
    // STUB: force the dependency to reject
    payments.charge.mockRejectedValue(new Error('card_declined'));

    const result = await placeOrder({ item: 'book', amount: 500 });

    expect(result).toEqual({ ok: false, reason: 'payment_failed' });
    // MOCK: verify we called the gateway with the right amount
    expect(payments.charge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500 })
    );
  });
});
</code></pre>`,
        `<p><code>spyOn</code> to observe a real method, and to restore it afterward so nothing leaks:</p>`,
        `<pre><code class="language-javascript">it('logs a warning on a retry', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  retryOnce(() => { throw new Error('boom'); });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('retrying'));
  warn.mockRestore(); // put the real console.warn back
});
</code></pre>`,
        `<p>Mocking time with fake timers — a debounce that fires after 300ms is tested in microseconds:</p>`,
        `<pre><code class="language-javascript">it('calls the handler once after the debounce window', () => {
  jest.useFakeTimers();
  const handler = jest.fn();
  const debounced = debounce(handler, 300);

  debounced();
  debounced();                       // called twice in quick succession
  expect(handler).not.toHaveBeenCalled();

  jest.advanceTimersByTime(300);     // fast-forward, no real waiting
  expect(handler).toHaveBeenCalledTimes(1);

  jest.useRealTimers();              // always restore
});

// Pinning "now" for a date-dependent function:
it('stamps the fixed current time', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  expect(makeTimestamp()).toBe('2026-01-01T00:00:00.000Z');
  jest.useRealTimers();
});
</code></pre>`,
        `<p>Enforcing a coverage floor in <code>jest.config.js</code> so coverage can't silently rot — a gate, not a vanity number:</p>`,
        `<pre><code class="language-javascript">// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 85, statements: 85 },
  },
};
// Run: jest --coverage  ->  build FAILS if branch coverage drops below 80%.
// Note: branches is set lower on purpose — it is the hardest and most useful.
</code></pre>`,
        `<h2>Common mistakes &amp; gotchas</h2>`,
        `<ul>`,
        `<li><strong>Not resetting mocks between tests.</strong> A <code>jest.fn()</code>'s call history and stubbed return values persist across tests in a file, so one test sees another's setup. Use <code>clearAllMocks</code>/<code>resetAllMocks</code> in <code>beforeEach</code> (or set <code>clearMocks: true</code> in config).</li>`,
        `<li><strong>Forgetting to restore <code>spyOn</code> or fake timers.</strong> A spy left on <code>console.warn</code>, or fake timers never switched back, leaks into later tests and causes bewildering, order-dependent failures. Always <code>mockRestore()</code> / <code>useRealTimers()</code>.</li>`,
        `<li><strong>Over-mocking.</strong> Mock so much that the test only exercises your mocks and never the real logic. Then the test passes no matter what the real code does. Mock at boundaries; keep your own logic real.</li>`,
        `<li><strong>Treating 100% coverage as "well tested".</strong> Coverage counts execution, not assertions. High coverage with weak assertions is false confidence; it's a discovery tool, not a quality proof.</li>`,
        `<li><strong>Ignoring branch coverage.</strong> Statement/line coverage can look great while an entire <code>else</code> or error path never ran. Branch coverage is the number that reveals the untested decision.</li>`,
        `<li><strong>Re-running flaky tests until green.</strong> Retrying a flaky test hides a real non-determinism (shared state, real time, unawaited async) that will eventually bite in production. Fix the cause; don't paper over it with retries.</li>`,
        `<li><strong>Mocking what you're testing.</strong> If you mock the very function under test (or its core logic), the test proves nothing. Mock its <em>collaborators</em>, not the subject.</li>`,
        `<li><strong>Mock drift.</strong> A hand-written mock that no longer matches the real dependency's signature lets tests pass while production breaks. Prefer auto-mocks or typed mocks, and keep them honest.</li>`,
        `</ul>`,
        `<h2>Best practices</h2>`,
        `<ul>`,
        `<li><strong>Reset mocks between tests.</strong> <code>clearMocks: true</code> in config, or <code>jest.clearAllMocks()</code> in <code>beforeEach</code>, so each test starts clean.</li>`,
        `<li><strong>Always restore spies and fake timers.</strong> <code>mockRestore()</code> and <code>useRealTimers()</code> keep a double from leaking into unrelated tests.</li>`,
        `<li><strong>Mock at the boundary, not inside your logic.</strong> Replace the network, the clock, the payment gateway; leave your own decision-making real so the test actually exercises it.</li>`,
        `<li><strong>Use fake timers for anything time-dependent.</strong> Debounces, retries with backoff, TTLs — fast and deterministic instead of slow and flaky.</li>`,
        `<li><strong>Read coverage by branch, and use it to find gaps.</strong> Look at the uncovered-lines report to spot the error path you forgot; don't chase a headline percentage.</li>`,
        `<li><strong>Set a coverage <em>floor</em> in CI, not a 100% target.</strong> A threshold stops erosion; an obsession with 100% breeds assertion-free tests.</li>`,
        `<li><strong>Treat every flaky test as a bug.</strong> Quarantine it, find the non-determinism (time, order, shared state, async), and fix the root cause rather than retrying.</li>`,
        `</ul>`,
        `<h2>⭐ Interview lens</h2>`,
        `<blockquote><p><strong>Q: "Difference between a mock, a stub, and a spy?"</strong><br>A: A spy observes — it records how a function was called while the real implementation may still run. A stub replaces a function with a canned return so you control what a dependency gives back. A mock is a stub plus expectations — it also verifies the function was called the right way. In Jest the distinction blurs because <code>jest.fn()</code> is all three at once: it records calls (spy), returns what you set (stub), and can be asserted against (mock). Libraries like Sinon keep them separate.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Does 100% coverage mean your code is well tested?"</strong><br>A: No — this is the classic trap. Coverage only measures which lines executed during the run, not whether anything was asserted about them. You can hit 100% with tests that assert nothing. It's a tool to <em>find</em> untested code, and branch coverage in particular reveals untested decision paths, but it's never a proof of correctness. I use it as a floor in CI to prevent erosion, not as a goal to max out.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How do you test code that depends on the current time or a timer?"</strong><br>A: Fake timers. <code>jest.useFakeTimers()</code> replaces the real timers and clock, then <code>advanceTimersByTime()</code> fast-forwards without real waiting and <code>setSystemTime()</code> pins 'now'. So a function that fires after 30 minutes tests in microseconds and deterministically. The alternatives are injecting the clock as a dependency. Either way I always restore real timers afterward so the fake doesn't leak into other tests.</p></blockquote>`,
        `<blockquote><p><strong>Q: "A test fails maybe one run in twenty. How do you approach it?"</strong><br>A: I treat flakiness as a real bug, never as noise to retry away. The cause is almost always non-determinism: real time or timeouts, shared state between tests, order dependence, or an unawaited promise resolving after the test ends. I reproduce it (run repeatedly, randomise order), isolate which of those it is, and remove the source — fake the clock, reset state in <code>beforeEach</code>, make the test self-contained, await the async. A flaky suite erodes trust in every red, so it's worth fixing properly.</p></blockquote>`,
        `<blockquote><p><strong>Q: "What is the risk of over-mocking?"</strong><br>A: You end up testing your mocks instead of your code. If everything a function touches is stubbed, the test passes regardless of what the real logic does, and it also breaks on every refactor because it's coupled to internal call shapes. Worse, mocks can drift from the real dependency's behaviour, so tests stay green while production breaks. The discipline is to mock only at true boundaries — network, clock, third-party services — and keep your own logic real.</p></blockquote>`,
        `<blockquote><p><strong>Q: "Which coverage metric matters most and why?"</strong><br>A: Branch coverage. Statement and line coverage can be high while an entire <code>else</code> branch or error path never executed — and untested branches are exactly where bugs hide. Branch coverage asks whether both outcomes of every decision ran, so it surfaces the missing negative case, the unhandled error, the skipped guard clause. That's the number I read first in a coverage report.</p></blockquote>`,
        `<blockquote><p><strong>Q: "How does jest.mock() work when it's written below the import?"</strong><br>A: Jest hoists <code>jest.mock()</code> calls to the top of the module, above the imports, during transformation. So by the time the module under test requires its dependency, the mock is already in place. That's why it works despite appearing after the import line — and it's also why the mock factory can't reference variables declared later in the file unless you use the hoist-aware helpers.</p></blockquote>`,
        `<h2>Cheat-card</h2>`,
        `<ul>`,
        `<li><strong>Spy</strong> = observe calls &#183; <strong>Stub</strong> = canned return &#183; <strong>Mock</strong> = stub + verify.</li>`,
        `<li><strong>jest.fn()</strong> is all three; <code>spyOn</code> wraps a real method; <code>jest.mock()</code> replaces a whole module (hoisted).</li>`,
        `<li><strong>Reset between tests:</strong> <code>clearMocks</code> / <code>jest.clearAllMocks()</code>; restore spies with <code>mockRestore()</code>.</li>`,
        `<li><strong>Fake time:</strong> <code>useFakeTimers()</code> + <code>advanceTimersByTime()</code> / <code>setSystemTime()</code>; always <code>useRealTimers()</code> after.</li>`,
        `<li><strong>Coverage = 4 metrics:</strong> statement, branch, function, line. <strong>Branch matters most.</strong></li>`,
        `<li><strong>Coverage &#8800; correctness</strong> — it proves lines ran, not asserted. Use it as a floor, not a target.</li>`,
        `<li><strong>Mock at boundaries</strong> (network, clock, 3rd-party); keep your own logic real.</li>`,
        `<li><strong>Flaky causes:</strong> real time &#183; shared state &#183; order &#183; unawaited async &#183; real network. Fix the cause, don't retry.</li>`,
        `</ul>`,
      ].join('\n'),
    },
  ],
};
