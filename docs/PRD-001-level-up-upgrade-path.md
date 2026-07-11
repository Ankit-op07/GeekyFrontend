# PRD-001 — "Level Up": Bundles, Upgrade Credit & Honest Social Proof

| | |
|---|---|
| **Owner** | Ankit |
| **Status** | Proposed — awaiting go/no-go |
| **Appetite** | 1–2 weeks (small) |
| **Target users** | Both ICPs (placement students + working devs) |
| **Primary goal** | More purchases per customer, higher AOV, higher trust |
| **Date** | 2026-07-11 |

---

## 1. Problem

### 1.1 Every buyer is a dead end

`lib/appConstants.ts` → `PLAN_TO_SLUGS` gates each kit independently:

```
// Each kit is independent — buying one does NOT grant access to others
```

There is **no bundle SKU, no upgrade path, no cross-sell surface, and no coupon system.**
A user who buys the JS Kit (₹149) and loves it has no in-product path to buy the React Kit —
they must find their way back to the marketing site and pay full price again, with zero
recognition that they are an existing customer.

**Consequence:** LTV ≈ one order ≈ ₹149–299, permanently. The warmest, highest-converting
audience you will ever have — people who already paid you and completed content — is being
monetised exactly once.

### 1.2 The "Complete Kit" is a trust landmine

Also from `appConstants.ts`:

```
// Complete kit — its OWN kit only, does NOT include JS/React/Node
"Complete Frontend Interview Preparation Kit": ["complete"],
```

A ₹299 SKU named **"Complete"**, badged **"BEST VALUE"**, that does **not** include the
JavaScript or React kits. No reasonable buyer expects this. It is a refund request, a support
ticket, and a bad review waiting to happen — and it directly undermines the "trust and
satisfaction" goal.

### 1.3 Social proof is fabricated

`components/purchase-notification.tsx` generates random Indian first names, last names and
cities to fake live purchase toasts ("Aarav Sharma from Pune just bought the React Kit").

Meanwhile the `Order` collection contains **real** orders with real `planName`, `amount` and
`createdAt`. You are fabricating social proof while sitting on the genuine article. If one user
notices — and a dev audience notices — the trust cost is severe and unrecoverable.

---

## 2. Goal & success metrics

**Goal:** turn one-time buyers into multi-kit buyers, and make the pricing story honest enough
that people trust it.

| Metric | Baseline | Target (60 days post-launch) |
|---|---|---|
| **Repeat purchase rate** (users with ≥2 orders) | ~0% (no path exists) | **≥ 8%** |
| **AOV** | ₹149–299 (~₹210 est.) | **≥ ₹300** |
| **Bundle attach rate** (bundle ÷ all orders) | n/a | **≥ 20%** |
| Refund / "not what I expected" tickets | unknown — instrument it | ↓ trending |
| Checkout conversion (existing-user sessions) | unknown — instrument it | ↑ |

**Guardrail:** total revenue must not fall. If the bundle cannibalises single-kit sales without
lifting AOV, we adjust price — not roll back code.

---

## 3. Solution

Four changes, shipped as one coherent release.

### 3.1 Introduce a real bundle: the "Complete Kit"

A new SKU in `KIT_CATALOG` that grants **every kit that actually exists today**. The name
"Complete" is freed up by the rename in §3.1a and now means what it says.

| | |
|---|---|
| **Display name** | **Complete Kit — All 3 Kits, One Price** |
| **Catalog id** | `complete-access-kit` |
| **`PLAN_TO_SLUGS` key** | `"Complete Kit All Access Bundle"` — **must be a brand-new string** (see risk table) |
| **Price** | **₹499** *(decided: Ankit, 2026-07-11)* |
| **Anchor** | **₹647** — the honest sum of the 3 live kits (149 + 199 + 299). A 23% saving. |
| **Grants** | `["javascript", "react", "complete"]` — **live kits only** |
| **Promise** | *"All 3 kits. One price. Lifetime access."* |

**Decisions (Ankit, 2026-07-11):**
- The bundle does **not** include the `comingSoon` kits (Node.js, Experiences).
- The **Placement Kit is retired from the product line** (§3.1b) and is therefore not in the bundle.
- Price stays **₹499** despite the anchor dropping to ₹647.

