# PRD-009 — Java Interview Kit: Core Java + Spring Boot, Visual, Dual-Audience

| | |
|---|---|
| **Owner** | Ankit |
| **Status** | Proposed |
| **Appetite** | 4–6 weeks (large) — phased; Phase 0 (wiring + Ch 1) ships in ~1 week |
| **Primary goal** | New sellable kit that opens the Java/backend hiring market without diluting the frontend brand |
| **Scope decision** | **Core Java + Spring Boot** (not core-Java-only, not full backend-mastery) |
| **Pricing** | ₹299 standalone (`originalPrice` ₹2999). **NOT added to the All-Access bundle** |
| **Depends on** | `Kit`/`Chapter`/`Topic` models, Learn reader, `scripts/upload-images.js`, quiz engine (PRD-005), reader theming (PRD-006), `resolveTopicAccess()` |
| **Date** | 2026-07-27 |

---

## 1. Problem

Java is the single largest interview market in Indian hiring — service companies (TCS, Infosys,
Wipro, Cognizant, Accenture), product companies, and every bank/enterprise in-house team. We have
**zero Java content**: `KIT_CATALOG` covers JS, React, Angular, Node, Frontend System Design, DevOps.

The material that exists publicly splits the same way Angular's did (PRD-008 §1): docs that teach but
never test, and question dumps that answer without building understanding. Java has an extra failure
mode — nearly all free material stops at core-language trivia (`==` vs `.equals`, four OOP pillars)
while **actual Java interviews are dominated by collections internals, concurrency, JVM behaviour and
Spring Boot**. That gap is the product.

**Honest risk, stated up front:** this is the first kit whose audience barely overlaps the
frontend-first brand (DevOps is the only precedent, and it is also new). Distribution to the existing
buyer list will convert worse than a React or JS kit did. The scope choice below is what makes the
kit defensible in a market we don't already own.

---

## 2. Goal & success metrics

| Metric | Baseline | Target |
|---|---|---|
| Kit published | 0 | **14 chapters / 60–70 topics** |
| Topics with ≥1 explanatory diagram | 0 | **100% of concept topics** (~110–140 images) |
| Topics with a quiz self-check (PRD-005) | 0 | **≥ 90%** |
| Chapters covering Spring/JPA/testing | 0 | **≥ 4** (the differentiator — §3.1) |
| Purchases in first 60 days | 0 | establish a baseline; compare ramp to the DevOps kit, **not** to React |
| Quiz attempt-rate among buyers | — | **≥ 30%** (the existing PRD-005 health gate) |

**Guardrail:** a topic that ships as a prose wall with no diagram is not done. Same bar as PRD-008 §9.

---

## 3. Solution

A new **Java Interview Kit** (`slug: java-interview-kit`) on the existing `Kit → Chapter → Topic`
hierarchy. **No schema changes, no new models, no new integrations.** Content is HTML in
`Topic.content`; diagrams are Cloudinary images in the existing `geeky-frontend/learn-content` folder.

### 3.1 Why "Core Java + Spring Boot" and not the alternatives

- **Core-Java-only (~40 topics, ₹199)** — cheaper and faster, but every free listicle covers the same
  surface. Nothing to differentiate on, and it fails the actual JD: Java roles screen for Spring.
- **Full backend mastery (20+ chapters — microservices, Kafka, Docker, deployment)** — 8+ weeks, and
  its last third **duplicates the Node.js kit's** scaling/deploy/observability chapters. Two kits
  teaching the same thing is a support and refund problem, not a bigger catalogue.
- **Core Java + Spring Boot** sits exactly where the hiring bar is: language depth (which the free
  material covers shallowly) plus framework depth (which it barely covers at all), stopping short of
  the infra chapters the Node and DevOps kits already own.

### 3.2 What's actually being built

1. **60–70 topics** authored to the §5 template (inherited from PRD-008, adapted for Java).
2. **A diagram set** (~110–140 images) uploaded via the existing `scripts/upload-images.js`.
3. **`scripts/seed-java-kit.js`** — mirrors `scripts/seed-angular-kit.js`: chapter data modules,
   `{{fig:…}}` marker resolution, first-tag validation, duplicate-slug validation, idempotent by slug.
4. **Catalog + storefront wiring** (§6) — the small, mandatory code diff.
5. **Quiz questions** per topic via `scripts/quiz-insert-authored.ts`.

---

## 4. Kit outline (14 chapters / 60–70 topics)

⭐ marks what interviewers lean on hardest. Ch 1 is the **free preview** — it must be the showcase.

