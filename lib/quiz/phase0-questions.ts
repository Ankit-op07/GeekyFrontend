/**
 * PRD-005 Phase 0 — predict-output demand-validation questions.
 *
 * SERVER-ONLY. This file carries the answer key (`correctIndex`, `explanation`)
 * and must never be imported into a client component. The API strips answers
 * before sending questions to the browser and grades attempts server-side
 * (mirrors PRD-005 §6.4 discipline — no answer key on the wire pre-answer).
 *
 * These are plain multiple-choice questions. There is NO code execution here:
 * Phase 0 exists purely to measure whether learners want to practise at all
 * before any engine is built (the ≥30% attempt-rate gate, §7).
 *
 * Questions are matched to a topic by keyword, not by exact slug — see
 * getQuestionsForTopic(). Keep keywords broad enough to land on the
 * highest-traffic JS topics; a topic that matches nothing simply shows no quiz.
 */

export interface Phase0Question {
    id: string;
    /** Lower-case keywords matched (as substrings) against a topic's title+slug. */
    topics: string[];
    prompt: string;
    code: string;
    language?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

/** What the browser is allowed to see — no answer, no explanation. */
export interface Phase0QuestionPublic {
    id: string;
    prompt: string;
    code: string;
    language: string;
    options: string[];
}

/** Max questions surfaced on a single topic, to avoid burying the lesson. */
const MAX_PER_TOPIC = 3;

const QUESTIONS: Phase0Question[] = [
    {
        id: 'closure-loop-var',
        topics: ['closure', 'loop', 'var', 'settimeout', 'scope'],
        prompt: 'What does this log?',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        options: ['0 1 2', '3 3 3', '0 0 0', 'undefined ×3'],
        correctIndex: 1,
        explanation:
            '`var` is function-scoped, so all three callbacks close over the *same* `i`. By the time the timers fire, the loop has finished and `i` is 3.',
    },
    {
        id: 'closure-loop-let',
        topics: ['closure', 'loop', 'let', 'block scope', 'settimeout'],
        prompt: 'And with `let` instead of `var`?',
        code: `for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        options: ['0 1 2', '3 3 3', '0 0 0', 'ReferenceError'],
        correctIndex: 0,
        explanation:
            '`let` is block-scoped and gets a fresh binding each iteration, so each callback captures its own `i`: 0, 1, 2.',
    },
    {
        id: 'hoisting-var-undefined',
        topics: ['hoist', 'var', 'scope'],
        prompt: 'What does this log?',
        code: `console.log(x);
var x = 5;`,
        options: ['5', 'ReferenceError', 'undefined', 'null'],
        correctIndex: 2,
        explanation:
            'The declaration `var x` is hoisted but the assignment is not. At the log line `x` exists but is still `undefined`.',
    },
    {
        id: 'hoisting-let-tdz',
        topics: ['hoist', 'let', 'const', 'temporal dead zone', 'scope'],
        prompt: 'What does this log?',
        code: `console.log(y);
let y = 5;`,
        options: ['undefined', '5', 'ReferenceError', 'null'],
        correctIndex: 2,
        explanation:
            '`let`/`const` are hoisted but sit in the "temporal dead zone" until declared. Accessing `y` before its declaration throws a ReferenceError.',
    },
    {
        id: 'this-method-extracted',
        topics: ['this', 'this keyword', 'binding', 'context'],
        prompt: 'What does this log?',
        code: `const user = {
  name: 'Ada',
  greet() { return 'Hi ' + this.name; },
};
const fn = user.greet;
console.log(fn());`,
        options: ["'Hi Ada'", "'Hi undefined'", 'ReferenceError', "'Hi '"],
        correctIndex: 1,
        explanation:
            '`this` is set by *how* a function is called, not where it is defined. Called as a bare `fn()`, `this` is not `user` (it is undefined/global), so `this.name` is `undefined`.',
    },
    {
        id: 'this-arrow-lexical',
        topics: ['this', 'arrow', 'arrow function', 'binding', 'context'],
        prompt: 'What does this log?',
        code: `const counter = {
  count: 10,
  show() {
    const inner = () => this.count;
    return inner();
  },
};
console.log(counter.show());`,
        options: ['undefined', '10', 'ReferenceError', 'NaN'],
        correctIndex: 1,
        explanation:
            'An arrow function has no `this` of its own — it uses the `this` of the enclosing `show()`, which was called as `counter.show()`. So `this.count` is 10.',
    },
    {
        id: 'coercion-array-plus',
        topics: ['coercion', 'type', 'operator', 'concatenation', 'plus'],
        prompt: 'What does this log?',
        code: `console.log([] + {});`,
        options: ["'[object Object]'", "'0'", 'NaN', "''"],
        correctIndex: 0,
        explanation:
            '`+` coerces both operands to strings: `[]` becomes `""` and `{}` becomes `"[object Object]"`. Concatenated, that is `"[object Object]"`.',
    },
    {
        id: 'number-float-precision',
        topics: ['number', 'float', 'precision', 'math', 'coercion'],
        prompt: 'What does this log?',
        code: `console.log(0.1 + 0.2 === 0.3);`,
        options: ['true', 'false', 'undefined', 'TypeError'],
        correctIndex: 1,
        explanation:
            'IEEE-754 floating point cannot represent 0.1 or 0.2 exactly, so `0.1 + 0.2` is `0.30000000000000004`, which is not strictly equal to `0.3`.',
    },
    {
        id: 'equality-null-undefined',
        topics: ['equality', 'coercion', 'null', 'undefined', 'operator'],
        prompt: 'What does this log?',
        code: `console.log(null == undefined, null === undefined);`,
        options: ['true true', 'true false', 'false false', 'false true'],
        correctIndex: 1,
        explanation:
            '`==` treats `null` and `undefined` as equal (a special rule), so the first is `true`. `===` checks type as well, and their types differ, so the second is `false`.',
    },
    {
        id: 'event-loop-order',
        topics: ['event loop', 'settimeout', 'promise', 'microtask', 'async'],
        prompt: 'In what order do these log?',
        code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
        options: ['A B C D', 'A D C B', 'A D B C', 'A C D B'],
        correctIndex: 1,
        explanation:
            'Synchronous code runs first (A, D). Then microtasks (Promise `.then` → C) drain before the next macrotask (setTimeout → B). Order: A D C B.',
    },
    {
        id: 'promise-then-return',
        topics: ['promise', 'then', 'chaining', 'async'],
        prompt: 'What does this log?',
        code: `Promise.resolve(1)
  .then((v) => v + 1)
  .then((v) => { console.log(v); });`,
        options: ['1', '2', '3', 'undefined'],
        correctIndex: 1,
        explanation:
            'Each `.then` passes its return value to the next. `1` → `1 + 1` = `2` → logged in the second `.then`.',
    },
    {
        id: 'async-await-order',
        topics: ['async', 'await', 'event loop', 'promise'],
        prompt: 'In what order do these log?',
        code: `async function run() {
  console.log(1);
  await null;
  console.log(2);
}
run();
console.log(3);`,
        options: ['1 2 3', '1 3 2', '3 1 2', '1 2 then 3'],
        correctIndex: 1,
        explanation:
            'Everything up to the first `await` runs synchronously (1). `await` suspends `run`, control returns to the caller (3), and the continuation after `await` runs as a microtask (2). Order: 1 3 2.',
    },
    {
        id: 'array-foreach-return',
        topics: ['array', 'foreach', 'map', 'method', 'iteration'],
        prompt: 'What does this log?',
        code: `const result = [1, 2, 3].forEach((n) => n * 2);
console.log(result);`,
        options: ['[2, 4, 6]', '[1, 2, 3]', 'undefined', '6'],
        correctIndex: 2,
        explanation:
            '`forEach` always returns `undefined` — it is for side effects, not transformation. Use `map` if you want `[2, 4, 6]`.',
    },
    {
        id: 'reference-array-copy',
        topics: ['reference', 'spread', 'array', 'mutation', 'copy'],
        prompt: 'What does this log?',
        code: `const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a.length);`,
        options: ['3', '4', 'undefined', 'TypeError'],
        correctIndex: 1,
        explanation:
            '`b = a` copies the *reference*, not the array. `a` and `b` point at the same array, so pushing through `b` makes `a.length` 4. (`const b = [...a]` would have copied it.)',
    },
    {
        id: 'destructuring-default',
        topics: ['destructur', 'default', 'object', 'parameter'],
        prompt: 'What does this log?',
        code: `const { a = 1, b = 2 } = { a: undefined, b: null };
console.log(a, b);`,
        options: ['1 2', 'undefined null', '1 null', 'undefined 2'],
        correctIndex: 2,
        explanation:
            'A destructuring default applies only when the value is `undefined`. `a` is `undefined` → default `1`. `b` is `null` (not `undefined`) → stays `null`.',
    },
];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

/** Look up a full question (with its answer) for server-side grading. */
export function getQuestionById(id: string): Phase0Question | undefined {
    return byId.get(id);
}

/** Strip the answer key so a question can be sent to the browser safely. */
export function toPublic(q: Phase0Question): Phase0QuestionPublic {
    return {
        id: q.id,
        prompt: q.prompt,
        code: q.code,
        language: q.language ?? 'javascript',
        options: q.options,
    };
}

/**
 * Match questions to a topic by keyword. `title`, `slug` and the lesson
 * `content` are combined into a haystack (hyphens normalised to spaces) and a
 * question matches if ANY of its keywords appears as a substring. Content is
 * included because real topics are often broadly titled ("Tricky JavaScript
 * questions") while the body is what actually covers closures, hoisting, etc.
 * Capped at MAX_PER_TOPIC so a big topic doesn't get buried in quizzes.
 */
/**
 * Match starter questions to a topic by its TITLE and SLUG only.
 *
 * ⚠ Do not reintroduce lesson `content` into the haystack. It used to be there —
 * contradicting this function's own documentation — and it is what turned 8
 * questions into 186 near-duplicate rows across 62 topics: every JS lesson
 * mentions "let" or "closure" somewhere in ~13k characters, so nearly every
 * question matched nearly every topic. A learner reading three topics in a row
 * got the same TDZ question three times.
 *
 * A title is a claim about what a topic IS. A passing mention in the body is not.
 */
export function getQuestionsForTopic(title: string, slug: string): Phase0Question[] {
    const haystack = `${title} ${slug}`.toLowerCase().replace(/-/g, ' ');
    const matched = QUESTIONS.filter((q) =>
        q.topics.some((kw) => haystack.includes(kw.toLowerCase()))
    );
    return matched.slice(0, MAX_PER_TOPIC);
}
