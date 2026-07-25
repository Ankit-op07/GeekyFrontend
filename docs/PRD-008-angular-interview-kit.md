# PRD-008 — Angular Interview Kit: Deep, Visual, Dual-Audience Content

| | |
|---|---|
| **Owner** | Ankit |
| **Status** | Proposed |
| **Appetite** | 3–5 weeks (medium–large) — phased; Phase 0 (structure + first chapter) ships in ~1 week |
| **Primary goal** | New sellable kit + platform differentiation via genuinely visual, dual-audience content |
| **Pricing** | Paid kit (same access model as existing kits — buyer → all topics, preview → first chapter) |
| **Depends on** | Existing `Kit`/`Chapter`/`Topic` models, the Learn reader, Cloudinary upload endpoint, quiz engine (PRD-005), reader theming (PRD-006) |
| **Date** | 2026-07-23 |

---

## 1. Problem

Angular is one of the most-demanded enterprise frontend skills — heavy in service companies (TCS,
Infosys, Cognizant), product companies, and MNC in-house teams — yet the good preparation material is
fragmented: docs that teach but don't interview-prep, and interview-question dumps that list answers
without building understanding. **A candidate has to stitch the two halves together themselves.**

Our platform is frontend-first and already owns the *learning + interview-prep* loop for JavaScript
and React. We have **no Angular content at all** today (`scripts/seed-kits.js` seeds only
`javascript-interview-kit`, `react-interview-kit`, `nodejs-backend-kit`, `complete-frontend-kit`).
That is a clear, sellable gap adjacent to what we already do well.

The bar the user set for this kit: **content must serve both the learner (deep, clear, easy to
understand) and the interviewee (exact questions, traps, model answers), with heavy visual support —
a diagram on essentially every topic, and motion where motion genuinely aids understanding.**

---

## 2. Goal & success metrics

| Metric | Baseline | Target |
|---|---|---|
| Kit published (chapters/topics live) | 0 | **8 chapters / ~55 topics** |
| Topics with ≥1 explanatory diagram | 0 | **100% of concept topics** |
| Topics with a quiz self-check (PRD-005) | 0 | **≥ 90%** |
| Kit purchases in first 60 days | 0 | establish baseline (compare to React kit ramp) |
| Quiz attempt-rate among buyers (PRD-005 health metric) | — | **≥ 30%** (the existing gate) |

**Guardrail:** the visual bar is the point of this kit. A topic that ships as a wall of prose with no
diagram is not "done" — it fails the primary differentiator (§9).

---

## 3. Solution

A new **Angular Interview Kit** (`slug: angular-interview-kit`) built on the existing
`Kit → Chapter → Topic` hierarchy — no new content models. What's genuinely new is **an authoring
standard** (the per-topic template, §5) and **two small pieces of tooling** (a bulk image-upload
script now, §7; an animation registry later, §8).

### 3.1 It reuses the existing content pipeline

Nothing about how content is stored or rendered changes for Phase 0:

- Content is a single `content` **string per Topic**, authored as **HTML** (so the reader renders it
  as-is via `html-react-parser`; see §7 for the format-detection caveat).
- Images are standard `<img src="https://res.cloudinary.com/.../geeky-frontend/learn-content/...">`
  tags — exactly how existing kit images work.
- Code blocks (`<pre>`) auto-highlight, tables auto-wrap — already handled by the reader.
- End-of-topic quiz comes free from PRD-005 (`concept` + `predict-output` types).
- Access gating, theming, bookmarks, resume-at-last-topic — all inherited, nothing to build.

### 3.2 What's actually being built

1. **~55 topics of dual-audience content** authored to the §5 template.
2. **A diagram set** (~80–120 images) uploaded to Cloudinary via a new bulk-upload script (§7).
3. **A seed script** `scripts/seed-angular-kit.js` (mirrors `seed-kits.js`) to insert the
   kit/chapters/topics, re-runnable and idempotent by slug.
4. **(Phase 2)** An animation registry so ~8–10 flow-based topics get real interactive React
   visualizations (§8) — *deferred; Phase 0/1 ship static diagrams first.*