**Ch 1 — Java Fundamentals** (`java-fundamentals`) — *free preview, strongest visual chapter*
JDK vs JRE vs JVM · compile → bytecode → execute pipeline · `main`, primitives vs references ·
⭐ stack vs heap memory model · pass-by-value (the trap everyone gets wrong)

**Ch 2 — OOP Deep Dive** (`oop-deep-dive`)
Classes/objects/constructors · ⭐ inheritance & method overriding vs overloading · abstraction:
abstract class vs interface (and default methods) · encapsulation & access modifiers ·
⭐ `equals()`/`hashCode()` contract · `static`, `final`, initialization order

**Ch 3 — Strings & Immutability** (`strings-immutability`)
⭐ why `String` is immutable · string pool & interning · `String` vs `StringBuilder` vs `StringBuffer` ·
wrapper classes, autoboxing & the Integer cache (`==` on 127 vs 128)

**Ch 4 — Collections Framework** (`collections-framework`) ⭐⭐ *heaviest interview chapter*
Collection hierarchy map · `ArrayList` vs `LinkedList` (with real complexity) · ⭐⭐ `HashMap`
internals: buckets, hashing, collision, treeification, resize · `LinkedHashMap` & `TreeMap` ·
`HashSet`/`TreeSet` · ⭐ `ConcurrentHashMap` vs `Hashtable` vs synchronized wrappers ·
fail-fast vs fail-safe iterators

**Ch 5 — Generics, Comparable & Sorting** (`generics-sorting`)
Generics & type erasure · bounded types, wildcards (PECS) · ⭐ `Comparable` vs `Comparator` · sorting
custom objects

**Ch 6 — Exceptions & Error Handling** (`exceptions`)
Hierarchy: `Throwable`/`Error`/`Exception` · ⭐ checked vs unchecked · try-catch-finally control flow
(and `finally` vs `return`) · try-with-resources · custom exceptions & best practices

**Ch 7 — Java 8+ Functional Java** (`functional-java`) ⭐⭐
Lambdas & functional interfaces · `Function`/`Predicate`/`Supplier`/`Consumer` · method references ·
⭐⭐ Streams: intermediate vs terminal, laziness · `map`/`filter`/`reduce`/`collect`/`groupingBy` ·
parallel streams (and when they hurt) · ⭐ `Optional` done right

**Ch 8 — Multithreading & Concurrency** (`concurrency`) ⭐⭐
Thread lifecycle · `Runnable`/`Callable`/`Future` · ⭐ `synchronized`, locks, `volatile` & the Java
Memory Model · ⭐ deadlock/livelock/starvation · `ExecutorService` & thread pools · `CompletableFuture` ·
`java.util.concurrent` collections & atomics

**Ch 9 — JVM Internals** (`jvm-internals`) ⭐ *senior filter*
Classloading & the delegation model · runtime memory areas · ⭐ garbage collection: generations,
Serial/Parallel/G1/ZGC · GC tuning & common flags · `OutOfMemoryError` vs `StackOverflowError` diagnosis

**Ch 10 — Modern Java (11 → 21)** (`modern-java`) — *differentiator; almost nothing free covers this*
`var`, text blocks · records · sealed classes · pattern matching & switch expressions ·
⭐ virtual threads (Project Loom) & what they change

**Ch 11 — Spring Core & Spring Boot** (`spring-core-boot`) ⭐ *the hiring reality*
IoC container & ⭐ dependency injection (constructor vs field, and why) · bean lifecycle & scopes ·
`@Component`/`@Service`/`@Repository`/`@Configuration` · ⭐ Spring Boot auto-configuration & starters ·
application properties/profiles · Spring MVC request flow (DispatcherServlet)

**Ch 12 — Spring Data, JPA & Hibernate** (`spring-data-jpa`) ⭐
ORM & entity mapping · repositories & derived queries · ⭐ lazy vs eager and the **N+1 problem** ·
entity lifecycle / persistence context & first-level cache · ⭐ `@Transactional`: propagation,
isolation, and why self-invocation silently does nothing

**Ch 13 — REST APIs, Security & Testing** (`rest-security-testing`)
REST controllers, validation, exception handling (`@ControllerAdvice`) · ⭐ Spring Security basics &
JWT auth flow · ⭐ JUnit 5 + Mockito · `@SpringBootTest` vs slice tests

**Ch 14 — Design Patterns & Java LLD** (`patterns-lld`)
SOLID in Java · Singleton (and its threading traps), Factory, Builder, Strategy, Observer ·
⭐ LLD walkthroughs (parking lot / BookMyShow-style) · Java-flavoured system design basics

