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
