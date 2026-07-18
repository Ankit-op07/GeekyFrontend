# Geeky Frontend

A Next.js (App Router) coding-education platform: learning kits, interview prep, company-specific
question banks, and paid access via Razorpay. MongoDB (mongoose) backend, custom session-cookie auth.

## Code review (MANDATORY)
Before EVERY `git commit`, `git push`, or deploy/publish, you MUST perform a senior-FAANG-engineer
self code review of the pending diff following the protocol in `CODE_REVIEW.md`. Do not commit or
publish until all Blocker/High findings are fixed. Applies to all changes, including quick fixes —
no exceptions unless the user explicitly says "skip review".

## Commands
- `npm run dev` — start dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — Next.js lint

## Architecture

- **Routes**: `app/` (App Router). Public marketing pages at the root (`app/page.tsx`, `contact`,
  `pricing` sections in `components/`), authenticated areas under `app/dashboard`, `app/learn`,
  `app/admin`. Checkout flows are split by product: `app/checkout/[kit]`, `app/company-wise-kit/checkout`, `app/pay`.
- **API**: `app/api/*` — one folder per resource (`admin`, `auth`, `companies`, `company-kit`,
  `payment`, `learn`, `questions`, `user`, `interviews`, `leaderboard`, `conversion`). Admin-only
  endpoints live under `app/api/admin/*` and expect an admin session.
- **Auth**: custom HMAC-signed session cookie (`gf_session`), not a full NextAuth session despite
  `next-auth` being a dependency — see `lib/session.ts` (`createSessionToken` / `verifySessionToken`).
  Also has Google OAuth (`app/api/auth/google`) and OTP-based email flows (`send-otp`/`verify-otp`).
- **DB**: MongoDB via mongoose. Connection helper is `lib/db.ts` → `connectToDatabase()` — this is
  called from nearly every API route; if DB-related bugs show up in multiple routes, check here first.
  Models live in `lib/models/` (`Kit`, `Chapter`, `Topic`, `Question`, `Company`, `CompanyKitUser`,
  `Order`, `InterviewRequest`).
- **Payments**: Razorpay integration — `app/api/payment/*` (create-order, verify, webhook) and a
  parallel `app/api/company-kit/*` flow for the company-specific kit product. `hooks/use-razorpay.ts`
  wraps the client-side checkout widget.
- **UI**: shadcn/ui (`components/ui/*`, "new-york" style, Tailwind, `@/` path aliases — see
  `components.json`). Don't hand-roll primitives that already exist in `components/ui/`; compose them.
  `cn()` in `lib/utils.ts` (clsx + tailwind-merge) is used almost everywhere for conditional classNames.
- **Constants/config**: `lib/appConstants.ts` centralizes shared constants — check here before adding
  a new magic string/config value.
- **Analytics**: `lib/meta-pixel.ts` (Meta/Facebook Pixel), env-driven (`PIXEL_ID`, `META_ACCESS_TOKEN`).