> Chapter 1 is what a non-buyer sees. Confirm `resolveTopicAccess()` treats Ch 1 of
> `java-interview-kit` as the free chapter exactly as it does for other kits — never re-derive the
> rule (`lib/learn-access.ts` is the single source of truth).

---

## 5. Per-topic content template

Identical to PRD-008 §5 — kept verbatim so the catalogue reads as one product:

1. **Why it matters** — 2–3 lines: where it shows up in real code *and* in interviews.
2. **Concept, explained simply** — plain language first, then the precise definition.
3. **Visual** — a labelled diagram. Non-negotiable for concept topics.
4. **Code example** — minimal, commented, compilable Java.
5. **Under the hood** — the *why*.
6. **⭐ Interview lens** — literal questions, traps, crisp model answers.
7. **Cheat-card recap.**
8. **Self-check** — PRD-005 quiz.

**Image budget:** 1 diagram minimum per topic; 2–4 for heavy ones. Target **110–140 images**.

**Diagrams that carry the most weight:** JVM memory layout (stack/heap/metaspace) · pass-by-value
reference diagram · collection hierarchy map · ⭐ HashMap bucket → collision → treeify → resize
sequence · GC generational flow (young → survivor → old) · classloader delegation chain · thread
lifecycle state machine · deadlock resource graph · thread-pool task queue · stream pipeline
(lazy evaluation) · Spring bean lifecycle timeline · DispatcherServlet request flow ·
JPA entity state transitions (transient → managed → detached → removed) · N+1 query fan-out ·
JWT auth round-trip.

### 5.1 Java-specific constraint on quizzes

The `vm` verification gate (`lib/quiz/verify-output.ts`) is a **Node/JS sandbox — it cannot execute
Java.** Therefore:

- Java questions are `concept` type, or `predict-output` **verified by `peer` only**.
- **No Java question may ever be written with `verifiedBy: 'vm'`.** That would claim execution proof
  that never happened. Per CLAUDE.md, `'vm'` and `'peer'` are not interchangeable.
- `quiz-reverify.ts` must skip this kit (it re-grades by executing snippets) — confirm it filters by
  `verifiedBy`/kit before running it post-launch.

---

## 6. Code wiring checklist (small, but every item is mandatory)

| File | Change |
|---|---|
| `lib/appConstants.ts` | New `KIT_CATALOG['java-kit']` entry (₹299 / ₹2999, badge `NEW`, features). New `PLAN_TO_SLUGS` key `"Java Interview Preparation Kit": ["java-interview"]` — ⚠️ **`["java"]` is a live bug**, see §9. Add `java_kit_price` / `_original_price` / `_plan_name` to `appConstants()`. |
| `app/checkout/[kit]/page.tsx` | `java: 'java-kit'` in `SLUG_TO_KIT_ID` + a `kitsData` entry. |
| `components/pricing.tsx` | Card entry with `kitId: 'java-kit'`, gradient, features, `previewUrl: '/learn/java-interview-kit'`. |
| `components/product-showcase.tsx` | Showcase tile (`id: "java"`, `href: "/pay?kit=java-kit"`). |
| `components/kit-logo.tsx` | ⚠️ **Ordering hazard.** The existing `/javascript\|(^\|[^a-z])js([^a-z]\|$)/i` rule and a new Java rule must not cross-match. Add `{ test: /\bjava\b(?!script)/i, … }` **above** the JavaScript rule, and add a case to `npm run lint`-able unit coverage if one exists. Verify both "Java Interview Preparation Kit" and "JavaScript Interview Mastery Kit" still resolve correctly. |
| `components/dashboard/new-kits-banner.tsx` | Launch banner → `/pay?kit=java-kit`. |
| `app/dashboard/page.tsx` | `label.includes("java")` → `/pay?kit=java-kit` — **must be checked after / disambiguated from the JavaScript branch.** |
| `lib/topic-references.ts` | Optional curated article/video refs per topic; uncurated topics fall back to search links. |
| `public/Kit logos/` | `java.png` (or `.svg`). |
| `docs/CONTENT-MAP.md` | Regenerate after seeding. |

**Explicitly NOT changed:** `BUNDLE_SLUGS` / `"Complete Kit All Access Bundle"`. Java is standalone —
adding it would silently hand every past bundle buyer a kit they didn't pay for and invalidate the
bundle's ₹647 honest anchor. `BUNDLE_COMPONENT_PLANS` is derived, so leaving the bundle alone also
correctly keeps Java spend **out** of bundle-upgrade credit.

