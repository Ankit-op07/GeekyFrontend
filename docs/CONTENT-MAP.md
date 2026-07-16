# Content Map — what Geeky Frontend actually teaches

| | |
|---|---|
| **Purpose** | Answer "what content do we have?" without reading 1.7M characters of it |
| **Covers** | All 4 kits · 39 chapters · 146 topics, as of 2026-07-15 |
| **Built from** | The `topics` collection in MongoDB, plus a per-lesson summary written by an agent that read each lesson in full |
| **Rebuild** | See [§9](#9-how-to-rebuild-this-document) — it is generated, not hand-written |

---

## 1. Read this instead of the content

The lessons total **1.7M characters (~425k tokens)**. Reading them to answer "is there a topic about
closures?" or "would a code exercise fit the React kit?" costs more context than the whole rest of a
session. This document is ~11k tokens and answers most of those questions.

**When this is enough:** what exists, where, roughly how big, what a lesson covers, which topics are
code-heavy vs prose, what has a quiz.

**When to go to the source:** exact wording, code samples, anything you will copy or quote. Then read
that ONE topic — don't sweep. Query by slug (§9), don't grep the whole DB.

**Trust boundary — read this before relying on §8.** The per-topic summaries were written by agents
that each read one lesson. They are accurate about *shape* (what a lesson is about, whether it has
runnable code) because that was the job those agents were doing. They are not a substitute for the
lesson and they were not independently checked. The **numbers** in §3-§5 come straight from the
database and are exact.

---

## 2. Where content lives

```
Kit  (kits)          — the SKU.  slug is the access key: NEVER rename it (lib/appConstants.ts)
 └── Chapter  (chapters)   — ordered by `order`. The FIRST chapter is the free preview (PRD-002)
      └── Topic  (topics)  — `content` is a markdown string. THIS is the lesson.
```

Everything a learner reads is `Topic.content` — one markdown blob per topic, rendered by
`app/learn/[kitSlug]/[topicSlug]/page.tsx`. There is no CMS, no MDX, no per-section table. A "topic"
can be a 500-word explainer or a 52k-character question bank; the schema does not distinguish them
and neither does the reader.

**Access:** purchased → any topic; no purchase → **first chapter only**. That rule lives in exactly
one place, `resolveTopicAccess()` in `lib/learn-access.ts`. Any new surface over topic content must
call it (see `CLAUDE.md`).

---

## 3. Inventory

| Kit (slug) | Topics | Chapters | Total content | Median topic | Live quiz Qs |
|---|---:|---:|---:|---:|---:|
| `complete-frontend-kit` | 74 | 25 | 991k chars | ~11k | 129 |
| `react-interview-kit` | 62 | 10 | 575k chars | ~8k | 156 |
| `nodejs-backend-kit` | 6 | 3 | 5k chars | ~800 | 18 |
| `javascript-interview-kit` | 4 | 1 | 128k chars | ~30k | 12 |
| **Total** | **146** | **39** | **1.70M chars** | **10.2k** | **319** |

Size spread: **min 0 chars · median 10.2k · max 52k**. The distribution is bimodal — most topics are
8-15k explainers; a handful are 30-52k question banks (`javascript-interview-kit` especially).

`complete-frontend-kit` is over half the catalogue by topic count and by volume. Note the slug is
`complete` in `PLAN_TO_SLUGS` — the kit was renamed to "Frontend System Design Kit" but the slug and
the legacy plan name are load-bearing access keys and must never change.

---

## 4. What each kit actually is

**`javascript-interview-kit` (4 topics, 128k chars)** — Not lessons; **question banks**. Four enormous
documents: 30 output puzzles, polyfill implementations (curry, flat, throttle/debounce, compose,
memoize, Promise combinators), design patterns + SOLID, and a broad core-JS sweep. The densest and
most code-heavy content you have. This is the only kit where "predict the output" is native.

**`react-interview-kit` (62 topics, 575k chars)** — A real curriculum, ordered: core concepts → hooks
→ routing → state management (Redux/Context) → performance → patterns (HOC, render props, compound)
→ testing → scenario/behavioural interview prep → 15 "build X" machine-coding walkthroughs. Almost
entirely prose + JSX. Concept-heavy.

**`nodejs-backend-kit` (6 topics, 5k chars)** — **The thin one.** Six topics averaging ~800 chars:
EventEmitter, streams/buffers, middleware, REST design, Mongoose, JWT. These are stubs compared to
everything else — roughly 0.3% of your content volume for a whole kit. If a kit needs investment,
it's this one.

**`complete-frontend-kit` (74 topics, 991k chars)** — The catch-all, and the least coherent. It spans
HTML semantics/ARIA/accessibility, TypeScript, networking/protocols, browser internals, security
(attacks, auth, headers), rendering strategies (SSR/CSR/ISR), design patterns, system-design case
studies (ecommerce, SaaS, realtime), React hooks *again* (overlapping the React kit), Next.js
App Router, AI integration, a **full DSA track** (arrays → graphs → DP → bit manipulation), JS
problem sets by level (SDE1/2/3), testing, and machine-coding component design. It's four or five
kits wearing a trenchcoat.

---

## 5. The finding that shapes every practice feature

**Only ~6% of your catalogue is runnable, verifiable JavaScript.**

Of 435 questions authored across all 146 topics, agents could write a deterministic, executable
snippet for just **23**. The other **355 were concept questions** — prose, because there was nothing
to run.

| Kit | Native to "predict the output"? |
|---|---|
| `javascript-interview-kit` | ✅ Yes — plain JS throughout |
| `complete-frontend-kit` | ⚠️ Partly — the DSA + JS-problems chapters only |
| `react-interview-kit` | ❌ No — JSX/hooks need React; a bare `vm` cannot run it |
| `nodejs-backend-kit` | ❌ No — every example needs `require('events')`, `fs`, Express |

Why it matters, repeatedly:
- The original keyword-matched quiz reached 8% of topics. That was **not** a matching bug — it's the
  content. No amount of authoring would have fixed it.
- PRD-005's whole engine premise ("learners can't write code") assumes exercises fit the catalogue.
  For 94% of topics, a *code* exercise doesn't. The React kit's "build a todo app" topics are
  machine-coding, which PRD-005 correctly files under Phase 3 (Sandpack), not the Phase-1 worker.
- Anything graded by execution covers a thin slice. Anything covering the catalogue can't be graded
  by execution. That tension is structural, not a tooling gap.

---

## 6. Known content problems

1. ~~`complete-frontend-kit/advanced-testing` is empty~~ — **fixed 2026-07-16.** Written as
   "21B. Advanced Testing" (Q 21.5-21.8: E2E/Playwright, visual regression, automated a11y, flaky
   tests), filling the numbering gap between 21A (Q21.1-21.4) and 21C (Q21.9-21.12) and paying off
   two references 21A made but never explained (visual regression, a11y testing).
2. **`nodejs-backend-kit` is a stub** — 6 topics × ~800 chars for a kit that is sold. Highest-leverage
   content gap.
3. **37 topics exceed 16k characters**, and question authoring only read the first 16k of each
   (26 in `complete-frontend-kit`, 8 in React, 3 in JS). Five agents explicitly reported hitting a
   lesson cut mid-section. **Consequence:** for those 37 topics the quiz only covers the opening
   material — the tail is untested. Biggest: `javascript-interview-preparation-questions` (52k),
   `polyfill-coding-questions` (35k), `components-props-composition` (33k).
4. **React content is duplicated** — `complete-frontend-kit` has `core-hooks`, `specialized-hooks`,
   `react-19-hooks`, `custom-hooks-and-rules` that overlap `react-interview-kit`'s hook chapter. A
   buyer of both sees the material twice; a change to one won't propagate.
5. **Two topic slugs collide in spirit** — React has `code-splitting-lazy-loading-routes` and
   `code-splitting-lazy-loading` (different chapters, near-identical names). Easy to grab the wrong one.
6. **Chapter titles have stray whitespace** (e.g. `" React Core Concepts"` with a leading space) —
   harmless in the reader, annoying when matching by title.
7. ~~9 `[IMAGE_PLACEHOLDER]` blocks were rendering their own briefs to learners~~ — **fixed
   2026-07-16.** Eight React topics contained `[IMAGE_PLACEHOLDER: X]` followed by a "Visual
   description for image creation:" spec, all of it visible on the page. Diagrams were drawn to each
   spec, uploaded to Cloudinary, and the marker + spec paragraphs replaced with `<img
   class="editor-image">`. **If you author this way again, grep for `IMAGE_PLACEHOLDER` before
   shipping** — nothing in the pipeline catches it, and it reads as a draft left in production.

8. **`complete-frontend-kit/dynamic-programming` contains itself twice** — found 2026-07-16, **not
   yet fixed.** The lesson body (title, "Pattern recognition", "DP approach", and all 25 problems)
   repeats from ~offset 5558: the topic has **50 `<h2>` headings for 25 problems**. A learner reads
   the whole thing, then reads it again. Verified as a genuine duplicate, not two similar sections.
   Fixing means deleting ~5.5k of the topic, so it awaits a decision. To detect this class of bug:
   compare `<h2>` count against the problem count the title claims.

### AI content targets Anthropic/Claude — keep it current, don't revert

The `complete-frontend-kit` **AI Integration** chapter (4 topics: `ai-integration`, `ai-cost-tokens-models`,
`ai-tool-use-agents`, `ai-reasoning-ui`) teaches the **Anthropic/Claude** API — that is the provider the
lessons use, and there is no other LLM provider anywhere in the repo. It was brought to current API level
on 2026-07-16: model IDs are `claude-opus-4-8` / `claude-sonnet-5` / `claude-haiku-4-5`; structured output
uses `output_config.format` (not prompt-begging for JSON); thinking uses `thinking: {type: "adaptive"}`
(**not** the deprecated `budget_tokens`); reasoning display defaults to empty and must opt in with
`display: "summarized"`. **Before editing any AI lesson, load the `claude-api` skill** — model IDs and API
shapes in this space go stale fast, and a plausible-looking "fix" from training memory (e.g. reverting to
`claude-sonnet-4-…`, or teaching `budget_tokens`) reintroduces exactly the defects that were removed. The
prior version taught a retired model ID and an OpenAI-shaped stream parser; don't regress it.

### Images: how they work here

- Convention is `<img class="editor-image" src="https://res.cloudinary.com/litho/…">`, uploaded to
  the `geeky-frontend/learn-content` folder. ~82 images across the corpus (incl. 5 animated WebP).
- **Do not use inline `<svg>`.** The topic editor is TipTap (ProseMirror), whose schema has no SVG
  node — it renders fine, then gets silently stripped the first time someone opens that topic in
  `/admin/content` and saves. `<img>` and `<em>` are registered and safe.
- Images are baked PNGs, so they do **not** respond to the reader's light/dark toggle. Give diagrams
  a light card background rather than transparency, or they vanish in one theme.

### Animated diagrams (WebP)

- Five concepts that are *processes over time* use **animated WebP** instead of a static PNG, embedded
  with the exact same `<img class="editor-image">` convention (Chrome autoplays animated WebP natively;
  it survives TipTap because it is still an `<img>`). A `<video>` or animated inline-SVG would be
  stripped on the next admin save — same trap as SVG.
- Built by `scratchpad/build-anims.js`: hand-authored SVG **frames** → `sharp(pngFrames, {join:{across:1,
  animated:true}}).webp({loop:3, delay:[...]})`. Design rule: every frame carries the full title/context,
  only the moving element changes, and the **last frame is the complete/answer state** with a long hold
  (`lastHold` ~2600ms) so when the finite loop stops it rests on a readable diagram — this is the a11y
  mitigation (no infinite motion; a plain `<img>` can't honour `prefers-reduced-motion`). Escape raw
  `<`/`>`/`&` in frame text or the SVG XML parse fails.
- Payload is small (61–92 KB each — WebP compresses flat vector scenes well), so the mobile cost is
  negligible. Still baked frames → **no dark-mode adaptation** (light card, same as the PNGs).
- The five (all in `scratchpad/anim-urls.json`): `sliding-window`, `two-pointer` (swapped the static),
  `debouncing-throttling` (react kit, swapped), `ai-tool-use-agents` (swapped the tool-use diagram),
  and `react-19-hooks` (optimistic-update rollback, **inserted** before the `useOptimistic` heading).
  The "done properly" alternative — a theme-aware, pausable reader `<AnimatedDiagram>` component — was
  scoped but not built; these baked WebPs are the DB-only path.

### Algorithms chapter — the big content fill (fixed)

- The **Algorithms** chapter (ch. 22, 14 topics) shipped with **120 of 214 problems "bare"** — a
  heading + a one-line hint after an em-dash, but **no code** ("23.96 Same Tree — recursive compare
  left and right."). Learners could not learn from a hint. This was the chapter's main breakage.
- **`dynamic-programming` had a full 2× self-duplication** (problems 23.56–23.80 listed twice, the
  whole block repeated after an `<hr>`). Fixed by keeping `content.slice(0, 6029)` (intro + first
  block) → 25 unique problems. This is the DP duplication that CLAUDE.md/earlier notes flagged.
- **Fix:** authored a correct, **execution-tested** JS solution for all 103 remaining bare problems
  (one agent per topic; each wrote solutions, ran them through `node` with assertions, kept only what
  passed), then restructured every problem to `<h2>ID Title</h2><p><strong>Approach:</strong> …</p>
  <pre class="code-block hljs"><code class="language-javascript">…</code></pre>`. All 103 also passed an
  independent `node --check` gate before insert. Result: **0 bare problems**, every problem has code.
  Pipeline: `scratchpad/algo-solutions/<topic>.json` (raw JS) → `insert-solutions.js` (HTML-escapes +
  wraps + replaces the bare heading, matching by numeric id or title).
- **4 concept diagrams** added at the top of the most diagram-native topics: `trees`
  (four traversal orders with numbered visit badges), `graphs` (BFS-queue vs DFS-stack, visit order),
  `dynamic-programming` (Unique Paths table fill + the DP recipe), `recursion-backtracking` (subsets
  decision tree — choose/recurse/un-choose). Static PNGs, same `<img class="editor-image">` convention.

---

## 7. The quiz feature (PRD-005 Phase 0) — what shipped and why

A self-check renders at the foot of every topic that has live questions. **No code runs in the
browser** — Phase 0 exists only to measure whether learners want to practise (the ≥30% gate). Full
architecture notes live in `CLAUDE.md`; this section is the *content* view.

**Where the 319 live questions came from:** each topic's real lesson was read, 3 questions were
authored from it, and every question had to be corroborated by something independent of its author
before it could go live:

| Type | Count live | How it earned `live` | `verifiedBy` |
|---|---:|---|---|
| `predict-output` | 49 | Snippet **executed** in a `vm`; real output had to equal the marked answer | `vm` — proof |
| `concept` | 270 | A second agent answered it **blind** from the lesson and picked the same option | `peer` — corroboration |

`verifiedBy` distinguishes these deliberately: executing a snippet proves the key; two models
agreeing does not. **116 more sit as `draft`** — they never got a blind solve (the run hit a session
limit), not a quality judgement.

**Three things worth not rediscovering the hard way:**

1. **The vm gate had two realm bugs** that made it blind to every error and prototype question.
   `e instanceof Error` is false across a `vm` boundary, and injecting host intrinsics shadows the
   sandbox's own. `npm run test:quiz` pins both. Details in `CLAUDE.md`.
2. **The old seed wallpapered the site.** It keyword-matched against full lesson *body text*, so 8
   questions fanned out into 186 live rows across 62 topics (one TDZ question appeared on 48 topics).
   Matching now uses title+slug only. Those 186 rows are `status:'archived'`, not deleted.
3. **The first authoring pass put the correct answer at position A 93% of the time.** That both
   broke the quiz (pick A, score 93%) and invalidated the blind-solver check (author bias and solver
   bias agree for the wrong reason). Options are now shuffled, and
   `scripts/quiz-insert-authored.ts` **refuses to import** any set where one position holds >40% of
   answers.

**Content-side follow-ups:** the 116 drafts need corroborating; the 37 truncated topics only have
questions for their first 16k; `advanced-testing` has no quiz because it has no content.

---

## 8. Topic index

Every topic, grouped by kit and chapter. Format:

> **Title** `slug` · content size · live quiz questions
> _one-line summary of what the lesson covers_

Summaries are per the trust boundary in §1 — accurate about shape, not a substitute for the lesson.
"live Q" is a snapshot; query the DB for current counts.

<!-- BEGIN GENERATED TOPIC INDEX -->
### `javascript-interview-kit` — 4 topics, 1 chapters, 128k chars

**JS Interview Prep**

- **Tricky Javascript questions** `tricky-javascript-questions` · 16k chars · 3 live Q
  Lesson is 30 plain-JS output puzzles; authored 3 predict-output (freeze/seal, microtask vs macrotask, function-vs-var hoisting), all executed in a bare vm and confirmed byte-exact. No concept questions: lesson…
- **Polyfill coding questions** `polyfill-coding-questions` · 35k chars · 3 live Q
  Polyfill implementations (curry, flat, throttle/debounce, compose/pipe, memoize, Promise combinators, DOM helpers); questions cover compose-vs-pipe order (executed, verified 11\n16), debounce trailing-call beh…
- **JS and React Patterns and Solid Principles** `js-and-react-patterns-and-solid-principles` · 26k chars · 3 live Q
  JS design patterns (Singleton, Proxy, Observer vs PubSub, Factory); both predict-output snippets executed and verified in Node. Lesson file was truncated mid-way, so React/SOLID sections were not covered.
- **Javascript Interview Preparation questions** `javascript-interview-preparation-questions` · 52k chars · 3 live Q
  Broad JS core interview lesson (closures, call/apply/bind, prototypes, events, hoisting, Symbol/iterators/generators, promises); wrote 1 verified predict-output on closure scope plus concept Qs on event delega…

### `react-interview-kit` — 62 topics, 10 chapters, 575k chars

**React Core Concepts**

- **What is React, Virtual DOM & Reconciliation** `virtual-dom` · 27k chars · 3 live Q
  React/JSX lesson (Virtual DOM, diffing, Fiber) — no runnable plain-JS snippets, so all three are concept questions covering VDOM nature, element-type diffing rule, and Fiber vs Stack Reconciler.
- **JSX — It's Not HTML** `jsx-it-s-not-html` · 31k chars · 3 live Q
  JSX vs HTML lesson (React kit); all concept — no runnable plain-JS surface, and lesson file is truncated mid-Part 6 so only Parts 1-5 were usable.
- **Components, Props & Composition** `components-props-composition` · 33k chars · 3 live Q
  React components/props/composition lesson — JSX-only content, so no runnable plain-JS snippet is verifiable; all three are concept questions (props read-only, child-to-parent callbacks, class-only Error Bounda…
- **state usestate deep dive** `state-usestate-deep-dive` · 25k chars · 3 live Q
  React useState lesson (JSX/hooks, not runnable plain JS) — 3 concept questions on initial-value-only-on-first-render, stale count with non-updater setState, and reference comparison on mutated object state.
- **Component Lifecycle & useEffect Mastery** `component-lifecycle-useeffect-mastery` · 27k chars · 3 live Q
  React useEffect lifecycle lesson (deps array, cleanup, useLayoutEffect); all concept since no runnable plain-JS snippet exists — citations verified verbatim.
- **Conditional Rendering & List Rendering** `conditional-rendering-list-rendering` · 29k chars · 3 live Q
  React conditional rendering patterns and list keys; one plain-JS predict-output on the && falsy-return trap (verified in node vm), plus concept questions on the index-as-key state bug and returning null.
- **Forms: Controlled vs Uncontrolled Components** `forms-controlled-vs-uncontrolled-components` · 11k chars · 3 live Q
  React controlled vs uncontrolled forms; all-JSX lesson so no verifiable plain-JS snippet, all concept. Citations verified as verbatim substrings.
- **Event Handling in React** `event-handling-in-react` · 13k chars · 3 live Q
  React event handling (synthetic events, delegation, preventDefault) — JSX-only lesson, no runnable plain-JS snippet possible, so all concept.
- **Refs & useRef: Beyond DOM Access** `refs-useref-beyond-dom-access` · 19k chars · 3 live Q
  React refs lesson (useRef vs useState, forwardRef, useImperativeHandle, createRef); all-concept since JSX/React cannot run in the bare vm sandbox.
- **Error Boundaries & Handling Errors Gracefully** `error-boundaries-handling-errors-gracefully` · 21k chars · 3 live Q
  React Error Boundaries lesson (JSX/class components, no runnable plain-JS snippets) — 3 concept questions on event-handler errors, getDerivedStateFromError vs componentDidCatch, and boundary placement.

**Advanced Hooks & Patterns**

- **useReducer: When useState Isn't Enough** `usereducer-when-usestate-isn-t-enough` · 12k chars · 3 live Q
  React useReducer lesson (JSX/hooks only, nothing runnable in bare Node vm), so all three are concept: dispatch flow, useState-vs-useReducer decision, missing default case.
- **useContext & the Context API** `usecontext-the-context-api` · 10k chars · 3 live Q
  React Context API lesson (JSX/React-only, no runnable plain JS) — 3 concept questions on prop drilling, inline Provider value object identity + useMemo, and the no-selectors re-render pitfall.
- **useMemo & useCallback: Performance Hooks** `usememo-usecallback-performance-hooks` · 11k chars · 3 live Q
  useMemo vs useCallback, React.memo pairing, and shallow prop comparison; React/JSX-only lesson so no vm-runnable predict-output
- **Custom Hooks: Building Reusable Logic** `custom-hooks-building-reusable-logic` · 10k chars · 3 live Q
  React custom hooks lesson (definition, rules of hooks, cleanup) — all JSX/DOM-dependent, so no verifiable predict-output snippets.
- **React.memo, PureComponent & Re-render Prevention** `react-memo-purecomponent-re-render-prevention` · 9k chars · 3 live Q
  React.memo/PureComponent re-render prevention; all concept type since the lesson is React/JSX-only with no runnable plain-JS snippet.
- **useLayoutEffect vs useEffect** `uselayouteffect-vs-useeffect` · 8k chars · 3 live Q
  React hook timing (useLayoutEffect vs useEffect) — no runnable plain-JS, so all concept.

**Routing & Navigation**

- **React Router: Complete Guide** `react-router-complete-guide` · 14k chars · 3 live Q
  React Router v6 lesson (JSX/React only, no runnable plain-JS surface) so all 3 are concept: useParams returns strings (easy), BrowserRouter vs HashRouter on static hosts (medium), v6 most-specific route matchi…
- **Protected Routes & Authentication Flow** `protected-routes-authentication-flow` · 9k chars · 3 live Q
  React Router protected routes/auth flow — all JSX/React, no runnable plain-JS surface, so 3 concept questions (authn vs authz, location.state redirect-back, client-side guards are UX only).
- **Code Splitting & Lazy Loading Routes** `code-splitting-lazy-loading-routes` · 10k chars · 3 live Q
  React.lazy/Suspense route-level code splitting; all JSX/React so no runnable plain-JS snippet — concept only.

**State Management**

- **State Management: When & Why You Need It** `state-management-when-why-you-need-it` · 8k chars · 3 live Q
  React state-management decision-making (four state types, co-location, Context re-render cost); no runnable plain JS in the lesson, so all concept.
- **Redux from Scratch: Core Principles** `redux-from-scratch-core-principles` · 11k chars · 3 live Q
  Redux core principles lesson (React/Redux, JSX + library APIs) — all concept; no runnable bare-JS snippet possible.
- **Redux Toolkit: The Modern Way** `redux-toolkit-the-modern-way` · 11k chars · 3 live Q
  Redux Toolkit lesson (configureStore, createSlice/Immer, createAsyncThunk) — React/npm-package territory, so no runnable vm-safe snippets; all concept.
- **Redux Middleware & Side Effects** `redux-middleware-side-effects` · 9k chars · 3 live Q
  Redux middleware, redux-thunk, and custom middleware signature — all Redux/RTK API-dependent, so no vm-runnable predict-output was possible; 3 concept questions covering dispatch pipeline position, thunk capab…
- **Context API vs Redux: The Real Answer** `context-api-vs-redux-the-real-answer` · 12k chars · 3 live Q
  Context API vs Redux (React state management) — no runnable plain JS, so all 3 are concept: DI vs state management, consumer re-render with no selectors, server state belongs in React Query.

**Performance Optimization**

- **React Performance: The Complete Toolkit** `react-performance-the-complete-toolkit` · 11k chars · 3 live Q
  React performance toolkit: measure-before-optimize, move state down, network vs render bottleneck. No runnable plain JS, so all concept.
- **Code Splitting, Lazy Loading & Suspense Deep Dive** `code-splitting-lazy-loading-suspense-deep-dive` · 10k chars · 3 live Q
  React code splitting/tree shaking/Suspense lesson - no runnable plain-JS surface, so all concept
- **Virtualization: Rendering 10,000 Rows** `virtualization-rendering-10-000-rows` · 9k chars · 3 live Q
  React virtualization with react-window (FixedSizeList/VariableSizeList) plus infinite scroll; all JSX/DOM-dependent so no predict-output was verifiable — 3 concept questions on the style prop, the virtualize t…
- **Memoization Strategies & When NOT to Optimize** `memoization-strategies-when-not-to-optimize` · 7k chars · 3 live Q
  React memoization strategies (React.memo/useMemo/useCallback costs and when not to optimize) — React-specific, so no runnable plain-JS snippet was possible; all concept.
- **Web Vitals, Tree Shaking & Bundle Optimization** `web-vitals-tree-shaking-bundle-optimization` · 13k chars · 3 live Q
  React perf lesson (Core Web Vitals, CSR/SSR/SSG, tree shaking, bundle/image optimization) — no runnable plain JS, so all 3 are concept: INP replacing FID, why default lodash import defeats tree shaking, and hy…

**Design Patterns in React**

- **Container/Presentational Pattern** `container-presentational-pattern` · 3k chars · 3 live Q
  React Container/Presentational pattern — all concept type since the lesson is JSX/React-only with no runnable plain-JS snippet; covers container role, presentational role, and hooks-era relevance.
- **Higher-Order Components (HOC)** `higher-order-components-hoc` · 7k chars · 3 live Q
  HOC pattern in React (definition, prop collisions, HOC vs custom hooks); JSX-only lesson so no runnable bare-Node snippet was possible
- **Render Props Pattern** `render-props-pattern` · 4k chars · 3 live Q
  React render props pattern; JSX/React-only lesson so no runnable plain-JS snippet is verifiable — all concept. Tests pattern definition, children-as-function variation, and when render props still beat custom…
- **Compound Component Pattern** `compound-component-pattern` · 4k chars · 3 live Q
  React Compound Component pattern (Context-shared implicit state, Tabs example); all JSX/React so no runnable plain-JS snippet is verifiable.
- **Provider Pattern & Composition Pattern** `provider-pattern-composition-pattern` · 6k chars · 3 live Q
  React Provider (Context) + Composition patterns; all-JSX lesson so no runnable plain-JS snippet — 3 grounded concept questions.
- **SOLID Principles in React** `solid-principles-in-react` · 10k chars · 3 live Q
  SOLID principles mapped to React components; all concept since the lesson is JSX/architecture with no runnable plain-JS snippets. Covers SRP, Open/Closed, and Interface Segregation.

**API Integration & Real-World Patterns**

- **Fetching Data: fetch vs axios vs React Query** `fetching-data-fetch-vs-axios-vs-react-query` · 14k chars · 3 live Q
  React data-fetching lesson (fetch vs axios vs React Query); all React/JSX so no runnable plain-JS snippet — 3 concept questions on fetch error semantics, React Query's role, and AbortController cleanup.
- **Loading, Error & Empty States** `loading-error-empty-states` · 4k chars · 3 live Q
  React lesson on the four data states (loading/error/empty/success); all-concept since JSX/fetch/useQuery cannot run in a bare Node vm.
- **Authentication & JWT in React** `authentication-jwt-in-react` · 6k chars · 3 live Q
  JWT auth in React (401 handling, localStorage vs httpOnly cookie trade-off, why client-side auth is UX only); no runnable plain-JS snippet exists since the lesson is fetch/DOM/React-based, so all three are con…
- **Debouncing & Throttling** `debouncing-throttling` · 7k chars · 3 live Q
  React debounce/throttle lesson (useDebounce/useThrottle hooks, search race conditions) — all React/JSX, so no runnable plain-JS snippet was possible.

**Testing in React**

- **Testing Fundamentals: What, Why, and How** `testing-fundamentals-what-why-and-how` · 5k chars · 3 live Q
  React testing fundamentals (pyramid, tooling stack, RTL philosophy) — no runnable plain JS in the lesson, so all concept.
- **React Testing Library: Practical Guide** `react-testing-library-practical-guide` · 8k chars · 3 live Q
  React Testing Library practical guide (queries, userEvent, async testing) — no runnable plain JS, so all concept.
- **Mocking API Calls, Hooks & Context** `mocking-api-calls-hooks-context` · 7k chars · 3 live Q
  React testing lesson (mocking fetch/MSW, Context Providers, renderHook + act) — all JSX/RTL, no runnable plain-JS, so concept only.

**Scenario-Based & Behavioral Questions**

- **Scenario: "This React App is Slow. How Do You Fix It?"** `scenario-this-react-app-is-slow-how-do-you-fix-it` · 5k chars · 3 live Q
  React interview scenario on diagnosing a slow app (symptom-first framework, profiling tools, fix ordering) — pure prose/table, no runnable JS, so all three are concept questions.
- **Scenario: "Design the Component Architecture for This Feature"** `scenario-design-the-component-architecture-for-this-feature` · 3k chars · 3 live Q
  React component-architecture interview scenario (e-commerce listing page): state placement, CartContext vs local state, URL-param sync. No runnable plain JS, so all concept; citations verified verbatim.
- **Scenario: "How Do You Manage State in a Large React App?"** `scenario-how-do-you-manage-state-in-a-large-react-app` · 2k chars · 3 live Q
  Behavioral/architecture scenario on layering React state (local, Context, Redux/Zustand, React Query); no runnable code in the lesson, so all concept.
- **Scenario: "Walk Me Through What Happens When You Type a URL and See a React Page"** `scenario-walk-me-through-what-happens-when-you-type-a-url-and-see-a-react-page` · 3k chars · 3 live Q
  Lesson walks the URL-to-React-page sequence (DNS/TCP/HTTP, SPA shell vs SSR, VDOM commit, useEffect timing, Router, hydration); no runnable plain-JS snippet exists, so all 3 are concept questions with verbatim…
- **Behavioral Questions: What Interviewers Really Want** `behavioral-questions-what-interviewers-really-want` · 6k chars · 3 live Q
  Behavioral interview prep (model answers + Module 10 recap); no runnable code, so all concept — covers the race-condition bug story, requirements-over-opinions framing, and the when-stuck escalation ladder.

**Machine Coding**

- **Machine Coding Round: Strategy & Setup** `machine-coding-round-strategy-setup` · 5k chars · 3 live Q
  Lesson is React machine-coding interview strategy (evaluation criteria, 5-min planning phase, tips) with zero runnable JS, so all 3 are concept: planning-first (easy), start-ugly-then-refactor (medium), single…
- **Build: Counter with useReducer** `build-counter-with-usereducer` · 2k chars · 3 live Q
  React useReducer counter (machine coding) — JSX/hooks code can't run in a bare Node vm, so all 3 are concept: Math.max clamp on DECREMENT, UI-vs-domain state split, and Number(payload) || 0 coercion.
- **Build: Dynamic Checkbox with Select All** `build-dynamic-checkbox-with-select-all` · 2k chars · 3 live Q
  React machine-coding lesson (checkbox group with Select All): derived state, immutable map updates, controlled checkboxes. JSX/useState only, so no verifiable predict-output snippet.
- **Build: Todo App with CRUD** `build-todo-app-with-crud` · 4k chars · 3 live Q
  React machine-coding lesson (useReducer todo CRUD, derived filtering, inline edit state) — JSX/hooks only, so no runnable plain-JS snippet; all three are concept questions.
- **Build: Search Bar with Debounced API Calls** `build-search-bar-with-debounced-api-calls` · 2k chars · 3 live Q
  React debounced search bar (useDebounce hook, effect cleanup, fetch race conditions); all concept since the code is React+fetch and cannot run in a bare Node vm.
- **Build: Nested Circles (Recursive Component)** `build-nested-circles-recursive-component` · 2k chars · 3 live Q
  React/JSX machine-coding lesson (recursive Circle component) — no runnable plain-JS surface, so all three are concept: initial useState count, the (maxDepth - depth + 1) * 80 sizing rule, and modulo-based colo…
- **Build: Infinite Scroll List** `build-infinite-scroll-list` · 2k chars · 3 live Q
  React infinite scroll machine-coding lesson (IntersectionObserver, callback ref, loading guard) — JSX/DOM only, so no runnable predict-output snippets are possible.
- **Build: Multi-Step Form with Validation** `build-multi-step-form-with-validation` · 3k chars · 3 live Q
  React multi-step form machine-coding lesson (JSX/hooks) — not vm-runnable, so all 3 are concept questions covering per-step validation scope, error clearing on change, and the nextStep gate.
- **Build: Star Rating Component** `build-star-rating-component` · 1k chars · 3 live Q
  React star rating machine-coding lesson: hover vs selected state, hoverRating || rating fallback, Array.from star values, onRate callback prop. Predict-output snippet verified in Node.
- **Build: Accordion / FAQ Component** `build-accordion-faq-component` · 2k chars · 3 live Q
  React accordion machine-coding lesson (single-open state, conditional rendering, Set-based multi-open extension); JSX-only so no verifiable predict-output snippet.
- **Build: Modal / Dialog Component** `build-modal-dialog-component` · 3k chars · 3 live Q
  React modal build lesson (portals, overlay click detection, effect cleanup/scroll lock); JSX + DOM APIs only, so no vm-runnable predict-output was possible.
- **Build: Custom Dropdown / Select** `build-custom-dropdown-select` · 3k chars · 3 live Q
  Machine-coding lesson building a custom React dropdown (click-outside via ref, keyboard nav, tabIndex focus); JSX/DOM-only so no verifiable predict-output snippets.
- **Build: Tic-Tac-Toe Game** `build-tic-tac-toe-game` · 2k chars · 3 live Q
  React machine-coding lesson (Tic-Tac-Toe): guard clause, flat-array board model, derived state. All concept — JSX/useState code cannot run in a bare vm.
- **Build: Pagination Component** `build-pagination-component` · 3k chars · 3 live Q
  React JSX pagination component build; no runnable plain-JS snippet possible, so all three are concept: totalPages math, slice window, sliding-window/ellipsis output.
- **Build: Shopping Cart with Context** `build-shopping-cart-with-context` · 4k chars · 3 live Q
  React Context + useReducer shopping cart (machine coding); JSX/hooks only, so no vm-runnable snippet — all 3 are concept: add-or-increment, quantity<=0 removal, derived total/itemCount.

### `nodejs-backend-kit` — 6 topics, 3 chapters, 5k chars

**Node.js Core Concepts**

- **Event-Driven Architecture** `event-driven-architecture` · 734 chars · 3 live Q
  Node.js EventEmitter and event-driven architecture; all concept since the lesson's only snippet uses require('events'), unavailable in the vm sandbox.
- **Streams & Buffers** `streams-buffers` · 764 chars · 3 live Q
  Node.js streams and buffers: stream definition, the four stream types, pipe-based file copy, and memory/time efficiency. All concept — every example depends on Node built-ins (fs, zlib, http) unavailable in th…

**Express.js & REST APIs**

- **Middleware Pattern** `middleware-pattern` · 709 chars · 3 live Q
  Express middleware pattern; all concept — Express APIs and Date.now make predict-output unverifiable in a bare vm.
- **RESTful API Design** `restful-api-design` · 799 chars · 3 live Q
  REST API design (resources, HTTP verbs, response/error envelopes) — no runnable plain JS, so all concept.

**Database & Authentication**

- **MongoDB with Mongoose** `mongodb-mongoose` · 928 chars · 3 live Q
  Mongoose lesson (schema enum/default, populate refs, aggregation, indexing); no runnable plain-JS possible in a bare vm, so all 3 are concept. Citations verified verbatim; correct answers shuffled off index 0.
- **JWT Authentication** `jwt-authentication` · 1k chars · 3 live Q
  JWT auth in Node: token structure, Bearer-header parsing in the verify middleware, access vs refresh tokens. All concept — lesson's code needs require/Express/process.env, none available in the vm sandbox.

### `complete-frontend-kit` — 74 topics, 25 chapters, 991k chars

**HTML & Semantic Markup**

- **Semantic structure** `semantic-structure` · 19k chars · 3 live Q
  HTML semantics lesson (semantic tags, section/article/div, heading hierarchy, meta/OG tags) — no runnable JS, so all 3 are concept questions with verified verbatim citations.
- **Html5 apis and forms** `html5-apis-and-forms` · 24k chars · 3 live Q
  HTML5 dialog, native form validation, and FormData — all browser/DOM APIs, so no vm-runnable snippet; 3 concept questions with verified verbatim citations.
- **Loading and resource hints** `loading-and-resource-hints` · 14k chars · 3 live Q
  HTML script loading (async/defer/module) and resource hints; no runnable plain JS, so all concept.

**Accessibility**

- **Aria and semantics** `aria-and-semantics` · 22k chars · 3 live Q
  ARIA/semantics lesson (first rule of ARIA, landmark roles, tabindex + roving tabindex); HTML/ARIA only, so no runnable JS snippet — all concept.
- **Focus management** `focus-management` · 17k chars · 3 live Q
  Accessibility focus management (SPA route focus, focus trapping, inert); all JSX/DOM so no verifiable predict-output — 3 concept questions, citations verified verbatim.
- **Dynamic content and forms** `dynamic-content-and-forms` · 22k chars · 3 live Q
  ARIA accessibility for dynamic UIs: aria-live polite/assertive, live-region injection pitfall, aria-activedescendant virtual focus. All DOM/HTML — no vm-runnable JS, so no predict-output.

**CSS & Styling**

- **Layout and visual** `layout-and-visual` · 26k chars · 3 live Q
  Pure CSS lesson (Flexbox axes, Grid auto-fit/auto-fill, position/stacking context) — no runnable JS, so all three are concept questions.
- **Architecture and scale** `architecture-and-scale` · 19k chars · 3 live Q
  CSS architecture at scale (BEM/CSS Modules/CSS-in-JS/Tailwind, design tokens, container queries); no runnable plain-JS content so all concept, citations verified verbatim.
- **Performance and animation** `performance-and-animation` · 19k chars · 3 live Q
  CSS rendering pipeline: reflow/repaint/composite, layout thrashing, FLIP. All CSS/DOM-API — no vm-runnable JS, so no predict-output.

**TypeScript**

- **Typescript Fundamentals** `typescript-fundamentals` · 28k chars · 3 live Q
  TypeScript fundamentals (inference, type vs interface, unions/enums, as const) — no runnable plain-JS surface, so all three are concept questions.
- **Generics Advanced Types** `generics-advanced-types` · 25k chars · 3 live Q
  TypeScript generics/utility/mapped/conditional types — type-level only, nothing runnable in a bare JS vm, so all three are concept questions.
- **Typescript In Practice** `typescript-in-practice` · 30k chars · 3 live Q
  TypeScript applied to React (props/events/refs, custom hooks, Zod runtime validation, Redux/Zustand store typing, HOCs) — all React/TS, none runnable in a bare vm, so all concept.

**Web Fundamentals**

- **Networking And Protocols** `networking-and-protocols` · 21k chars · 3 live Q
  Networking/protocols lesson (URL pipeline, DNS, TCP/TLS, HTTP versions, REST): no runnable JS, so 3 concept questions on idempotency, HTTP/2 domain sharding, and QUIC head-of-line blocking. Lesson file is trun…
- **Browser internals** `browser-internals` · 14k chars · 3 live Q
  Browser internals: render tree, event system, CORS, service/web workers. All concept — lesson is DOM/network APIs, unverifiable in a bare Node vm.
- **Realtime and browser apis** `realtime-and-browser-apis` · 22k chars · 3 live Q
  Real-time comms (WebSockets/SSE) and browser storage/APIs; all lesson code depends on browser globals unavailable in a bare vm, so concept-only

**Web-Security**

- **Common attacks** `common-attacks` · 14k chars · 3 live Q
  Web-security lesson (XSS, CSRF, clickjacking, SQL injection) — no runnable plain-JS material, so all 3 are concept questions; citations verified verbatim.
- **Authentication and authorization** `authentication-and-authorization` · 19k chars · 3 live Q
  Web-security lesson on JWT vs session cookies, OAuth 2.0 with PKCE, and input validation — no runnable plain-JS surface, so all three are concept questions (JWT statelessness, PKCE verifier, refresh-token rota…
- **Headers and infrastructure** `headers-and-infrastructure` · 23k chars · 3 live Q
  Web-security lesson (CSP, CORS, HSTS, SRI, secure headers) — no runnable plain-JS, so all three are concept: CORS is browser-enforced, HSTS vs HTTP redirect, and CSP 'unsafe-inline'.

**Rendering Patterns**

- **Core rendering strategies** `core-rendering-strategies` · 15k chars · 3 live Q
  Rendering strategies (CSR/SSR/SSG/ISR) — concept-only; no runnable plain JS, so no predict-output. Tests CSR empty-shell/SEO, SSR hydration semantics, ISR stale-while-revalidate.
- **Modern rendering patterns** `modern-rendering-patterns` · 18k chars · 3 live Q
  Modern rendering patterns (Streaming SSR, RSC, progressive hydration, Islands); all JSX/Astro/HTML so no runnable plain-JS snippet — 3 concept Qs on independent Suspense boundaries, RSC serializable props, and…

**Optimization**

- **Rendering and loading** `rendering-and-loading` · 21k chars · 3 live Q
  Frontend perf lesson (CRP, Core Web Vitals, bundle optimization, images); no vm-runnable JS, so all concept.
- **Runtime and network** `runtime-and-network` · 23k chars · 0 live Q
  Runtime/network optimization: idle scheduling, content-visibility, and stale-while-revalidate. No predict-output — lesson covers browser APIs, CSS, HTTP headers, and React, none runnable in a bare vm.
- **Measurement and strategy** `measurement-and-strategy` · 16k chars · 0 live Q
  Perf optimization lesson (compression, API calls, rAF, perceived perf, RUM, budgets); all code is React/fetch/CI config so no verifiable plain-JS snippet — 3 concept questions on Brotli/Gzip, offset vs cursor…

**Design Patterns**

- **Creational patterns** `creational-patterns` · 15k chars · 2 live Q
  Creational design patterns (Module/IIFE, Singleton, Factory, Abstract Factory, Builder, Prototype); both snippets executed in Node to confirm literal output.
- **Behavioral patterns** `behavioral-patterns` · 20k chars · 1 live Q
  Behavioral design patterns (Observer/Pub-Sub, Mediator, Strategy, Command, Iterator, State); predict-output snippet executed in Node and verified against the marked answer.
- **Structural patterns** `structural-patterns` · 12k chars · 1 live Q
  Structural design patterns (Decorator/Adapter/Facade/Proxy/Flyweight/Composite); predict-output snippet verified in Node, other sections need fetch/TS/JSX so they went concept.
- **Architectural patterns** `architectural-patterns` · 8k chars · 0 live Q
  MVC/MVP/MVVM comparison plus a pattern-selection decision guide; no runnable JS in the lesson, so all three are concept questions.

**State Management**

- **State management** `state-management` · 30k chars · 0 live Q
  React state management (local vs lifted vs context vs global, Context re-render trap, Zustand selectors) — JSX/React only, no runnable plain-JS, so all concept.

**System Design**

- **Foundations** `foundations` · 12k chars · 0 live Q
  Frontend system design interview foundations (RADIO framework, frontend estimation, REST/GraphQL/WebSocket/SSE choice) — no runnable JS in the lesson, so all three are concept questions covering the D stage of…
- **Communication and realtime** `communication-and-realtime` · 14k chars · 0 live Q
  Frontend system design walkthroughs (chat, collab editor, video calls, notifications, live chat); no runnable plain JS, so all concept: WebSocket vs SSE, CRDT vs OT/LWW, SFU scaling.
- **Content and media** `content-and-media` · 11k chars · 0 live Q
  Frontend system design walkthroughs (news feed, YouTube ABR, Instagram, carousel, stories, Spotify); no runnable plain JS, so all concept.
- **Ecommerce** `ecommerce` · 10k chars · 0 live Q
  E-commerce frontend system design (product page, faceted search, checkout); no runnable plain-JS snippets — code is React/TS/JSON only, so all 3 are concept with verified verbatim citations.
- **Productivity and saas** `productivity-and-saas` · 14k chars · 0 live Q
  Senior frontend system design (spreadsheet, Kanban, calendar, email, code editor); no runnable plain JS so all concept — tests optimistic DnD rollback, topological recalc via dependency DAG, and calendar colum…
- **Platform and infrastructure** `platform-and-infrastructure` · 15k chars · 0 live Q
  Senior system-design Q&A (design systems, micro-frontends, A/B, CMS, i18n, flags, error monitoring, PWA); all React/architecture prose with no runnable plain JS, so 3 concept questions covering analytics aggre…

**React Hooks**

- **Core hooks** `core-hooks` · 14k chars · 0 live Q
  React hooks lesson (useState/useEffect/useCallback/useMemo/useRef) — all React/JSX APIs, unverifiable in a bare Node vm, so all 3 are concept: lazy init, useCallback without React.memo, useEffect race conditio…
- **Specialized hooks** `specialized-hooks` · 9k chars · 0 live Q
  React specialized hooks (useLayoutEffect, useId, useTransition/useDeferredValue) — JSX/DOM only, no runnable plain JS, so all concept.
- **React 19 hooks** `react-19-hooks` · 8k chars · 0 live Q
  React 19 hooks (useOptimistic, useFormStatus, useActionState, use) — JSX/server-action only, so no vm-runnable predict-output; all concept, citations verified verbatim.
- **Custom hooks and rules** `custom-hooks-and-rules` · 7k chars · 0 live Q
  Custom hooks + Rules of Hooks (call-order pairing, fiber-tree requirement, use() exception); all concept since the lesson is React/JSX only, no vm-runnable JS.

**AI Integration**

- **AI Integration** `ai-integration` · 19k chars · 0 live Q
  Frontend AI integration (streaming chat, EventSource vs ReadableStream, tool use, context-window truncation); all React/Web-API material with no runnable plain-JS, so concept only.

**NextJS**

- **App router and rendering** `app-router-and-rendering` · 16k chars · 0 live Q
  Next.js App Router: layout persistence, fetch dedup, Server Actions vs API Routes. All concept — lesson is React/TSX/server-only, no vm-runnable plain JS.
- **Features and deployment** `features-and-deployment` · 13k chars · 0 live Q
  Next.js middleware, image/font optimization, and deployment options — no runnable plain JS, so all concept.

**Code Management**

- **Code Management** `code-management` · 17k chars · 0 live Q
  Code Management interview-prose lesson (monorepo vs polyrepo, trunk-based vs Gitflow + feature flags, frontend CI/CD, quality tooling); no runnable plain-JS so all three are concept questions.

**Build Tools**

- **Modules and bundlers** `modules-and-bundlers` · 19k chars · 0 live Q
  Build-tools lesson (CJS vs ESM, bundler comparison, why Vite is fast, Babel/SWC/esbuild, Module Federation) — all architectural, no runnable deterministic plain-JS, so all three are concept questions.
- **Tooling and environment** `tooling-and-environment` · 16k chars · 0 live Q
  Interview-prep lesson on monorepos (Turborepo/Nx), source maps, frontend env vars, and DevTools — no runnable plain-JS material, so all three are concept questions.

**JS Problems SDE1**

- **JS Problems SDE1** `js-problems-sde1` · 20k chars · 2 live Q
  JS machine-coding polyfills (map/filter/reduce/bind/debounce/throttle/EventEmitter); both predict-output snippets executed in Node and verified exact.

**JS Problems SDE2**

- **JS Problems SDE2** `js-problems-sde2` · 17k chars · 2 live Q
  SDE2 JS implementation problems (Promise.allSettled/any, memoize, deepEqual, LRU, retry, JSON.stringify/parse); both predict-output snippets executed in Node and confirmed exact; concept citation verified verb…

**JS Problems SDE3**

- **JS Problems SDE3** `js-problems-sde3` · 8k chars · 1 live Q
  SDE3 JS problems: simplified module bundler (graph traversal, module registry) and Vue-like Proxy reactivity (reactive/effect/computed); predict-output verified by running the trimmed reactivity snippet in Nod…

**Machine Coding Practice**

- **Problems** `problems` · 9k chars · 0 live Q
  Spec sheet of 14 timed machine-coding practice problems (no runnable code), so all concept: 300ms debounce, asc/desc/none sort cycle, required-vs-bonus focus trapping.

**Testing**

- **Testing fundamentals** `testing-fundamentals` · 15k chars · 0 live Q
  Frontend testing fundamentals (testing trophy, Jest/Vitest mocking, RTL, MSW) — all React/tooling-based, no runnable plain-JS snippet, so all three are concept questions.
- **Advanced testing** `advanced-testing` · 0 chars · 0 live Q
  _(no lesson summary — not authored)_
- **Testing patterns** `testing-patterns` · 13k chars · 0 live Q
  Frontend testing patterns (TDD, snapshots, async, custom hooks) — all React Testing Library / strategy content, no runnable plain-JS snippet possible, so all 3 are concept questions.

**Data-Structures**

- **Linear data structures** `linear-data-structures` · 11k chars · 1 live Q
  Linear data structures (arrays, strings, stacks, queues, linked lists, circular buffers); predict-output uses the lesson's CircularBuffer, verified in Node.
- **Hash based structures** `hash-based-structures` · 7k chars · 1 live Q
  Map vs Object key coercion, Set O(1) membership, and Bloom filter false-negative guarantee; only the Map/Object idea was safely runnable as predict-output.
- **Tree and graph structures** `tree-and-graph-structures` · 14k chars · 1 live Q
  DSA lesson (trees, BST, heaps, tries, graphs, union-find); BST inorder snippet verified in bare vm, both citations verbatim.

**Algorithms**

- **Sorting algorithms** `sorting-algorithms` · 7k chars · 2 live Q
  Sorting algorithms lesson: stability semantics (concept, cited), nulls-last custom comparator and quick sort partition trace (both predict-output, verified by execution).
- **Searching** `searching` · 3k chars · 2 live Q
  Searching algorithms (binary search, rotated array, binary search on answer); both predict-output snippets executed in Node and verified exact.
- **Two pointer** `two-pointer` · 3k chars · 2 live Q
  Two-pointer algorithms lesson; 2 predict-output (twoSum convergence, in-place removeDuplicates leaving a dirty tail) both executed and verified in Node, plus 1 concept on Dutch National Flag cited verbatim.
- **Sliding window** `sliding-window` · 3k chars · 2 live Q
  Sliding window algorithms; two snippets verified by running them in Node, concept Q cites the lesson's prefix-sum carve-out.
- **Recursion backtracking** `recursion-backtracking` · 6k chars · 2 live Q
  Recursion/backtracking algorithms: subsets DFS order, combination-sum reuse semantics, and IP-restore segment constraints; both snippets executed in a bare vm and outputs confirmed.
- **Dynamic programming** `dynamic-programming` · 11k chars · 2 live Q
  DP algorithm catalog (coin change, knapsack, LCS/LIS); both predict-output snippets verified in a bare Node vm, concept citation matched verbatim.
- **Greedy** `greedy` · 2k chars · 2 live Q
  Greedy algorithms lesson: pattern definition (concept, cited) plus two verified predict-output snippets from the lesson's own Jump Game and Partition Labels code.
- **Trees** `trees` · 4k chars · 1 live Q
  Binary tree algorithms (traversals, invert, BST validation, path sums); predict-output snippet verified by running it in Node.
- **Graphs** `graphs` · 4k chars · 2 live Q
  Graph algorithms (BFS/DFS grids, topological sort, Dijkstra); both predict-output snippets executed in a bare vm and verified against the marked answer.
- **Stack queue** `stack-queue` · 3k chars · 2 live Q
  Stack/queue algorithms: valid parentheses, monotonic stack next-greater, queue-from-two-stacks. Both snippets executed in Node to confirm exact output.
- **Strings** `strings` · 2k chars · 2 live Q
  String algorithms index (anagram, KMP/LPS, Rabin-Karp); 2 predict-output verified in Node vm, 1 concept cited verbatim.
- **Bit manipulation** `bit-manipulation` · 1k chars · 2 live Q
  Bit manipulation (XOR single number, Hamming weight/power-of-two, XOR missing number); both snippets executed in Node and citation verified against lesson text.
- **Math** `math` · 2k chars · 2 live Q
  Math/number-theory lesson (gcd/lcm, sieve, binary exponentiation, float precision, trailing zeros); both predict-output snippets verified in Node.
- **Miscellaneous** `miscellaneous` · 3k chars · 2 live Q
  Misc algorithm patterns (Kadane, Boyer-Moore, reservoir sampling, product-except-self, top-K); 2 predict-output verified by execution in a bare vm, 1 concept on reservoir sampling (non-deterministic code, so c…

**Low-Level Design & Machine Coding**

- **Approach and core components** `approach-and-core-components` · 11k chars · 0 live Q
  Machine coding round strategy plus core UI component patterns (accordion, dialog, tabs, tooltip, toast); all React/JSX/ARIA so no runnable plain-JS snippet was possible — 3 concept questions on scoring weights…
- **Form and input components** `form-and-input-components` · 9k chars · 0 live Q
  React machine-coding form/input components (autocomplete, OTP, multi-step form, uploader) — no runnable plain-JS, so all concept; citations verified verbatim.
- **Layout and data display** `layout-and-data-display` · 9k chars · 0 live Q
  React machine-coding component catalogue (infinite scroll, virtualization, DnD, tables, trees) — all JSX/DOM-dependent, so no predict-output was possible; 3 concept questions on rootMargin prefetch, virtual li…
- **Applications and advanced** `applications-and-advanced` · 8k chars · 0 live Q
  Catalog of 22 machine-coding problem specs (todo, memory game, minimax, stopwatch, cursor tracking); all code is React/JSX or depends on undefined helpers, so no verifiable predict-output — 3 grounded concept…

**Interview Guide**

- **Interview guide** `interview-guide` · 7k chars · 0 live Q
  Career/interview guidance lesson (formats by company type, STAR, salary negotiation, resume, 30-day plan) — no runnable JS, so all 3 are concept questions.
- **Quick revision sheets** `quick-revision-sheets` · 9k chars · 1 live Q
  Cheat-sheet lesson (JS/React/CSS/TS/DS/security/HTTP): one verified event-loop predict-output, plus concept questions on :where() specificity and CSRF prevention.

<!-- END GENERATED TOPIC INDEX -->

---

## 9. How to rebuild this document

The inventory and §8 are **generated**. Do not hand-edit them — regenerate.

```bash
# 1. Export every topic's content + build the index (read-only)
node scratch/export-topics.js          # → topics/*.json + topics/_index.json

# 2. Per-lesson summaries come from the authoring workflow's journal:
#    subagents/workflows/<runId>/journal.jsonl — each author agent returns
#    { topicId, written, predictOutput, concept, note }. `note` is the summary.

# 3. Regenerate §8 from _index.json + those notes + live counts per topic.
```

Cheap facts without any of that:

```js
// counts, sizes, coverage — seconds, no LLM
db.topics.aggregate([{ $group: { _id: '$kitId', n: { $sum: 1 } } }])
db.quizquestions.aggregate([{ $match: { status: 'live' } }, { $group: { _id: '$topicId', n: { $sum: 1 } } }])
```

**Rebuild when:** topics are added/removed/substantially rewritten, a kit ships, or the quiz coverage
numbers stop matching `/admin/quiz`. The §4-§6 prose is judgement, not generated — re-read it and
revise rather than regenerating blindly.
