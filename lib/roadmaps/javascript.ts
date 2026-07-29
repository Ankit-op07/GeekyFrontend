// lib/roadmaps/javascript.ts
//
// JavaScript interview roadmap. Slugs in `topics` are real Topics in
// `javascript-interview-kit`.
//
// Note on ordering: the kit's first chapter is the four big question banks
// (they are the free preview). Those are *practice*, not a starting point, so
// this roadmap puts them at the end of each relevant stage rather than first.

import type { Roadmap } from './types';

export const javascriptRoadmap: Roadmap = {
    id: 'javascript',
    kitSlug: 'javascript-interview-kit',
    title: 'JavaScript Interview Roadmap',
    tagline: 'The language questions that decide every frontend interview.',
    audience: 'Anyone interviewing for a JS-heavy role — frontend, Node, or full-stack.',
    weeks: 6,
    accent: { from: 'from-amber-400', to: 'to-yellow-600' },
    stages: [
        {
            id: 'foundations',
            title: 'Foundations',
            goal: 'Predict what any snippet prints before you run it.',
            nodes: [
                {
                    id: 'types-coercion',
                    title: 'Types & coercion',
                    summary:
                        'Primitives vs objects, `==` vs `===`, truthiness, NaN, and the coercion table interviewers love to trap people with.',
                    tier: 'beginner',
                    est: '4h',
                    topics: ['data-types-and-coercion'],
                    external: [
                        {
                            title: 'Equality comparisons and sameness — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness',
                        },
                        {
                            title: 'Type coercion — MDN glossary',
                            url: 'https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion',
                        },
                    ],
                    interview: [
                        'Why is `typeof null === "object"`?',
                        'Explain `[] == false` and `[] == ![]`.',
                        'Why is `NaN !== NaN`, and how do you test for it correctly?',
                    ],
                },
                {
                    id: 'scope-hoisting',
                    title: 'Scope, hoisting & the TDZ',
                    summary:
                        'var vs let vs const is not a style question — it is a question about when a binding is created versus initialised.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['scope-hoisting-and-tdz'],
                    external: [
                        {
                            title: 'Hoisting — MDN glossary',
                            url: 'https://developer.mozilla.org/en-US/docs/Glossary/Hoisting',
                        },
                    ],
                    interview: [
                        'Are `let` declarations hoisted? Careful — the honest answer is yes, with a caveat.',
                        'What does the classic `for (var i...)` + setTimeout loop print, and what are two fixes?',
                    ],
                },
                {
                    id: 'execution-context',
                    title: 'Execution context & the call stack',
                    summary:
                        'The mental model everything else hangs off: how a function call creates a context, and what a stack trace is actually showing you.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['execution-context-and-call-stack'],
                    interview: [
                        'What are the two phases of execution context creation?',
                        'What causes "Maximum call stack size exceeded" and how does tail position relate?',
                    ],
                },
                {
                    id: 'operators-strict',
                    title: 'Strict mode & the sharp edges',
                    summary:
                        'Implicit globals, silent failures and octal literals. Short, and it quietly explains several "why does this behave differently in a module" questions.',
                    tier: 'beginner',
                    kind: 'optional',
                    est: '1h',
                    external: [
                        {
                            title: 'Strict mode — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode',
                        },
                    ],
                    interview: ['Name three things strict mode changes. Are ES modules strict by default?'],
                },
            ],
        },
        {
            id: 'functions',
            title: 'Functions, Closures & this',
            goal: 'Explain any `this` value and write a closure on purpose, not by accident.',
            nodes: [
                {
                    id: 'closures',
                    title: 'Closures in depth',
                    summary:
                        'The most-asked JavaScript concept, full stop. Not just "a function remembering its scope" — know the memory implications and the practical patterns.',
                    tier: 'beginner',
                    est: '5h',
                    topics: ['closures-in-depth'],
                    external: [
                        {
                            title: 'Closures — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures',
                        },
                    ],
                    interview: [
                        'Write a `once(fn)` that runs fn at most once and returns the first result forever after.',
                        'Implement a counter with a truly private count.',
                        'Do closures leak memory? When?',
                    ],
                    build: 'Implement `once`, `memoize` and a private counter from scratch — no libraries, no hints.',
                },
                {
                    id: 'this',
                    title: 'The `this` keyword',
                    summary:
                        'Five binding rules and one exception (arrow functions). Once you can rank them, every trick question about `this` collapses to a lookup.',
                    tier: 'beginner',
                    est: '3h',
                    topics: ['the-this-keyword'],
                    external: [
                        {
                            title: 'this — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this',
                        },
                    ],
                    interview: [
                        'What is `this` inside a method extracted into a variable and called bare?',
                        'Why can you not `bind` an arrow function?',
                    ],
                },
                {
                    id: 'call-apply-bind',
                    title: 'call, apply, bind & currying',
                    summary:
                        'Explicit binding, plus the currying questions ("make `sum(1)(2)(3)` work") that show up in almost every machine round.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['call-apply-bind-and-currying'],
                    interview: [
                        'Implement `Function.prototype.myBind` including support for `new`.',
                        'Write an infinite curry: `add(1)(2)(3)...` that resolves when coerced to a number.',
                    ],
                    build: 'Hand-write `myCall`, `myApply` and `myBind`. The `new` case in bind is the part interviewers check.',
                },
                {
                    id: 'hof',
                    title: 'Higher-order functions & functional patterns',
                    summary:
                        'map/filter/reduce fluency, composition, pipe, and pure functions — the vocabulary of every "refactor this" question.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['higher-order-functions-and-functional-patterns'],
                    interview: [
                        'Implement `reduce` from scratch, then implement `map` using it.',
                        'What makes a function pure, and why does it matter for testing?',
                    ],
                },
            ],
        },
        {
            id: 'objects',
            title: 'Objects, Prototypes & Classes',
            goal: 'Explain inheritance in JavaScript without saying the word "class" once.',
            nodes: [
                {
                    id: 'objects-descriptors',
                    title: 'Objects & property descriptors',
                    summary:
                        'writable, enumerable, configurable, getters and setters. The layer under `Object.freeze` and every "make this read-only" question.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['objects-and-property-descriptors'],
                    external: [
                        {
                            title: 'Object.defineProperty — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty',
                        },
                    ],
                    interview: [
                        'Is `Object.freeze` deep? Implement a deep freeze.',
                        'How do you make a property non-enumerable, and where does that show up?',
                    ],
                },
                {
                    id: 'prototypes',
                    title: 'The prototype chain',
                    summary:
                        'How lookup actually works, `__proto__` vs `prototype`, and why `Object.create(null)` is a real technique and not trivia.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['prototype-chain-and-inheritance'],
                    external: [
                        {
                            title: 'Inheritance and the prototype chain — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain',
                        },
                    ],
                    interview: [
                        'What is the difference between `__proto__` and `prototype`?',
                        'Implement `new` as a function.',
                        'How does `instanceof` work under the hood?',
                    ],
                    build: 'Write `myNew(Constructor, ...args)` and `myInstanceof(obj, Ctor)`. Both are ten-liners that prove you understand the chain.',
                },
                {
                    id: 'classes',
                    title: 'ES6 classes',
                    summary:
                        'Syntactic sugar over prototypes — mostly. `super`, static members, private `#fields` and the ways classes are genuinely not just sugar.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['es6-classes'],
                    interview: [
                        'Name a way ES6 classes are NOT just syntactic sugar.',
                        'What does `super()` do, and why must it come before `this` in a derived constructor?',
                    ],
                },
                {
                    id: 'deep-clone',
                    title: 'Equality, cloning & structuredClone',
                    summary:
                        'Deep clone is the single most common "implement this" warm-up. Know the recursive version, its cycle problem, and that the platform now ships one.',
                    tier: 'intermediate',
                    est: '2h',
                    external: [
                        {
                            title: 'structuredClone() — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone',
                        },
                    ],
                    interview: [
                        'Implement deepClone handling arrays, Dates, Maps and circular references.',
                        'Why is `JSON.parse(JSON.stringify(x))` a bad deep clone? Name three things it destroys.',
                    ],
                    build: 'Write deepClone with a WeakMap to survive circular references.',
                },
            ],
        },
        {
            id: 'async',
            title: 'Asynchronous JavaScript',
            goal: 'Order the output of any mixed setTimeout / Promise / await snippet.',
            nodes: [
                {
                    id: 'event-loop',
                    title: 'The event loop',
                    summary:
                        'Call stack, task queue, microtask queue. This is the question that separates candidates who memorised syntax from candidates who understand the runtime.',
                    tier: 'intermediate',
                    est: '4h',
                    topics: ['the-event-loop'],
                    external: [
                        {
                            title: 'The event loop — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model',
                        },
                        {
                            title: 'Jake Archibald — In The Loop',
                            url: 'https://www.youtube.com/watch?v=cCOL7MC4Pl0',
                            source: 'YouTube',
                        },
                    ],
                    interview: [
                        'Order the output: a `console.log`, a `setTimeout(…, 0)`, a resolved `.then`, and an `await`.',
                        'Why does a microtask always beat a macrotask, and how can microtasks starve the UI?',
                    ],
                },
                {
                    id: 'callbacks-iterators',
                    title: 'Callbacks, generators & iterators',
                    summary:
                        'The pre-Promise world plus the protocol that powers `for...of`, spread and async iteration. Generators are how you explain what `await` really is.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['callbacks-generators-and-iterators'],
                    external: [
                        {
                            title: 'Iterators and generators — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators',
                        },
                    ],
                    interview: [
                        'Make a plain object iterable with `for...of`.',
                        'What is callback hell, and what is the actual problem with it beyond indentation?',
                    ],
                },
                {
                    id: 'promises',
                    title: 'Promises deep dive',
                    summary:
                        'States, chaining, error propagation, and the four combinators. Then implement one — writing a Promise from scratch is a standard senior round.',
                    tier: 'intermediate',
                    est: '5h',
                    topics: ['promises-deep-dive'],
                    external: [
                        {
                            title: 'Using promises — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises',
                        },
                    ],
                    interview: [
                        'Difference between all, allSettled, race and any — give a real use case for each.',
                        'Implement `Promise.all` yourself.',
                        'What happens to a rejection with no catch handler?',
                    ],
                    build: 'Implement a `MyPromise` with then/catch/finally and correct microtask timing.',
                },
                {
                    id: 'async-await',
                    title: 'async / await',
                    summary:
                        'Sugar over promises with two traps: sequential awaits in a loop when you wanted parallelism, and error handling that silently swallows.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['async-await'],
                    interview: [
                        'Rewrite an awaited loop to run in parallel. When would you deliberately keep it sequential?',
                        'Does `return await x` differ from `return x` inside a try block?',
                    ],
                },
                {
                    id: 'async-utilities',
                    title: 'Practical async: retry, timeout, concurrency limit',
                    summary:
                        'The three utilities interviewers ask you to build once they know you understand promises.',
                    tier: 'advanced',
                    kind: 'practice',
                    est: '4h',
                    interview: [
                        'Implement `retry(fn, times)` with exponential backoff.',
                        'Implement `promiseWithTimeout(p, ms)`.',
                        'Run 100 tasks with at most 5 in flight at any time.',
                    ],
                    build: 'Write all three. The concurrency limiter is the one that trips people up — get it working with a pool, not a chunked batch.',
                },
            ],
        },
        {
            id: 'modern',
            title: 'Modern JavaScript & the Runtime',
            goal: 'Use the ES6+ surface confidently and reason about memory.',
            nodes: [
                {
                    id: 'destructuring',
                    title: 'Destructuring, spread & rest',
                    summary:
                        'Everyday syntax with interview-grade edges: default values, nested patterns, and the difference between rest and spread.',
                    tier: 'beginner',
                    est: '2h',
                    topics: ['destructuring-spread-and-rest'],
                    interview: [
                        'Swap two variables without a temp.',
                        'Does spread deep-copy a nested object?',
                    ],
                },
                {
                    id: 'collections',
                    title: 'Map, Set, WeakMap & WeakSet',
                    summary:
                        'When a Map beats an object, and the one thing WeakMap is genuinely for: attaching data to objects without preventing garbage collection.',
                    tier: 'intermediate',
                    est: '2h',
                    topics: ['map-set-weakmap-weakset'],
                    external: [
                        {
                            title: 'WeakMap — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap',
                        },
                    ],
                    interview: [
                        'When would you choose a Map over a plain object?',
                        'Why is WeakMap not iterable?',
                    ],
                },
                {
                    id: 'modules',
                    title: 'Modules: ESM vs CommonJS',
                    summary:
                        'Static vs dynamic, live bindings vs copies, and why tree shaking only works for one of them.',
                    tier: 'intermediate',
                    est: '3h',
                    topics: ['modules-esm-vs-commonjs'],
                    external: [
                        {
                            title: 'JavaScript modules — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules',
                        },
                    ],
                    interview: [
                        'Why can ESM be tree-shaken but CommonJS generally cannot?',
                        'What is a circular import and how do the two systems differ in handling one?',
                    ],
                },
                {
                    id: 'symbols-proxy',
                    title: 'Symbols, iterators & Proxy',
                    summary:
                        'The metaprogramming layer. Proxy is how Vue reactivity and Immer work, which makes it a great "how does X work" answer.',
                    tier: 'advanced',
                    kind: 'optional',
                    est: '3h',
                    topics: ['symbols-iterators-and-proxy'],
                    external: [
                        {
                            title: 'Proxy — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy',
                        },
                    ],
                    interview: [
                        'Build an object that logs every property read.',
                        'What is `Symbol.iterator` for?',
                    ],
                },
                {
                    id: 'memory',
                    title: 'Memory management & garbage collection',
                    summary:
                        'Mark-and-sweep, what actually constitutes a leak in JS, and the four classic leak sources: globals, timers, detached DOM nodes and forgotten listeners.',
                    tier: 'advanced',
                    est: '3h',
                    topics: ['memory-management-and-garbage-collection'],
                    interview: [
                        'Name four ways a single-page app leaks memory.',
                        'How would you confirm a leak rather than guess at one?',
                    ],
                },
            ],
        },
        {
            id: 'practice',
            title: 'Practice & Question Banks',
            goal: 'Convert understanding into speed under interview pressure.',
            nodes: [
                {
                    id: 'polyfills',
                    title: 'Polyfills',
                    summary:
                        'Rebuild the standard library: map, filter, reduce, bind, Promise.all, debounce, throttle, flat, deepClone. The single highest-yield practice set for JS rounds.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '8h',
                    topics: ['polyfill-coding-questions'],
                    interview: [
                        'Implement `Array.prototype.myFlat(depth)`.',
                        'Implement `Array.prototype.myReduce` with the initial-value edge cases.',
                    ],
                    build: 'Do ten polyfills from a blank file on a timer. Then do the same ten again a week later.',
                },
                {
                    id: 'tricky',
                    title: 'Tricky output questions',
                    summary:
                        'The "what does this print" genre. Every one of them is really a hoisting, coercion, `this`, or event-loop question in costume.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '5h',
                    topics: ['tricky-javascript-questions'],
                    build: 'For each one you get wrong, write down WHICH concept it was testing. The pattern in your mistakes is your study plan.',
                },
                {
                    id: 'patterns-solid',
                    title: 'Design patterns & SOLID in JS',
                    summary:
                        'Module, singleton, observer, factory — plus the SOLID vocabulary senior interviewers use to talk about your code.',
                    tier: 'advanced',
                    est: '4h',
                    topics: ['js-and-react-patterns-and-solid-principles'],
                    interview: [
                        'Implement an event emitter (on/off/emit/once) — the observer pattern, and a very common ask.',
                        'Give a JS example of the open/closed principle.',
                    ],
                    build: 'Build an EventEmitter with once() and off() that correctly handles a listener removing itself during emit.',
                },
                {
                    id: 'question-bank',
                    title: 'Full interview question bank',
                    summary:
                        'A last pass over the breadth of the subject. Use it to find gaps, not to learn from cold.',
                    tier: 'intermediate',
                    kind: 'practice',
                    est: '6h',
                    topics: ['javascript-interview-preparation-questions'],
                    build: 'Answer out loud, on a timer, as if someone were listening. Reading the answer and nodding is not practice.',
                },
                {
                    id: 'browser-apis',
                    title: 'The browser JavaScript touches',
                    summary:
                        'DOM events, bubbling and delegation, storage, and fetch. A JS interview for a frontend role always drifts here.',
                    tier: 'intermediate',
                    est: '3h',
                    crossKit: [
                        {
                            kitSlug: 'complete-frontend-kit',
                            topics: ['browser-internals', 'realtime-and-browser-apis'],
                        },
                    ],
                    external: [
                        {
                            title: 'Event bubbling — MDN',
                            url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling',
                        },
                    ],
                    interview: [
                        'Explain event delegation and implement it for a dynamic list.',
                        'localStorage vs sessionStorage vs cookies — when do you pick each?',
                    ],
                },
            ],
        },
    ],
};