**Naming constraint — do not skip this.** Because Node and Experiences remain visible on the site
as "coming soon", the bundle **must not** be marketed as *"everything"*, *"every kit we ship"*, or
*"all future kits"*. A buyer would reasonably read those as covering the coming-soon kits, and we
would have recreated the exact mis-naming bug this PRD exists to fix. Scope every string to the
three kits that exist:

> ✅ "All 3 kits. One price. Lifetime access."
> ✅ "JS + React + Frontend System Design — ₹499 (worth ₹647)"
> ❌ "Everything included" · ❌ "Every kit we ever ship" · ❌ "All future kits free"

**Watch item — the bundle gap is now thin.** JS + React bought separately is ₹348; the bundle is
₹499. A user who only wants those two must find ₹151 of extra reason to take the bundle, and the
only thing bridging that gap is the System Design kit. If bundle attach rate comes in under 15%
after 30 days, the first lever to pull is **price (₹449 → 31% saving)**, not more banners.

### 3.1b Retire the Placement Kit

**Decision (Ankit, 2026-07-11): remove the Ultimate Campus Placement Kit from the site entirely.**
This sharpens the brand to pure frontend interview prep.

**Remove:**
- `placement-kit` from `KIT_CATALOG`
- Placement from `components/pricing.tsx`, `product-showcase.tsx`, `features.tsx`, `curriculum.tsx`
- `components/placement-kit-checkout-content.tsx`
- Placement from the `purchase-notification.tsx` product list (dying anyway in §3.4)

**Do NOT remove — these are load-bearing for existing buyers:**

| Keep | Why |
|---|---|
| `PLAN_TO_SLUGS["Ultimate Campus Placement Kit"] → ["placement"]` | **Never delete this key.** Past buyers lose all access the moment you do. |
| The `placement` Kit/Chapter/Topic documents in MongoDB | Existing buyers still read this content at `/learn`. Retiring a SKU ≠ deleting the content. |
| Placement in `app/admin/access` manual-grant list | Support still needs to grant it for refund/re-issue cases. |
| Placement orders in the `Order` collection | They feed the credit calculation — a placement buyer's ₹199 must still count toward the bundle (§3.2). |

**Also required:** `/checkout/placement-kit` must **301 → `/pricing`**, not 404. Any live ad
creative, backlink, or shared URL pointing at it will otherwise dead-end.

**Flagged for the record:** you earlier named campus-placement students as half your ICP. Retiring
this SKU narrows the product to working devs + frontend-focused students. That is a defensible
focus call — but it *is* an ICP decision, not just a catalog cleanup.

### 3.1a Rename the old ₹299 kit → "Frontend System Design Kit"

**Decision: Ankit, 2026-07-11.** The current "Complete Frontend Interview Preparation Kit" is
renamed to **"Frontend System Design Kit"**, freeing the word "Complete" for the real bundle.

**Recorded dissent (PO):** system design is ~42 of 570+ items in that kit (~7%). Its actual
contents are 25 chapters (HTML basics → system design), 180 DSA problems, 60 machine coding
problems, 35 JS challenges and 91 articles. A name that promises system design risks the same
expectation-mismatch we are trying to fix, pointed in a new direction.

**Agreed mitigation — this is now a hard requirement, not a nice-to-have.** The tagline and the
top of the features list must carry the full contents, so nobody reaches checkout with a false
picture:

> **Frontend System Design Kit**
> *42 frontend system design walkthroughs (RADIO framework) — plus 180 DSA problems,
> 60 machine coding challenges, 35 JS coding challenges and 91 in-depth articles.*

This reads as *more* value, not less. Ship the rename and the tagline in the same commit; the
rename is not safe to ship without it.

**Access safety:** `id` stays `complete-kit`. The `PLAN_TO_SLUGS` key
`"Complete Frontend Interview Preparation Kit"` is **retained forever** so existing buyers keep
access. Add the new display name as an additional key. Never remove a key.

### 3.2 Upgrade credit ("pay the difference")

