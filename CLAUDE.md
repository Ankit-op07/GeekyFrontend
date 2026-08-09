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
- **⚠️ `QuizAttempt`'s "unique" index was not unique until 2026-08-05.** The schema declared
  `.index({userId,questionId},{unique:true})`, but a non-unique index of that shape existed first and
  **Mongoose's autoIndex never upgrades an index in place** — it saw the name taken and silently kept
  the old one, for months. 163 duplicate rows accumulated over 150 pairs, many reading
  `correct: [false, true]`: someone re-answering after the UI revealed the key, which is exactly the
  blindness the index was meant to prevent in the PRD-005 §9 pass-rate flagging. Repaired with
  `npm run fix:quiz-attempts -- --apply` (dry-run by default; it **deletes** rows) — duplicates
  removed, index rebuilt, verified rejecting with E11000. **General lesson, and the reason the
  leaderboard still de-duplicates in its own `$group`: a declared index constraint is a request, not
  a guarantee — check `.indexes()` before building on one, and again after changing one.**
- **The metric**: `/api/admin/quiz/metrics` + the panel on `/admin/quiz`. The buyer attempt rate is
  real; the **preview rate is not computable** — `app/api/learn/.../[topicSlug]` only writes
  `lastActiveDate` when `hasAccess` is true, so non-buyers leave no activity record and there is no
  denominator. PRD §15 says that is the population the gate actually depends on, so treat the buyer
  rate as health, not go/no-go, until a preview-side activity signal exists.

## Membership (time-limited whole-platform access)

₹499/1mo, ₹1499/6mo, ₹2499/1yr (`MEMBERSHIP_PLANS`, `lib/membership.ts`). Grants **every kit** plus
the three gated features: **DSA tracker, Contests planning, Job board**.

- **Not a nav tab, on purpose.** Nobody clicks "Membership" in a sidebar to learn what a membership
  is. It appears where the buying decision happens: `MembershipShowcase` on the homepage above the kit
  grid, and `MembershipBanner` at the top of the dashboard Overview + above the Kits grid. For an
  active member the banner flips from pitch to status ("active until X"), which is why losing the tab
  costs nothing — the expiry is on the page they already land on.
- **The ladder must get cheaper per month as it gets longer**, or the longer tier has nothing to sell.
  ₹499 → ₹250/mo → ₹208/mo. It briefly did not (₹2999/yr was the same ₹250/mo as the 6-month, so it
  cost twice as much for no better rate); `npm run test:membership` now pins the invariant.
- **Prices are fetched from `/api/membership/status`, never inlined in a page.** A hardcoded price on
  a marketing page is the bug where a visitor reads one number and is charged another.
- **Renewal reminders** (`lib/membership-reminders.ts`) go out at **7 and 1 days** before expiry, and
  ride the **contests cron** — Hobby allows exactly 2 crons and both are spent, and a third does not
  fail at runtime, it **rejects the deployment**. Claims are keyed `"<expiryMs>:<days>"` on
  `membershipRemindersSent`, so renewing moves the expiry, invalidates every key and re-arms the next
  term's reminders with no cleanup job. Claim-before-send, so a crash loses a reminder rather than
  double-mailing.

- **A membership is NOT a kit, and must never enter `purchasedKits`.** That array is permanent —
  `getAllowedSlugs()` has no concept of time — so a membership name written there grants the whole
  catalogue forever and cannot be told apart from a real lifetime buyer afterwards. `recordPurchase()`
  refuses membership plan names outright; the guard is at the **writer** because `/api/payment/verify`
  takes `planName` from the request body. `npm run test:membership` pins it.
- **⚠️ Do NOT reuse `subscriptionStatus` / `subscriptionEndDate`.** They look exactly right and are a
  trap: `recordPurchase()` sets `subscriptionStatus: 'active'` on every kit purchase (7 write sites),
  so **every past buyer already reads as an active subscriber** — gating on it hands the entire
  customer base free membership. `subscriptionEndDate` is written and read nowhere. Membership uses
  `membershipExpiresAt`; active means *set and in the future*, so lapsing needs no cron.
- **Renewals STACK, they do not reset** (`computeMembershipExpiry`) — an early renewal extends from
  the existing expiry, so nobody loses days they paid for. Once lapsed, the term starts from today.
  `addMonths()` clamps (31 Jan + 1mo = 28 Feb), because plain `setMonth(+1)` rolls to 2–3 March and
  silently skips a month.