---

## 4. Kit outline (8 chapters / ~55 topics)

Ordered as a learning path *and* an interview-coverage map. ⭐ marks topics interviewers lean on hardest.

**Ch 1 — Angular Fundamentals** (`angular-fundamentals`)
Intro & Angular vs AngularJS · Architecture (modules/components/templates/metadata) · CLI &
project structure · Bootstrap flow (`main.ts`) · ⭐ Standalone components vs NgModules

**Ch 2 — Components & Templates** (`components-templates`)
⭐ Lifecycle hooks · Data binding (interpolation/property/event/two-way) · `@Input`/`@Output` &
`EventEmitter` · Template refs, `ViewChild`/`ContentChild` · View encapsulation

**Ch 3 — Directives & Pipes** (`directives-pipes`)
Structural vs attribute directives · New control flow (`@if`/`@for`/`@switch`, v17+) · Custom
directives, `@HostListener`/`@HostBinding` · ⭐ Pure vs impure pipes · `async` pipe

**Ch 4 — Dependency Injection & Services** (`di-services`)
What is DI · Providers, injectors, injection tokens · ⭐ `providedIn: 'root'` vs module vs component
scope · Hierarchical injector tree · `inject()` function

**Ch 5 — RxJS & Reactive Programming** (`rxjs-reactive`) ⭐ *(most interview-heavy chapter)*
Observables vs Promises · ⭐ `map`/`filter`/`switchMap`/`mergeMap`/`concatMap`/`exhaustMap` ·
⭐ Subjects (`Subject`/`BehaviorSubject`/`ReplaySubject`/`AsyncSubject`) · Subscription management &
memory leaks (`takeUntil`, `async` pipe) · ⭐ Signals (v16+) & Signals vs RxJS

**Ch 6 — Routing & Navigation** (`routing`)
Router setup, route/query params · ⭐ Lazy loading · Route guards (`CanActivate`/`CanDeactivate`,
resolvers) · Child routes & named outlets

**Ch 7 — Forms & HTTP** (`forms-http`)
⭐ Template-driven vs Reactive forms · `FormGroup`/`FormControl`/`FormArray`, custom validators ·
`HttpClient` · ⭐ Interceptors & error handling · Auth flow with interceptors

**Ch 8 — Change Detection, Performance & Advanced** (`change-detection-performance`)
⭐ Change detection: Default vs OnPush · Zone.js & zoneless · `trackBy`, `ChangeDetectorRef` ·
AOT vs JIT, tree-shaking · NgRx overview · Testing (TestBed, spies)

> First-chapter access is the free preview, so **Ch 1 must be the strongest showcase** — it's what a
> non-buyer sees and judges the kit's visual quality on.

---

## 5. The per-topic content template (the differentiator)

Every concept topic follows this skeleton so the kit reads consistently and every concept earns a
visual. Authored as HTML, **always opening with a heading** (§7 caveat).