**Access-key rule (CLAUDE.md):** the `PLAN_TO_SLUGS` key is a brand-new string. Never reuse or rename
an existing key — those are access keys for people who already paid.

---

## 7. Scripts & assets

- `scripts/java-content/ch1..ch14.js` — one data module per chapter, `{{fig:file.svg|ALT|CAPTION}}`
  markers for diagrams.
- `scripts/seed-java-kit.js` — copy of `seed-angular-kit.js`. Kit meta: `name: 'Java Interview Kit'`,
  `slug: 'java-interview-kit'`, icon `☕`, `color: 'from-orange-500 to-amber-600'`,
  `order:` after DevOps. Dry-run by default; `--apply` writes; idempotent by slug; `--force` recreates.
- `java-diagrams/` → `node scripts/upload-images.js ./java-diagrams` → writes `java-diagrams/urls.json`.
- `scripts/quiz-insert-authored.ts` for quiz rows (see §5.1 constraint).

---

## 8. Scope

### Phase 0 — wiring + showcase chapter (~1 week)
- [ ] Catalog + storefront wiring (§6), including the kit-logo regex hazard
- [ ] `scripts/seed-java-kit.js` + `scripts/java-content/ch1.js`
- [ ] **Ch 1 fully authored** with diagrams — the free-preview showcase
- [ ] Confirm preview boundary: Ch 1 visible to non-buyers via `resolveTopicAccess()`

### Phase 1 — core Java (~2–3 weeks)
- [ ] Ch 2–10 authored, diagrams uploaded
- [ ] Quiz questions (`concept` / peer-verified `predict-output`) per topic

### Phase 2 — Spring (~1.5–2 weeks) — *the differentiator; do not cut this*
- [ ] Ch 11–14 authored with diagrams
- [ ] `docs/CONTENT-MAP.md` regenerated; launch campaign via `/admin/campaigns`

### Out of scope (deliberately)
- **In-browser Java execution / grading.** No JVM in the runtime; the `vm` gate is JS-only.
- Microservices, Kafka, Docker/K8s deployment — owned by the Node and DevOps kits.
- DSA in Java as a chapter set — the Frontend System Design kit's 180 DSA problems are JS; a Java DSA
  track is its own product, not a chapter.
- New content models, editor changes, or video hosting.

---

## 9. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Audience mismatch with a frontend-first list** | High | Don't forecast off React-kit ramp. Treat launch as market-entry: SEO/organic first, paid ads to a Java-intent audience, existing-list email as a bonus not the plan. Compare against DevOps. |
| Content volume (65 topics + ~130 diagrams) | High | Phase hard. Ch 1 ships complete and reviewed before scaling. Diagrams produced per-chapter, never batched to the end. |
| Spring chapters get cut under time pressure | High | They are the differentiator. If time runs out, ship **fewer core-Java topics**, not fewer Spring chapters. |
| **`java` / `javascript` string collision — access leak** | **Blocker if missed** | `resolveTopicAccess()` matches `kitSlug.toLowerCase().includes(fragment)` (`lib/learn-access.ts:82`). `"javascript-interview-kit".includes("java")` is **true**, so a `["java"]` fragment would grant every Java buyer the JavaScript kit for free. **The fragment MUST be `["java-interview"]`.** (The reverse is safe: `"java-interview-kit".includes("javascript")` is false.) Add a test asserting a Java-only buyer is denied `javascript-interview-kit`. Apply the same care to every regex/`includes()` in §6 — kit-logo, dashboard label routing, checkout slug map. |
| A Java quiz row claiming `verifiedBy: 'vm'` | Medium | §5.1. Add a guard in `quiz-insert-authored.ts` rejecting `vm` for non-JS kits. |
| Java version drift (17 vs 21 LTS) | Low | Teach **Java 17 LTS as the baseline**, flag 21 additions (virtual threads) explicitly, note legacy 8 equivalents where interviewers still ask. |

---

## 10. Open questions

1. **Diagram production**: hand-authored SVG (as with Angular) or generated? ~130 images is the
   schedule's critical path.
2. **Launch price**: ₹299 matches Node/System Design. Is a ₹249 entry price worth testing given the
   audience is new and has no trust in the brand yet?
3. **Company question bank**: should Java questions be cross-linked into the existing company banks
   (`app/api/companies`), and do those banks have Java entries today?
4. **Ads**: does a Java audience need its own Meta campaign/creative, or does the existing
   developer-interest targeting cover it?