- **`grantMembership()` claims the `Membership` ledger row BEFORE extending the expiry.** `orderId` is
  unique, so a Razorpay webhook retry — or the client verify racing the webhook, which both call it —
  is a no-op instead of a free extra term. Extending first would make every retry a free month, and
  the bug would be invisible because the numbers would just be generous.
- **Access is one line in `resolveKitAccess`** (`lib/learn-access.ts`), OR'd with the purchase check so
  a lapsed member falls back to the kits they bought, never below. **Feature gating is
  `resolveFeatureAccess()`** (`lib/feature-access.ts`), enforced in the API routes — `/api/jobs`,
  `/api/contests/plans`, DSA tracker writes. Hiding a tab hides a link, not an endpoint.
- **What stays free, deliberately**: the `/dsa/**` approach pages (155 indexed pages — the funnel that
  sells the membership) and `/api/contests` (a public contest calendar; charging for a copy of public
  information is indefensible). Gated: the tracker, planning, reminders, the board.
- **Lapsing never deletes anything** — notes, lists, solved ticks and saved jobs survive and return on
  renewal. Contest reminders check membership at *send* time, since it can lapse between planning and
  the morning of.
- **`GRANDFATHER_EXISTING_BUYERS = false`** per spec. Flipping it to `true` is one line and keeps
  existing kit buyers on the three features — worth knowing when the refund emails arrive.
- **Existing kit buyers keep their kits permanently** and are unaffected by any of this — verified
  against 400 real buyer rows: every stored plan name still maps to slugs, and `resolveKitAccess`
  returns `hasFullAccess` for them with no membership. Membership is additive; it never replaces a
  purchase. What they DO lose without a membership is the three gated features — see
  `GRANDFATHER_EXISTING_BUYERS` above.

## Coupons & offers (discount codes, bonuses, cross-sell)

Discount campaigns live alongside the upgrade-credit system. **One order of operations**, and it is
the thing to get right:

```
listPrice − upgrade credit = payableBeforeCoupon − coupon discount = payable
```

- **The client sends a CODE, never an amount.** `computeUpgradePrice()` (`lib/pricing.ts`) is still
  the only place a payable is computed; it now takes `{ couponCode, buyerEmail }` and re-derives the
  discount from the `Coupon` row on every call, including inside `create-order`. `/api/payment/quote`,
  `/api/coupons/validate` and `/api/payment/offers` are **display only**.
- **A percent coupon applies to `payableBeforeCoupon`, not `listPrice`.** Off the list price, a 50%
  code on the ₹499 bundle for a buyer with ₹350 credit would take ₹249 off a ₹149 bill. `MIN_PAYABLE`
  (₹49, `lib/coupon-math.ts`) floors the result — Razorpay rejects sub-₹1 orders, and free access is
  supposed to go through `/admin/access`, not the payment gateway. `npm run test:coupons` pins both.