1. **Why it matters** — 2–3 lines: where it shows up in real apps *and* in interviews.
2. **Concept, explained simply** — plain language first, then the precise definition. **Diagram here.**
3. **Visual** — a labelled diagram (Phase 0) or an animation (Phase 2) for flow/state-over-time topics.
4. **Code example** — minimal, commented, runnable-where-possible (RxJS/TS snippets can use the
   `predict-output` quiz path since they're real JS).
5. **Under the hood** — the *why*, for genuine understanding, not memorization.
6. **⭐ Interview lens** — the exact questions asked, common traps, and a crisp model answer. This is
   the bridge that makes one body of content serve both audiences.
7. **Cheat-card recap** — bullet summary for last-minute revision.
8. **Self-check** — PRD-005 quiz (`concept` mostly; `predict-output` for RxJS/TS).

**Image budget:** 1 core diagram per topic minimum; 2–4 for heavy topics (RxJS operators, change
detection, DI injector tree, forms comparison). Target ~80–120 images total.

**Diagram topics that most need a visual** (Phase 0 static, Phase 2 candidates for animation ⚡):
component lifecycle timeline · ⚡ change-detection propagation (Default vs OnPush) · DI injector tree ·
⚡ RxJS marble diagrams (`switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap`) · ⚡ Subject variants
emission · ⚡ Signals reactivity graph · routing guard decision flow · Reactive-vs-Template forms
data flow · HTTP interceptor chain · Zone.js trigger cycle.

---

## 6. Dual-audience: how one topic serves both

The user's requirement is that the same content works for *learning* and *interview prep*. The
template solves this structurally, not by writing two versions:

- **Sections 1–5** are the learner's path — build the mental model with words, a picture, and code.
- **Section 6 (Interview lens)** re-frames that same concept as it appears in an interview: the
  literal question, the trap, the model answer. A learner reads it as "how would I be tested on
  this?"; an interviewee jumps straight to it.
- **Section 7 (cheat-card)** is the night-before revision surface.

Net: no duplicate content, no separate "interview mode" — the interview value is a *lens* layered on
solid teaching.

---

## 7. Tooling piece 1 — bulk image upload (Phase 0)

**Why:** the only way images enter Cloudinary today is one-at-a-time through the admin TipTap editor
(`/api/admin/upload-image`, one `file` per request). Uploading 80–120 Angular diagrams that way is a
non-starter. We need a batch path.

**Build `scripts/upload-images.js`** — a Node CLI that reuses the *exact same* Cloudinary config and
folder as the existing route (no new integration, no new env vars — `CLOUDINARY_CLOUD_NAME` /
`_API_KEY` / `_API_SECRET` already exist):

```
node scripts/upload-images.js ./angular-diagrams
```

- Walks a local folder, uploads each image to `folder: "geeky-frontend/learn-content"`,
  `resource_type: "auto"` (identical to the route).
- Prints a `filename → secure_url` map (and writes it to `angular-diagrams/urls.json`) so URLs can be
  pasted into topic HTML or consumed by the seed script.
- Idempotent-ish: pass a stable `public_id` per file (derived from filename) so re-runs overwrite
  rather than duplicate.

**Content-format caveat (must-follow, from the reader's detection logic):** the reader decides
HTML-vs-Markdown by sniffing the **first tag**. The regex matches block tags
(`h1-6|p|div|pre|ul|ol|blockquote|table|section|article|figure|hr`) — **`img` is NOT in the list.**
So a topic whose content *starts* with `<img>` is mis-routed to the Markdown parser. **Rule: every
topic's HTML content must open with a heading or `<p>`, never a bare image.** Wrap standalone images
in `<figure><img …><figcaption>…</figcaption></figure>` mid-content, which is fine — only the *first*
node matters for detection.

---

## 8. Tooling piece 2 — animation registry (Phase 2, deferred)

**Reality check (verified against the codebase):** there are **no animations anywhere in the platform
today** — no `framer-motion`/`gsap`/`lottie`/`d3`, no animated components, no slug→component
registry. The "DSA / system-design animations" are a *marketing description string*, not shipped
functionality. So animations are **net-new infrastructure**, correctly deferred to Phase 2 per the
scoping decision.

When built, the design is:

1. Add an animation library (recommend **`framer-motion`** — React-native, declarative, small).
2. Hand-build ~8–10 animated React components for the ⚡ flow topics in §5
   (`ChangeDetectionViz`, `RxJSMarble`, `SignalsGraph`, `RouterGuardFlow`, …).
3. Introduce a **content token** the reader understands, e.g. `[[anim:change-detection]]`, and handle
   it in the reader's `parse()` replace callback at
   `app/learn/[kitSlug]/[topicSlug]/page.tsx` (~line 417, alongside the existing `<pre>`/`<table>`
   cases) → renders `<ChangeDetectionViz />` from a `slug → component` registry map.

This registry is **reusable across every future kit** (React, Vue, System Design), so the Phase 2
investment amortizes well. Until then, the same concepts ship as static Cloudinary diagrams (and,
where cheap, animated GIFs, which already render as `<img>`).

---

## 9. Scope

### Phase 0 — foundation + showcase chapter (ships first, ~1 week)
- [ ] `scripts/upload-images.js` bulk uploader (§7)
- [ ] `scripts/seed-angular-kit.js` (kit + chapter + topic seeding, idempotent by slug)
- [ ] **Ch 1 fully authored** to the §5 template with diagrams (the free-preview showcase)
- [ ] Kit registered (`angular-interview-kit`, icon `🅰️`, gradient color, order after existing kits)

### Phase 1 — full content
- [ ] Ch 2–8 authored to template, all diagrams uploaded
- [ ] Quiz questions per topic (PRD-005 authoring flow) — `concept` + `predict-output`
- [ ] Company-bank cross-links where Angular questions exist

### Phase 2 — animations
- [ ] Add `framer-motion`, build the animation registry + reader token (§8)
- [ ] ~8–10 animated components for the ⚡ flow topics
- [ ] Backfill: swap the corresponding static diagrams for animations

### Out of scope (deliberately)
- Live Angular code execution / grading in the browser — the content is React/framework prose, not
  runnable plain JS (same reason the rest of the catalogue isn't executed). RxJS/TS `predict-output`
  snippets are the only runnable slice.
- A new content model or editor — reuse `Topic.content` + TipTap/seed as-is.
- Video hosting — if we do motion pre-Phase-2, it's GIFs in Cloudinary, not a video pipeline.

---

## 10. Technical notes

- **No schema changes.** Kit/Chapter/Topic already fit. `angular-interview-kit` is just new rows.
- **Author as HTML, open with a heading.** See §7 — the first-tag detector will mis-parse
  image-first or bare-text-first content. HTML also gives us `<figure>`/`<figcaption>` for captioned
  diagrams, which Markdown can't do cleanly.
- **Reuse the exact Cloudinary folder** (`geeky-frontend/learn-content`) and env vars — no new
  integration, so images are indistinguishable from existing kit images operationally.
- **Idempotent seeding**, matching `seed-kits.js`: skip the kit if the slug already exists; safe to
  re-run.
- **Code review is mandatory** before committing the scripts or any code (per `CLAUDE.md` /
  `CODE_REVIEW.md`) — the content docs and seed data still go through the same gate.
- **Preview boundary = Ch 1.** Confirm `resolveTopicAccess` treats Ch 1 as the free chapter for this
  kit exactly as it does for others, so the showcase chapter is actually visible to non-buyers.

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Content volume is huge** (~55 deep topics + 100 diagrams) | High | Phase hard. Ship Ch 1 as a complete showcase first; validate the template before scaling. Author chapter-by-chapter. |
| Diagrams become the bottleneck | High | Bulk-upload script (§7) removes the mechanical friction; produce diagrams per-chapter alongside prose, not all at the end. |
| Visual bar slips to "prose walls" | High | §9 guardrail: a topic isn't done without its core diagram. Ch 1 sets the reviewed standard. |
| Animations over-scoped and block launch | Medium | Explicitly Phase 2. Static-first was the chosen path — the kit is fully sellable without animations. |
| `img`-first content silently renders as Markdown | Medium | Documented rule (§7) + a lint/QA check in the seed script that rejects content not starting with a block-level heading/`<p>`. |
| Angular version drift (v17/v18 syntax) | Low | Teach modern-first (standalone, `@if`/`@for`, signals, `inject()`) and note the legacy equivalent where interviewers still ask it. |

---

## 12. Open questions

1. **Diagram production** — hand-designed (Figma/Excalidraw exports) for polish, or a faster
   diagram-as-code approach (Mermaid → PNG) for the structural ones? Recommend a mix: Mermaid for
   trees/flows, designed images for the hero concept diagrams.
2. **Pricing** — standalone kit, or bundled into an existing "complete frontend" offer? Recommend
   standalone first to measure Angular demand cleanly.
3. **Phase 2 trigger** — build the animation registry as soon as Ch 1 ships (so the showcase has one
   flagship animation), or only after full content lands? Recommend **one** flagship animation
   (change detection) in Ch 8 alongside Phase 1 to prove the pattern, full registry after.
4. **Quiz authoring** — author quiz questions inline with each topic, or as a batch pass after content
   (per the PRD-005 scripts)? Recommend inline while the concept is fresh.
