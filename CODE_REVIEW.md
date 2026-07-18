# Code Review Protocol

**MANDATORY:** Before every `git commit`, `git push`, or any deploy/publish, Claude MUST perform
a self code review of the pending diff as if it were a **senior FAANG staff engineer** reviewing a
teammate's pull request. Do not commit or publish until the review passes.

This applies to all changes, including "quick fixes" and one-liners. No exceptions unless the user
explicitly says "skip review".

---

## How to run the review

1. Get the exact diff being committed/published:
   ```bash
   git diff --staged        # for staged changes
   git diff                 # for unstaged working changes
   git diff main...HEAD     # for the whole branch before a push/PR
   ```
2. Read every changed hunk in full — plus enough surrounding code to understand context (callers,
   callees, types, related routes/components).
3. Review against the checklist below.
4. Report findings **most-severe first**. For each: file:line, what's wrong, why it matters, and the fix.
5. Fix all **Blocker** and **High** findings before committing. Surface **Medium/Low** findings to the
   user and let them decide.
6. If nothing of substance is found, say so plainly — don't invent issues.

> Tip: `/code-review` runs this automatically on the current diff. Prefer it, but the manual protocol
> here is the fallback and the standard everything is held to.

---

## The senior-engineer bar

Review like someone accountable for this code at 2 a.m. in production. Be direct, specific, and
evidence-based. Every finding must point at a concrete failure scenario (inputs → wrong behavior),
not a vague "this could be better". No nitpicking on style a formatter/linter already owns.

### 1. Correctness (Blockers)
- Does it actually do what the change intends? Trace the happy path and the edge cases.
- Off-by-one, null/undefined, empty arrays, missing `await`, unhandled promise rejections.
- Race conditions, incorrect async ordering, state updated after unmount (React).
- Wrong types crossing boundaries (API ↔ client, DB ↔ app). Trust nothing from the network or DB.
- Error handling: are failures caught, logged, and surfaced — or silently swallowed?

### 2. Security (Blockers)
- **Auth/authorization**: does every new/changed API route verify the session (`gf_session` via
  `lib/session.ts`) and the right permission? Admin routes must enforce admin. Never trust the client.
- Input validation on all request bodies/params/query — reject/normalize before use.
- No injection (Mongo query injection, unescaped output). Parameterize and sanitize.
- **No secrets in code** — keys, tokens, passwords belong in env vars, never committed.
- No sensitive data (PII, order details, tokens) leaked in responses, logs, or error messages.
- Payment flows (Razorpay): verify signatures server-side; never trust client-reported amounts/status.
- IDOR: does a user only get to read/modify *their* resources?

### 3. Data & API design
- Backward compatibility: does this break existing clients, stored data shapes, or in-flight sessions?
- Idempotency for payment/order/webhook handlers.
- DB queries: indexed? N+1? Fetching more than needed? Unbounded results?
- Consistent response shapes and status codes with the rest of `app/api/*`.

### 4. Performance & scalability
- Unnecessary re-renders, missing memoization only where it measurably matters (don't over-memoize).
- Blocking work on the request path; large payloads; missing pagination.
- Bundle impact of new client-side deps; prefer server components where possible.

### 5. Reliability & edge cases
- What happens on network failure, DB down (`connectToDatabase()`), third-party (Drive/Cloudinary/
  Razorpay/email) timeout? Degrade gracefully.
- Loading, empty, and error states for any new UI.

### 6. Maintainability & fit
- Reuse existing primitives — `components/ui/*`, `cn()`, `lib/appConstants.ts`, `lib/pricing.ts`,
  session/db helpers. Don't hand-roll what already exists (see CLAUDE.md conventions).
- Naming, structure, and idioms match the surrounding code.
- No dead code, no leftover `console.log`, no commented-out blocks, no unused imports/vars.
- DRY without over-abstracting; a little duplication beats the wrong abstraction.
- Comments explain *why*, not *what*; only where the code can't speak for itself.

### 7. Tests & verification
- Is the change actually exercised (manually or via test)? For runtime behavior, drive the real flow —
  don't rely on "it compiles".
- New logic with branches deserves at least a described test path.

---

## Severity labels

| Label     | Meaning                                                        | Action                    |
|-----------|----------------------------------------------------------------|---------------------------|
| Blocker   | Correctness/security bug, data loss, breaks prod               | Fix before commit         |
| High      | Likely bug, missing auth/validation, significant perf issue    | Fix before commit         |
| Medium    | Should fix soon; not release-blocking                          | Surface to user           |
| Low/Nit   | Style, naming, minor cleanup                                   | Mention briefly, optional |

---

## Output format

```
## Code Review — <short description of change>

Scope: <files/areas reviewed>

### Findings
1. [Blocker] path/to/file.ts:42 — <problem>. <why it matters>. Fix: <concrete fix>.
2. [High]    ...
3. [Medium]  ...

### Verdict
✅ Ready to commit  |  ❌ Blocked on findings above
```

If the verdict is ❌, do not commit or publish until the Blocker/High items are resolved.