- **Two different emails, on purpose.** Upgrade *credit* is keyed to the **signed session** email
  (money already spent — naming someone else's email must not spend their history). *Coupon*
  eligibility is keyed to the **buyer** email, session or typed into guest checkout, because guest
  checkout is the primary purchase path. With no email yet, per-buyer rules are skipped and the
  result is marked `provisional`; `create-order` re-checks before charging.
- **The buyer always gets the deeper of (typed code, best auto-apply offer).** A refused or shallower
  typed code never raises a bill that already had an offer on it.
- **`recordRedemption()` (`lib/coupons.ts`) is the ONLY writer of coupon counters**, called only from
  the Razorpay **webhook** — the same reasoning as the onboarding email: it is the delivery that
  survives a closed tab, so exactly one place owns the write. Idempotency is the unique index on
  `CouponRedemption.orderId`; the global cap is claimed atomically with `$expr`. A capped coupon that
  loses a race is honoured and flagged `overLimit` — never fail a buyer whose money is already taken.
- **Bonuses are displayed value, not entitlements.** Everything in `BONUS_CATALOG` (`lib/offers.ts`)
  must be a feature the platform really ships; remove the bonus in the same commit as the feature.
- Admin: `/admin/coupons`. Counters are not editable there — a coupon's numbers always come from
  captured payments. Codes are immutable once created (redemptions, orders and Razorpay notes all
  reference them by code); retire and recreate instead.

## Bulk access + email campaigns (`/admin/campaigns`)

For rolling a kit out to every past buyer when the list is bigger than one day's Gmail allowance
(~400-500). `EmailCampaign` holds the settings; **`CampaignRecipient` is one row per (campaign,
email) and is the only source of truth for who has been emailed.**

- **Why not `/admin/kit-onboarding`.** That screen infers "still needs an email" from *has the user
  set a password* + *were they mailed in the last 2 days*. Both are proxies: a buyer who never clicks
  is re-mailed every third day, and its `limit` without a ledger re-slices the **same** first N
  buyers every run. The ledger exists so "send the next 400" means the next 400 never sent to.
- **⚠️ The two screens don't share state.** Sends from `/admin/kit-onboarding` write no
  `CampaignRecipient` rows, so they neither count against the campaign's daily cap nor mark anyone
  done. Don't run both against the same kit.
- **Claiming is atomic** — `findOneAndUpdate({status:'pending'} → 'sending')`. That, plus the unique
  `(campaignId, email)` index, is what makes a double-click or two open tabs safe. Rows stranded in
  `sending` by a killed request are requeued after 30 min (a possible duplicate beats a silent drop).
- **The daily cap is counted across ALL campaigns** (`sentAt >= startOfIstDay()`) because the quota
  belongs to the Gmail account, not the campaign. Test sends deliberately bypass the ledger, so they
  consume real quota **without** being counted — keep them to a handful.
- **`grantPlanName` must be a key of `PLAN_TO_SLUGS`**, else the grant writes a string
  `getAllowedSlugs()` maps to nothing: access looks granted in the DB, learner still locked out. The
  create endpoint rejects unknown names for this reason.
- **Access is granted before the email is sent**, so a bounce never costs someone content they paid
  for; a retry only re-sends the mail.
- Two bodies (`lib/email/kit-emails.ts`), chosen per recipient **at send time**: users who already
  have a password get "your kit is live, log in"; everyone else gets the set-password onboarding
  mail. Sending a set-password link to someone who logs in fine reads as a phish.
- Batches are 25 per HTTP request, driven in a loop by the client — a serverless function cannot
  hold hundreds of SMTP sends open. Closing the tab loses nothing.

## Job board (dashboard `?tab=jobs`) — INDIA ONLY

Aggregates Indian developer openings from ~55 upstreams into one deduplicated list. `lib/jobs/` is the
whole pipeline; `components/dashboard/jobs-tab.tsx` is the UI; `Job` (`lib/models/Job.ts`) is a
**cache**, not authored data — it can always be rebuilt by re-running an ingest.

- **The unique key is `fingerprint`, not `sourceId`.** company+title+locality, so the same opening
  carried by RemoteOK, Remotive AND the company's Greenhouse board is ONE row. `sourceIds`/`sources`
  accumulate every feed it appeared in; `sourceCount` is the last run's count and backs the
  "most relevant" sort (corroboration, not text score).
- **Rows expire.** Feeds never say a job closed, it just stops appearing. Every refresh pushes
  `expiresAt` forward; a TTL index deletes anything refreshes stop finding. Saved jobs are therefore
  a **denormalized snapshot** on `CompanyKitUser.savedJobs` — a reference would empty itself.
- **A source failing must not fail the run.** `ingestJobs()` wraps every adapter and returns a
  per-source `SourceResult[]`. That report is the ONLY way to notice an ATS board slug has gone
  stale — `doordash` and `netflix` both 404'd in the first draft. Admin/cron see it in the refresh
  response; learners don't.
- **Classification never reads the job description.** `detectCategory()` uses the title, then the
  source's own tags. An earlier version fell back to the description and, over ~1,300 real listings,
  called 227 roles "devops" because the opening paragraph said "infrastructure". A wrong category is
  worse than `other` — it makes the filter untrustworthy. Same reason `isEngineeringRole()` matches
  titles only.
- **`isStartup` is a per-company judgement**, set on the ATS board config (`sources/ats.ts`) plus
  every HN Who-is-hiring row. Flagging all ATS rows made 94% of the board a "startup".
- **Adding sources is additive**: write an adapter returning `RawJob[]`, register it in
  `buildAdapters()`. Never derive category/level/tags/fingerprint in an adapter — `normalizeJob()`
  owns all of it, or two adapters classify the same job differently and dedupe breaks.
- **India-only is enforced in THREE places, and all three are needed.** `isIndianJob` in `ingest.ts`
  (nothing non-Indian is written), a hard `countryCode: 'IN'` in `buildJobFilter` (nothing non-Indian
  is *served*, whatever is in the collection), and a `deleteMany` purge at the end of each ingest.
  The write-path gate alone shipped a visibly broken board: it could not touch the thousands of
  US/EU rows already stored from before the board went India-only, and TTL would have taken three
  weeks to clear them. **A gate on writes is not enough when the store outlives the rule.** A job
  is Indian only if its own location resolves to India (`countryCode === 'IN'`). Rejected alternatives:
  "keep anything from an Indian employer" would keep Freshworks' San Mateo and London reqs (24 of
  their 49); "keep generic Remote too" would re-admit ~590 location-less remote roles that are
  US-only in practice. `detectCountry`'s India pattern is therefore the widest of any country and
  includes state names — SmartRecruiters emits "Hyderabad, TG" with no country token.