## Conventions
- Path alias `@/` maps to repo root (see `components.json` aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`).
- API routes follow REST-ish verbs per route file (`GET`/`POST`/etc. exported from `route.ts`).
- Kit-specific content (JS, React, Node.js, placement, etc.) is keyed by folder IDs in `.env`
  (`*_KIT_FOLDER_ID`) — these tie into Google Drive/service-account integration (`GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_PRIVATE_KEY`) and Cloudinary for media (`CLOUDINARY_*`).
- Email sending via nodemailer (`EMAIL_USER`/`EMAIL_PASS`), used for OTP, admin notifications, reminders.

## Theming (PRD-006 — Learn reader + Dashboard)
- The **Learn reader** (`app/learn/**`) and the **Dashboard** (`app/dashboard/**`) are light/dark
  themed. `next-themes` is mounted **per-subtree** in `app/learn/layout.tsx` and
  `app/dashboard/layout.tsx` (NOT the root layout — mounting it globally with a `usePathname()`-based
  wrapper breaks styled-jsx SSR sitewide). Checkout, marketing, and admin are intentionally
  single-theme until their own phase. The stored preference is shared across reader + dashboard.
- The **dashboard** uses the **global semantic tokens** (`bg-background`, `bg-card`, `bg-muted`,
  `text-foreground`, `text-muted-foreground`, `border-border`) plus glass-overlay tokens
  (`bg-overlay`, `bg-overlay-strong`, `border-hairline`, `divide-hairline`) for the translucent
  layers. Saturated brand accents (violet/emerald/cyan/amber gradients, `text-white` on coloured
  buttons/icons) stay literal. Light-shade accent **text** (`text-violet-400` etc.) carries a
  `dark:` variant so it keeps contrast on light surfaces (e.g. `text-violet-700 dark:text-violet-400`).
- Inside `app/learn/**` and reader components, use the **reader tokens** (`bg-reader-surface`,
  `text-reader-heading`, `text-reader-muted`, `text-reader-faint`, `border-reader-border`,
  `text-reader-accent`, `bg-reader-code`, …) defined in `app/globals.css`. Do **not** add raw
  colour classes (`bg-white`, `text-slate-*`, `bg-[#0a0a0f]`) there — they won't respond to the
  toggle. Saturated brand accents on solid/gradient buttons (`text-white` on violet/amber) and the
  `bg-black/60` scrim are the only allowed exceptions.
- Code blocks are theme-aware: `atom-one-dark.css` is the dark default; light overrides live in
  `globals.css` (`:root:not(.dark) .hljs-*`).
- Global semantic tokens (`--foreground`, `--muted-foreground`, `--card`, …) were contrast-fixed to
  pass WCAG AA in both themes — keep new pairs AA-compliant.

## Content — read `docs/CONTENT-MAP.md` first
Before answering anything about what the kits teach ("is there a topic on X?", "would an exercise fit
here?", "how big is the React kit?"), read **`docs/CONTENT-MAP.md`**. It is a generated inventory of
all 4 kits / 39 chapters / 146 topics with a one-line summary of every lesson — ~12k tokens, versus
~425k tokens for the lessons themselves. Only open a topic's actual `content` when you need exact
wording or code, and then read that one topic rather than sweeping the collection.

Two facts from it that change decisions, so they are repeated here: **only ~6% of the catalogue is
runnable plain JS** (React/Node/HTML lessons cannot be graded by executing a snippet — that is the
content, not a tooling gap), and **`nodejs-backend-kit` is a stub** (6 topics, ~800 chars each).

## Quiz (PRD-005 Phase 0 — end-of-topic self-check)

An MCQ renders at the foot of each topic in the Learn reader (`components/learn/topic-quiz.tsx`).
The answer key never reaches the browser: `/api/quiz/questions` strips it, `/api/quiz/attempt`
grades server-side. Phase 0 has **no code execution on the learner side** — it exists only to
measure whether learners want to practise (the ≥30% attempt-rate gate).

- **Access**: any surface over topic content MUST gate through `resolveTopicAccess()`
  (`lib/learn-access.ts`) — never re-derive the rule. It is the single source of truth for
  "purchased → any topic; preview → first chapter only", and it returns `hasFullAccess` so callers
  can record buyer-vs-preview. The quiz APIs originally checked only for a session and leaked paid
  questions to free signups; that is the mistake this helper exists to prevent.
- **Two question types** (`lib/models/QuizQuestion.ts`, PRD §3 Seam 2 — adding a type is additive):
  `predict-output` (a runnable JS snippet) and `concept` (prose from the lesson, `code` is `""`).
  Only ~10-20 of 146 topics are runnable-JS; the catalogue is overwhelmingly `concept`.
- **`verified` is not one thing** — check `verifiedBy`. `'vm'` means the snippet was *executed* and
  its real output matched the key (proof). `'peer'` means a second author answered it blind from the
  lesson and agreed (corroboration, not proof). Don't collapse them.
- **The `vm` gate** (`lib/quiz/verify-output.ts`) has two non-obvious constraints. Errors thrown
  inside a `vm` context belong to *that realm*, so `e instanceof Error` is **false** — read `.name`
  directly. And **never pass host intrinsics** (`Object`, `Array`, `Promise`…) into the sandbox:
  a contextified object has its own realm-native ones, and injecting ours shadows them, making
  `({}) instanceof Object` false inside the gate. Both bugs shipped, and between them blinded the
  gate to every error and prototype question. `npm run test:quiz` pins both.
- **Publication rule**: a `mismatch` verdict (execution *disproved* the answer) can never go live —
  `/api/admin/content/questions` refuses it with a 409. `inconclusive` is a human call.
- **Scripts** (dry-run by default, `--apply` to write, run with `node --experimental-strip-types`):
  `quiz-insert-authored.ts` (the only writer of authored questions; decides live-vs-draft),
  `quiz-reverify.ts` (re-grade everything after a gate change), `quiz-archive-wallpaper.ts`.
- **Seeding is a bootstrap, not a content source.** `getQuestionsForTopic()` matches title+slug
  **only** — never lesson body text. It once matched full content, which fanned 8 questions into 186
  near-duplicate live rows across 62 topics. The seed route also skips any topic that already has
  questions.
- **The metric**: `/api/admin/quiz/metrics` + the panel on `/admin/quiz`. The buyer attempt rate is
  real; the **preview rate is not computable** — `app/api/learn/.../[topicSlug]` only writes
  `lastActiveDate` when `hasAccess` is true, so non-buyers leave no activity record and there is no
  denominator. PRD §15 says that is the population the gate actually depends on, so treat the buyer
  rate as health, not go/no-go, until a preview-side activity signal exists.

## Known weak spots (from graphify analysis — see `graphify-out/GRAPH_REPORT.md`)
- `Dashboard Page` and `Ui Sidebar` communities have low cohesion (~0.05) — their pieces are loosely
  related; if touching dashboard code, don't assume nodes in the same community are actually coupled.
- Several nodes (`courses`, `Kit`, `GRADIENT_OPTIONS`) are weakly connected to the rest of the graph —
  possibly dead code or under-linked; verify usage before assuming they're load-bearing.

## Knowledge graph
This repo has a graphify-built knowledge graph in `graphify-out/` (`graph.json`, `graph.html`,
`GRAPH_REPORT.md`). For "how does X connect to Y" or "what calls Z" questions, prefer
`/graphify query "<question>"` over manual grep/exploration — rebuild with `/graphify . --update`
after significant changes.