The core mechanic. **Every rupee already spent is credited against a larger purchase.**

```
credit  = sum(amount) of that user's successful Orders
payable = max(target_price - credit, UPGRADE_FLOOR)   // UPGRADE_FLOOR = ₹49
```

| User already owns | Upgrading to | List | Credit | **They pay** |
|---|---|---|---|---|
| JS Kit (₹149) | Complete Kit | ₹499 | ₹149 | **₹350** |
| React Kit (₹199) | Complete Kit | ₹499 | ₹199 | **₹300** |
| JS + React (₹348) | Complete Kit | ₹499 | ₹348 | **₹151** |
| Sys Design + React (₹498) | Complete Kit | ₹499 | ₹498 | **₹49** (floor) |
| Retired Placement Kit (₹199) | Complete Kit | ₹499 | ₹199 | **₹300** — credit honoured even though the SKU is retired |
| Nothing | Complete Kit | ₹499 | ₹0 | **₹499** |

**Why it works:** it removes the single biggest objection to a second purchase — *"I'd be paying
twice for things I already own."* It reframes every past purchase as **progress toward** the
bundle rather than a sunk cost. And it is an unambiguously generous, pro-customer policy, which
is what "trust and satisfaction" is actually made of.

**Price is computed server-side, always.** The client may *display* a credit; it may never
*assert* one.

### 3.3 Cross-sell at the moment of peak intent

Not a banner farm. Three placements, each tied to a moment where the user has just felt value:

1. **Kit completion (highest intent).** When `kitProgress.progressPercent` hits 100, show a card:
   *"You finished the JS Kit. React is the natural next step — and your ₹149 already counts toward it."*
2. **Dashboard → My Kits.** Locked kits render as greyed cards beside owned ones with a
   *"Your ₹149 credit applies"* ribbon. Today locked kits are simply invisible — a user cannot
   want what they cannot see.
3. **Learn sidebar lock.** The preview-lock → checkout redirect already exists. Point it at the
   credit-aware checkout instead of full-price checkout. **~1 line.**

### 3.4 Replace fake social proof with real social proof

**Decision: Ankit, 2026-07-11 — serve it from the backend, from real orders.**

Remove the random-name generator in `purchase-notification.tsx`. Feed the toast from
`GET /api/social-proof/recent`, backed by the **real `Order` collection**:

```json
{
  "recent": [
    { "firstName": "Aarav", "city": "Pune", "planName": "React.js Interview Preparation Kit", "boughtAgo": "2 days ago" }
  ],
  "totals": { "React.js Interview Preparation Kit": 1240 }
}
```

**Rules:**
- Real orders only (`status: 'email_sent'`). **No server-side generation of plausible-looking
  buyers.** Moving fabrication from client to backend does not make it true — it makes it
  deliberate. The audience is developers; they open DevTools for fun.
- First name only + city. Never expose email, order ID, payment ID, or amount.
- Cache 60s.

**Never-empty, never-lying — two real-data levers:**
1. **Wide window.** Pull from the last **30 days**, not the last hour. Drop the
   "14 minutes ago" line and use a soft relative label ("recently", "2 days ago") so no false
   recency is implied.
2. **Real aggregate counter.** `"1,240 developers have bought this kit"` — a true `countDocuments`
   over `Order`. Always populated, always true, and more persuasive than a single name anyway.

With both, the widget is never blank and never fabricated. If both are genuinely empty (a brand
new kit), render nothing.

---

## 4. Scope

### In scope
- [ ] `complete-access-kit` SKU (₹499) + **new** `PLAN_TO_SLUGS` key granting the 3 **live** slugs
- [ ] **Retire Placement Kit** from catalog + all marketing components (§3.1b)
- [ ] `/checkout/placement-kit` → **301 redirect** to `/pricing` (not a 404)
- [ ] Verify placement buyers still see the kit in My Kits and can read it at `/learn`
- [ ] Audit every bundle-facing string for "everything"/"all future kits" language (§3.1)
- [ ] **Rename** "Complete Frontend Interview Preparation Kit" → **"Frontend System Design Kit"**
      (keep the old `PLAN_TO_SLUGS` key so existing buyers retain access — *append*, never replace)
