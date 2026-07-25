# PRD-007 — Interview Tracker: Job Application & Interview Management

| | |
|---|---|
| **Owner** | Ankit |
| **Status** | Proposed |
| **Appetite** | 2–3 weeks (medium) — phased; Phase 0 ships in ~1 week |
| **Primary goal** | Retention & daily-active habit + platform differentiation |
| **Pricing** | **Free feature** for every signed-in user (no paywall, no credits) |
| **Depends on** | Existing auth (`gf_session` / `CompanyKitUser`), Company question banks, Kits/Topics, dashboard theming (PRD-006) |
| **Replaces** | The old mock-interview *request* flow (`InterviewRequest`, `/api/interviews`, `/admin/interviews`) — see §11 |
| **Date** | 2026-07-18 |

---

## 1. Problem

**A learner preps for interviews here, then leaves to manage the actual job hunt somewhere else** —
a spreadsheet, Notion, sticky notes, or a paid tool like Huntr / Teal / Simplify.

That is a leak in the exact place we are strongest. We already own the *preparation* half of a
candidate's life: kits, company-specific question banks, topic reading, quizzes, streaks. But the
moment prep turns into a real pipeline — "I applied to Google, the OA is Thursday, the React round
is next week" — we have nothing. The user context-switches away, and every switch is a chance to
not come back.

Concretely, a job-seeking developer today has to track, outside our platform:

- **Which companies they've applied to** (role, job URL, JD, salary, location, source, date).
- **What stage each application is in** (applied → OA → interviewing → offer → rejected).
- **Their *next interviews*** — the single most time-sensitive thing in a job hunt, and the thing a
  spreadsheet is worst at surfacing.
- **What to revise before each round** — and *this is the part only we can solve*: if their React
  interview at Company X is Thursday, the React kit and Company X's question bank are already sitting
  in this same product.

**The strategic point:** a job tracker is a *daily-return* surface. Prep is bursty (you grind, then
stop); a live pipeline with upcoming interviews is something a user opens every day until they're
hired. It converts a one-time kit buyer into a habitual returning user — and a returning user is who
buys the *next* kit, renews interest, and refers a friend.

---

## 2. Goal & success metrics