- **Location filtering is by CITY, not country** (`detectIndianCity`) — country is a settled question
  on this board. Delhi NCR deliberately merges Gurgaon/Gurugram/Noida/Faridabad: one commutable job
  market, and four chips would hide roles from candidates who'd take them.
- **Sources are kept or dropped on measured India yield.** RemoteOK, Arbeitnow, Remotive and Jobicy
  were all removed at 0 Indian jobs each (Jobicy has no India geo at all — its widest Asian filter,
  `geo=apac`, returned 50 roles and 0 mentioning India). Only Himalayas and HN Who-is-hiring remain
  from the remote aggregators. Re-measure before adding one back.
- **Indian jobs come from the employers' ATS, not from job portals.** Naukri, Instahyre, Cutshort,
  Wellfound and LinkedIn have no free public API and scraping them breaks their terms — but the
  Indian employers behind those listings post to Greenhouse/Lever/Ashby/SmartRecruiters, and those
  boards are open JSON. `SEED_BOARDS` carries ~51 Indian and India-office employers (Paytm, PhonePe,
  Swiggy, Meesho, Zeta, CRED, Fi Money, Groww, Freshworks, Tekion, HackerRank, plus Databricks /
  MongoDB / Zscaler / Twilio for their Bengaluru and Pune reqs).
- **⚠️ Verify a new board by its INDIA JOB COUNT, not by an HTTP 200.** An earlier list was built on
  "the slug responds" and shipped three wrong companies: `greenhouse:slice` is a US/Macedonia firm
  (not the Indian fintech), `ashby:navi` is San Francisco, `ashby:bounce` is Portuguese. All three
  answered perfectly. Fetch the board and count postings whose location is Indian.
- **The board is senior-heavy and that is the sources, not a bug.** Measured: 428 India-only jobs
  across 46 companies (263 Bengaluru, 46 Delhi NCR, 43 Remote, 24 Hyderabad), of which ~6 are
  fresher/internship. Indian entry-level hiring happens on Naukri / Internshala / campus portals,
  none of which have an API. Adzuna keys are the only lever that moves this number.
- **The tracker is the same list as the shortlist.** `CompanyKitUser.savedJobs` gained `status`
  (`saved → applied → interviewing → offer → rejected`), `appliedAt` and `notes`. Clicking Apply
  files a job under `applied` — a job already past `saved` is never demoted. `appliedAt` is written
  with **`$min`, never `$set`**, so walking a row through later stages can't rewrite the day you
  actually applied; for that to work the field must be ABSENT (not null) until first applied, since
  `$min` will not overwrite a stored null.
- **The UI never names a source.** Which upstream a listing came from is plumbing; `sources` is not
  returned by `/api/jobs` at all, so the client cannot display it even by accident. The "confirm on
  the employer's careers page" caution stays — that is about a listing we did not author, and it
  doesn't require naming our feeds.
- **Ops**: `POST|GET /api/jobs/refresh` needs `CRON_SECRET` (Vercel cron sends it as a bearer token;
  without the env var the cron silently 403s). Optional keys `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` and
  `RAPIDAPI_KEY` add the **Indian on-site market** — every key-free source is remote-first and
  Western-skewed. Extra ATS boards via `JOB_ATS_BOARDS="greenhouse:acme,ashby:beta"`.

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