- [ ] Ship the new honest tagline **in the same commit as the rename** (§3.1a — hard requirement)
- [ ] `lib/pricing.ts` — server-side `computeUpgradePrice(userEmail, targetKitId)`
- [ ] `GET /api/payment/quote?kit=<id>` → `{ listPrice, credit, payable, ownedKits[] }`
- [ ] `app/api/payment/create-order` — use `computeUpgradePrice`, **never** a client-sent amount
- [ ] Credit-aware checkout UI (strike-through list price, credit line, payable total)
- [ ] Cross-sell surfaces: completion card, My Kits locked cards, learn-sidebar lock route
- [ ] `GET /api/social-proof/recent` (real orders, 30-day window + real aggregate count)
- [ ] Rewire `purchase-notification.tsx`; **delete** the `indianNames` / `indianCities` generators
- [ ] Admin: Complete Kit appears in manual access grant (`app/admin/access`)

### Out of scope (deliberately)
- Coupon / referral codes → **PRD-002**, next cycle
- Subscription billing (`subscriptionStatus` fields on `CompanyKitUser` stay dormant)
- Expiring credit — credit is permanent. Simpler, and more trustworthy.
- Refunds / downgrades for the bundle
- Reactivating the dormant leaderboard / interview / company-questions tabs → **PRD-003**

---

## 5. Technical notes

**Reuse, don't rebuild.** This adds essentially no new data model:

- **Credit source of truth:** the existing `Order` collection (`email`, `amount`, `status`).
  Sum successful orders per email. No new schema, no migration.
- **Access grant:** existing `PLAN_TO_SLUGS` + `getAllowedSlugs()` already do exactly what the
  bundle needs. Add one key mapping to all slugs. `CompanyKitUser.purchasedKits[]` is already an
  array — it accommodates a bundle plan name unchanged.
- **Payment:** existing Razorpay create-order / verify / webhook flow, unchanged in shape.

**The one hard requirement:** `create-order` must recompute the payable amount server-side from
the DB. A user must never be able to POST their own credit. Assume the client is hostile.

**Edge cases:**

| Case | Behaviour |
|---|---|
| User owns the Complete Kit, opens a kit checkout URL | Redirect to `/learn` — "you already own this" |
| Credit ≥ target price | Charge `UPGRADE_FLOOR` (₹49). Razorpay has a ₹1 minimum; never attempt ₹0. |
| Same email, different auth (Google vs password) | Credit is keyed on **email** — matches how `Order` already works, so it unifies correctly |
| Failed / refunded orders | Only `status: 'email_sent'` orders count toward credit |
| Legacy "Complete" buyers after rename | Keep **both** plan-name keys in `PLAN_TO_SLUGS`. Never remove a key. |

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Bundle cannibalises single-kit sales** | High | ₹499 exceeds every single kit, so any bundle sale is AOV-accretive vs. the ~₹210 baseline. Watch total revenue 2 weeks; the lever is price, not code. |
| **Client-side price tampering** | Critical | Server-side computation, mandatory. The one thing that cannot ship sloppy. |
| **Rename breaks existing buyers' access** | Critical | Append the new key; never mutate or remove old ones. Verify against a prod snapshot before deploy. |
| **Plan-name collision silently gifts all-access** | Critical | The new bundle **must** use a brand-new `PLAN_TO_SLUGS` key (`"Complete Kit All Access Bundle"`). If it reuses `"Complete Frontend Interview Preparation Kit"`, every past buyer of the old ₹299 kit is silently upgraded to all-access for free — and the two cohorts become indistinguishable in the DB. Unrecoverable without an order-log replay. |
| **"System Design Kit" name sets the wrong expectation** | Medium | Accepted by owner. Mitigated by the mandatory contents-forward tagline (§3.1a). Watch refund tickets mentioning "system design" for 30 days; if they spike, revisit the name. |
| **Retiring Placement revokes access for past buyers** | Critical | Delete the SKU, **never** the `PLAN_TO_SLUGS` key or the MongoDB content. Regression-test with a real placement buyer's account before deploy. |
| **Thin bundle gap (₹348 → ₹499)** | Medium | Only System Design bridges the ₹151 gap. If attach rate < 15% at 30 days, drop the bundle to ₹449 (31% saving). Price is the lever, not banners. |
| **Bundle implies it covers the coming-soon kits** | High | Node + Experiences remain visible as "coming soon" but are NOT granted. Every bundle string must be scoped to "all 4 kits" — never "everything" or "all future kits" (§3.1). This is the same bug class as the original "Complete" kit; do not reintroduce it. |
| Existing customers feel cheated by the new bundle | Medium | The credit mechanic *is* the mitigation — it makes them strictly better off. Announce it that way. |
| Real social proof looks sparse at low volume | Low | Show nothing rather than something fake. Sparse-but-true beats dense-but-false. |