| Metric | Baseline | Target (60 days post-launch) |
|---|---|---|
| **Tracker adoption** — signed-in users who add ≥1 application | 0 | **≥ 25%** |
| **Weekly returning users** among tracker adopters | measure | **materially > non-adopters** |
| **Interviews tracked** with a future `scheduledAt` | 0 | growing week-over-week |
| **Prep-link CTR** — clicks from an upcoming interview → a kit topic or company question bank | 0 | **≥ 20%** of tracked interviews (this is the integration value; if it's ~0 the feature is just a spreadsheet) |
| Kit purchase rate among tracker users vs. non-users | measure | **≥** non-users (retention → LTV) |

**Guardrail:** it must not become a data-entry chore. If median applications-per-active-user stalls
at 1, the add flow is too heavy — cut fields, don't add them (§9).

---

## 3. Solution

A personal, private **Interview Tracker** living under `app/dashboard/tracker`, themed light/dark per
PRD-006. Three surfaces over two new collections, plus the one thing a generic tracker can't do:
deep links into our own prep content.

### 3.1 The two objects

**`Application`** — one company/role you're pursuing.
**`InterviewEvent`** — one round under an application (the "next interviews"). Kept as its own
collection, *not* a sub-array, so "all my upcoming interviews across every application" and the
reminder cron are single indexed queries rather than a scan-and-flatten.

```ts
// lib/models/Application.ts
type AppStatus =
  | 'wishlist'      // saved, not applied yet
  | 'applied'
  | 'oa'            // online assessment / take-home in progress
  | 'interviewing'  // at least one live round scheduled/done
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted';      // no response, user gave up

interface IApplication {
  userId: ObjectId;            // CompanyKitUser — owner, indexed
  companyName: string;         // free text, always present
  companyId?: ObjectId;        // OPTIONAL link to our Company model → unlocks question-bank prep
  role: string;                // "Frontend Engineer II"
  jobUrl?: string;
  jobDescription?: string;     // pasted JD, optional
  location?: string;
  workMode?: 'remote' | 'onsite' | 'hybrid';
  salaryRange?: string;        // free text — "₹28–34 LPA" / "$140k"
  source?: string;             // LinkedIn, referral, company site, Naukri…
  status: AppStatus;           // drives the board column
  appliedDate?: Date;
  priority?: 'low' | 'med' | 'high';
  contacts?: { name: string; role?: string; email?: string; linkedin?: string }[];
  notes?: string;
  tags?: string[];
  archivedAt?: Date;           // soft-close without deleting history
  // timestamps
}
```

```ts
// lib/models/InterviewEvent.ts
type RoundType =
  | 'recruiter_screen' | 'online_assessment' | 'technical'
  | 'system_design' | 'behavioral' | 'hiring_manager' | 'hr' | 'final' | 'other';

type EventStatus =
  | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  | 'passed' | 'failed' | 'awaiting_result';

interface IInterviewEvent {
  userId: ObjectId;            // denormalized from Application for cheap cross-app queries
  applicationId: ObjectId;
  roundType: RoundType;
  title?: string;              // "DSA round with hiring manager"
  scheduledAt: Date;           // the load-bearing field — indexed
  durationMinutes?: number;
  mode?: 'video' | 'phone' | 'onsite';
  meetingLink?: string;
  location?: string;
  interviewers?: string[];     // names, optional
  status: EventStatus;
  prep?: {                     // §3.4 — the integration payload
    kitTopicSlugs?: { kitSlug: string; topicSlug: string }[];
    companyId?: ObjectId;      // resolves to our question bank
  };
  debrief?: string;            // "asked about closures + a debounce impl"
  outcome?: string;
  reminderSentAt?: Date;       // set by the cron so we never double-send
  // timestamps
}
```

Indexes: `Application { userId, status }`, `Application { userId, updatedAt: -1 }`;
`InterviewEvent { userId, scheduledAt: 1 }`, `InterviewEvent { applicationId, scheduledAt: 1 }`,
`InterviewEvent { status, scheduledAt: 1 }` (for the reminder cron).

### 3.2 Surface 1 — the pipeline board (primary)

A Kanban board at `/dashboard/tracker`, one column per status (`Wishlist · Applied · OA ·
Interviewing · Offer · Closed`). Drag a card to change status. This is the home screen of the
feature — a developer's whole hunt on one glance. A list/table view is the same data for people who
prefer density (sort by date, filter by status/tag/company).

Add-application is a **single fast modal**: company, role, URL, status. Everything else (JD, salary,
contacts, notes) is progressive — filled in later on the detail page, never required up front (§9).

### 3.3 Surface 2 — Next Interviews (the killer view)

A dedicated **upcoming-interviews** panel — also pinned to the main dashboard so it's visible without
navigating — showing every `InterviewEvent` with `scheduledAt >= now`, soonest first, grouped
*Today / This week / Later*. Each card shows company, role, round type, countdown, meeting link, and
a **"Prep for this"** button (§3.4). This is the reason the tool earns a daily open.

Optional month calendar view over the same events — nice-to-have, Phase 1.

### 3.4 Surface 3 — the integration nobody else has: "Prep for this interview"

This is the whole reason the tracker lives *inside* Geeky Frontend instead of being a spreadsheet.

When a user opens an upcoming interview, we offer targeted prep drawn from content **they may already
own**:

1. **Company question bank.** If the `Application` is linked to a platform `Company` (`companyId`),
   surface that company's question set from the existing `/api/companies/[id]/questions`. "Amazon
   interview Thursday → here are the Amazon questions in our bank." Company linking is a typeahead in
   the add/edit form backed by `GET /api/companies`; unmatched company names just stay free text.
2. **Relevant kit topics.** Map `roundType` → kit content: `system_design` → System Design Kit,
   `technical` on a React role → React kit closures/hooks topics, etc. We reuse the existing
   **resume-at-last-topic deep links** (shipped 5e31582) so "Prep for this" drops them straight into
   the reader at the right topic.
3. **Access-aware.** Gate the deep links through the same ownership rule as everything else
   (`resolveTopicAccess` / `getAllowedSlugs`). A user who doesn't own the kit sees the topic as a
   **preview + upgrade nudge** — so the tracker becomes a *contextual, high-intent upsell surface*:
   we are recommending exactly the kit they need, at the exact moment they need it (an interview on
   the calendar). This is the most qualified upgrade prompt on the platform.

> This turns a free feature into a growth engine: it drives retention (daily return), and it
> surfaces kit upgrades against real, dated demand instead of a generic pricing page.

### 3.5 Reminders

Email reminders via the existing `nodemailer` transport: **24h before** and **1h before** a scheduled
interview. A scheduled job (Vercel Cron → a new `/api/tracker/reminders` route, admin/secret-guarded)
queries `InterviewEvent { status: 'scheduled', scheduledAt within window, reminderSentAt: null }`,
sends, and stamps `reminderSentAt` so it never double-sends. The email links back to the Next
Interviews view *and* to "Prep for this" — pulling the user back in the day before they interview.

### 3.6 Insights (Phase 3)

A small analytics strip over the user's own data: applications by status, **response rate**
(interviewing+ ÷ applied), offer rate, and time-from-applied-to-offer. Purely the user's own funnel —
motivating, and it makes the tool feel like it's working *for* them.

---

## 4. API surface (all under `/api/tracker/*`, session-gated to the owner)

| Route | Verbs | Purpose |
|---|---|---|
| `/api/tracker/applications` | `GET` (list, filterable) · `POST` (create) | The board/list |
| `/api/tracker/applications/[id]` | `GET` · `PATCH` (edit/status/archive) · `DELETE` | Detail + edits |
| `/api/tracker/interviews` | `GET` (upcoming, `?window=`) · `POST` (create round) | Next Interviews view |
| `/api/tracker/interviews/[id]` | `PATCH` · `DELETE` | Reschedule/outcome/debrief |
| `/api/tracker/insights` | `GET` | Phase 3 funnel stats |
| `/api/tracker/reminders` | `POST` (cron, secret-guarded) | Reminder sweep |

**Ownership is the security model.** Every read and write filters by `userId: session.id` — a user
can only ever see or mutate their own rows. There is no admin view of another user's pipeline in
Phase 0 (this is private career data — treat it that way). Follow the existing route conventions:
`extractSessionFromRequest` → 401 if absent, `connectToDatabase()`, validate input server-side.

---

## 5. Where it plugs into the existing platform

| Need | Already built — reuse it |
|---|---|
| Auth / user identity | ✅ `gf_session`, `CompanyKitUser`, `extractSessionFromRequest` |
| Company linking + question banks | ✅ `Company` model, `/api/companies`, `/api/companies/[id]/questions` |
| Kit/topic deep links for prep | ✅ resume-at-last-topic deep links (commit 5e31582) |
| Ownership / preview gating for upsell | ✅ `resolveTopicAccess`, `getAllowedSlugs` |
| Themed dashboard shell (light/dark) | ✅ `app/dashboard/layout.tsx` semantic tokens (PRD-006) |
| Email (reminders) | ✅ `nodemailer` (`EMAIL_USER`/`EMAIL_PASS`) |
| Activity/streak logging | ✅ `lib/activity.ts` / `UserActivity` — optionally log tracker actions so the hunt feeds the streak |
| shadcn/ui primitives (dialog, board cards, badges) | ✅ `components/ui/*` — compose, don't hand-roll |

Net new: two models, ~6 route files, three dashboard surfaces, one cron. Almost every hard part
(auth, companies, content access, theming, email) already exists.

---

## 6. Scope

### In scope (Phase 0 — the MVP that ships first)
- [ ] `Application` + `InterviewEvent` models
- [ ] `/api/tracker/applications` CRUD + `/api/tracker/interviews` CRUD (owner-scoped)
- [ ] Pipeline **board** + **list** view at `/dashboard/tracker`, themed
- [ ] Fast add-application modal (4 fields) + progressive detail page
- [ ] **Next Interviews** view + dashboard widget

### Phase 1
- [ ] Company typeahead linking to platform `Company`
- [ ] **"Prep for this"** — company question bank + kit topic deep links, access-gated with upgrade nudge
- [ ] Email reminders (24h / 1h) via cron

### Phase 2+
- [ ] Insights/funnel strip
- [ ] Calendar month view
- [ ] Resume-version attachments per application (Cloudinary — already integrated)
- [ ] Offer comparison (compare 2+ offers side by side)

### Out of scope (deliberately)
- Any **paywall / credits** on the tracker itself — it is free, forever. The monetization is
  *indirect* (retention + contextual kit upsell via "Prep for this").
- Public/shared pipelines, team/recruiter access — this is private career data.
- Auto-import from LinkedIn/job boards or a browser extension — a strong future bet (§10), but a
  separate build with its own auth surface.
- Resurrecting the old admin-run mock-interview flow (§11).

---

## 7. Technical notes

- **Privacy first.** Applications/interviews are sensitive personal data. Owner-scoped queries only;
  no cross-user reads; don't log JD/salary/notes to analytics. If we ever add an admin view, it's a
  separate PRD with explicit consent.
- **Denormalize `userId` onto `InterviewEvent`.** The Next-Interviews and reminder queries must not
  need a join through `Application`. Set it on create; it never changes.
- **Company link is soft.** `companyId` is optional and additive — the tracker is fully usable with
  pure free-text company names. Linking only *unlocks* the prep integration; it's never required.
- **Reminder idempotency.** The cron guards on `reminderSentAt: null` within the window and stamps it
  on send — same pattern as any at-most-once job. Guard the route with a shared secret; it is not a
  user endpoint.
- **Input validation** mirrors the existing interview route: reject past `scheduledAt` for new
  rounds, validate enums server-side, cap list sizes.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Nobody fills it in** (data-entry friction) | High | 4-field add; everything else progressive. Measure applications/user; if it stalls, cut fields. |
| Prep integration underused → it's just a spreadsheet | High | Make "Prep for this" prominent on every interview card; track CTR as a headline metric (§2). If low, the mapping/roundType→content logic is wrong — fix that, not the UI. |
| Sensitive data handled carelessly | High | Owner-scoped everything, no cross-user access, no PII in analytics logs. |
| Reminder emails annoy / land in spam | Medium | Two sends max per interview, both genuinely useful (24h/1h). Reuse the warmed Gmail transport. Add an opt-out later if needed. |
| Scope creep into a full ATS | Medium | Phase hard. Offer comparison, calendar, imports are all *later* — Phase 0 is board + next interviews only. |

---

## 9. The friction principle (why this can't be a form)

Every field we require at creation is a reason not to create the record at all. A developer applying
to 15 companies in a weekend will not fill a 12-field form 15 times — they'll go back to their
spreadsheet. So the contract is: **capture the row in 5 seconds (company, role, URL, status), enrich
later.** The board must be faster than a spreadsheet to be worth switching to. Judge every proposed
field against: *does this belong on the fast-add modal, or is it progressive detail?* Default to
progressive.

---

## 10. Future bets (not committed)

- **One-click add from a job posting.** A browser extension or a "paste a job URL, we scrape
  company/role/JD" endpoint. This is the single biggest friction-killer and probably the difference
  between 25% and 60% adoption — but it's a real build (parsing, its own auth). Separate PRD.
- **Prep readiness score.** "You have a React round in 3 days; you've read 4 of 12 recommended
  topics." Ties the tracker back into learning progress and streaks — makes the two halves of the
  product one loop.
- **Community anonymized insights.** "Median time-to-offer for Frontend roles tracked here: 5 weeks."
  Aggregate, opt-in, anonymized — a data moat no spreadsheet has.

---

## 11. What happens to the existing mock-interview flow

The current `InterviewRequest` model, `/api/interviews`, and `/admin/interviews` implement a
*different* product: a learner **requests a live mock interview** that the admin schedules and reports
on. That is not what this PRD builds — this is a **self-serve personal tracker** of real job
applications.

Per the decision to build fresh, treat the old flow as **deprecated**:

- The new models (`Application`, `InterviewEvent`) are namespaced separately, so there is **no schema
  collision** — Phase 0 can ship alongside the old routes without touching them.
- Retire the old mock-interview UI and routes in the same release, or immediately after, once no user
  has an open `pending`/`approved` request. Its data does not migrate into the tracker (different
  concept), but keep the collection until we've confirmed nothing depends on it.
- Free up the "interview" naming in the dashboard nav for the new tracker.

---

## 12. Open questions

1. **Board vs. list as the default landing view?** I recommend **board** — a job hunt is a pipeline,
   and the visual columns are the pitch. List is one toggle away.
2. **Should tracker actions feed the streak/activity system?** Logging "moved an app to Interviewing"
   as activity could reinforce the daily habit — but might dilute the "learning streak" meaning.
   Leaning yes for *interview scheduled/completed*, no for passive edits. Your call.
3. **Reminder channel — email only, or also in-app/browser push later?** Email for Phase 1; push is a
   Phase 2+ question once we see open rates.
4. **How aggressive should the upgrade nudge in "Prep for this" be?** It's the most qualified upsell
   on the platform, but the tracker is a *free trust-building* surface — a hard paywall here could
   sour it. I recommend a soft "preview + this kit covers your Thursday round" nudge, never a wall.