---

## 7. Rollout

1. **Rename + real social proof first** (day 1–2). Low risk, immediate trust win, independent of pricing.
2. **Bundle + upgrade credit** behind an env flag (day 3–8).
3. **Email every existing customer** (day 9): *"Your ₹149 now counts toward the Complete Kit."*
   This single email is the highest-ROI action in the PRD — it monetises the entire existing base
   on day one, and it lands as a gift rather than an ask.
4. **Instrument, then watch** (day 10+): bundle attach rate, AOV, repeat-purchase rate.

---

## 8. Why this feature over the alternatives

| Candidate | Revenue impact | Effort | Verdict |
|---|---|---|---|
| **Bundles + upgrade credit** | **Direct — unlocks the 2nd purchase, lifts AOV** | **~1.5 wk** | **✅ Ship** |
| Quizzes / assessments | Indirect (retention → maybe conversion) | 3–4 wk | Later |
| Real AI mock interviews | New revenue line, but big | 8–12 wk | PRD-004 |
| Referral programme | Growth, compounding | 2–3 wk | **PRD-002 — do next** |
| Turn on dormant leaderboard / interview tabs | Engagement, nearly free | 3 days | PRD-003 — cheap, do alongside |

Everything else on that list improves the product for people who **already bought**. This is the
only candidate that changes **how many things they buy** — the goal you named. It is also the
smallest, because it adds no new data model: it is pricing logic plus wiring surfaces that
already exist.

---

## 9. Decision log

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Rename target for the old ₹299 kit | **"Frontend System Design Kit"** — owner's call. PO dissent recorded in §3.1a; contents-forward tagline is the agreed mitigation and is a **hard requirement**. | 2026-07-11 |
| 2 | Name of the new all-inclusive bundle | **"Complete Kit — Everything Included"**, ₹499. Must use a **new** `PLAN_TO_SLUGS` key. | 2026-07-11 |
| 3 | Social proof source | **Real orders, served from the backend** via `/api/social-proof/recent`. No server-side fabrication. 30-day window + real aggregate count so it is never empty. | 2026-07-11 |
| 4 | Bundle price | **₹499** (vs ₹846 honest anchor). | 2026-07-11 |
| 5 | Does the bundle include `comingSoon` kits? | **No — live kits only.** Bundle must therefore never be marketed as "everything" (§3.1). Future kits become a 3rd purchase for bundle holders, softened by permanent credit. | 2026-07-11 |
| 6 | Credit expiry | **Permanent.** Past spend counts toward the bundle forever. | 2026-07-11 |
| 7 | Placement Kit | **Retired from the site entirely.** Existing buyers keep access forever (key + content retained); their ₹199 still earns bundle credit. ICP narrows to frontend. | 2026-07-11 |
| 8 | Bundle price after Placement removal | **Stays ₹499** (anchor now ₹647, 23% saving). Revisit at ₹449 if attach rate < 15%. | 2026-07-11 |

## 10. Still open

Nothing blocking. All product decisions are locked — this PRD is ready to build.

Sequencing recommendation (from §7): ship the **rename + honest tagline + real social proof**
first (day 1–2, low risk, no pricing dependency), then the **bundle + upgrade credit** behind an
env flag, then the **day-9 email to existing customers** — which is the single highest-ROI action
in this document.
