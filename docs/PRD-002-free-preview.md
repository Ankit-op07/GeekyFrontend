# PRD-002 — "Read Before You Buy": Real Free Content + Smart Paywall

| | |
|---|---|
| **Owner** | Ankit |
| **Status** | Proposed |
| **Appetite** | 1–1.5 weeks (small) |
| **Primary goal** | Conversion (stranger → buyer) + organic acquisition |
| **Depends on** | PRD-001 (credit-aware quote API — already shipped) |
| **Date** | 2026-07-11 |

---

## 1. Problem

**A visitor cannot read a single real sentence of your content before paying.**

- `/api/learn/kits` gates access at the **kit** level — `hasAccess` is a boolean per kit.
  There is no per-topic free flag anywhere in the schema.
- `app/preview/page.tsx` is a **hardcoded static list of module names**. It is marketing
  copy about the content, not the content.
- So the ask is: *"pay ₹149 on faith."*

You sell **writing**. 127,000 words of it. The quality of that writing is the entire product —
and it is the one thing a prospect is structurally prevented from evaluating. Every kit page
instead leans on proxies for quality: student counts, star ratings, testimonials, a "97% success
rate" badge. Those proxies are doing a job that **one genuinely good free article would do far
better** — and, unlike the proxies, a free article is true.

**Second-order cost: you have no organic acquisition channel.** Every page on the site is either
marketing or paywalled. There is nothing for Google to index and nothing for a developer to link
to. Your competitors (GFG, Striver, JavaScript.info) acquire almost entirely through free content
that ranks. You are buying every single visitor.

---

## 2. Goal & success metrics

| Metric | Baseline | Target (60 days) |
|---|---|---|
| **Preview → purchase conversion** | n/a (no preview exists) | **≥ 4%** of preview readers buy |
| **Organic sessions / month** | ~0 from content | **trending up, any non-zero baseline** |
| Overall site → purchase conversion | instrument it | **↑** |
| Avg. free topics read before purchase | n/a | 2–3 (tells us the free tier is sized right) |

**Guardrail:** free topics must not cannibalise. If the free set is large enough that people stop
buying, we have over-given. Watch: *purchases ÷ preview readers*. If it falls, shrink the free set.

---

## 3. Solution

### 3.1 Mark topics free at the data layer

Add one field to the `Topic` model:

```ts
isFree: { type: Boolean, default: false, index: true }
```

That is the whole schema change. No new collection, no migration risk — existing topics default
to paid, so **the current paywall behaviour is unchanged until we explicitly flip topics**.

### 3.2 Choose the free set deliberately

**3–5 topics per kit.** Not a random trial slice — hand-picked to be:

1. **Genuinely, completely useful on their own.** A reader must finish it feeling they got
   something real, not a teaser that stops at the interesting part. A crippled free article is
   worse than no free article: it teaches the reader that the paid content is also thin.
2. **High-search-volume.** "Closures", "event loop", "useEffect", "debounce vs throttle". These
   are what people actually type into Google.
3. **Breadth-revealing, not depth-revealing.** Show the *format* and the *quality bar* — the
   interview-ready answer, the follow-up questions, the code. The value of the kit is that there
   are 570 more of these, organised. One does not substitute for that.

Concretely: JS Kit → closures, event loop, `this`. React Kit → useEffect pitfalls, reconciliation.
System Design Kit → one full RADIO walkthrough.

### 3.3 Serve free topics to everyone

`/api/learn/topic` currently returns content only when `hasAccess`. Change the condition to:

```ts
const canRead = topic.isFree || hasAccess;
```

Free topics render at their **real** `/learn/<kit>/<topic>` URLs — not a separate `/preview`
sandbox. Same page, same styling, same reading experience. This matters: the free article *is*
the demo. It should feel exactly like what they're buying, because it is.

### 3.4 The paywall, at the moment of maximum interest

When a reader finishes a free topic and clicks the next (locked) one, they hit an inline paywall
**inside the reader** — not a redirect to a sales page. They keep their place; the wall appears
where the content would be.

The wall carries:

- **What they just got.** *"You've read 3 of 62 topics in the React Kit."*
- **A credit-aware price.** Reuse `GET /api/payment/quote` from PRD-001 — so an existing JS Kit
  buyer sees *"₹199 → ₹50, your ₹149 already counts"*. The infrastructure is built; this is a fetch.
- **The bundle, if it's the better deal.** `<BundleUpsell />` already exists and already prices
  itself per-user. Drop it in.
- **No countdown timers, no fake scarcity.** They have just read your writing and liked it. That
  is the pitch. Anything else undercuts it.

### 3.5 Rebuild `/preview` as a real content index

Replace the hardcoded module list with a genuine index of every free topic across all kits —
a browsable, linkable, indexable library. This becomes the SEO surface and the thing people share.

**Make free topics indexable:** real `<title>`/meta per topic, canonical URLs, sitemap entries,
and `Article` structured data. Locked topics stay `noindex`.

---

## 4. Scope

### In scope
- [ ] `Topic.isFree` field (default `false` — no behaviour change until flipped)
- [ ] Free-topic read path: `/api/learn/topic` + `/api/learn/kits` expose `isFree`
- [ ] Sidebar: free topics show an "Free" pill instead of a lock
- [ ] Inline paywall component in the reader (credit-aware, reuses `/api/payment/quote`)
- [ ] `<BundleUpsell />` embedded in the paywall
- [ ] `/preview` rebuilt as a real free-topic index
- [ ] Admin: `isFree` toggle in the content editor (`/admin/content`)
- [ ] SEO: per-topic metadata, sitemap, `noindex` on locked topics
- [ ] Analytics: fire an event on free-topic read + paywall view (Meta CAPI route already exists)

### Out of scope
- Email capture gate before reading — **deliberately.** A gate in front of the demo defeats the
  demo. Let them read, then ask.
- Rewriting content
- Comments / discussion on free topics
- Fixing the fabricated ratings & testimonials → **PRD-003** (see §7)

---

## 5. Technical notes

Almost everything needed already exists:

| Need | Already built? |
|---|---|
| Per-user price with credit applied | ✅ `GET /api/payment/quote` (PRD-001) |
| Bundle upsell card, self-pricing | ✅ `components/bundle-upsell.tsx` (PRD-001) |
| Topic reader, sidebar, markdown | ✅ `app/learn/[kitSlug]/[topicSlug]` |
| Access resolution | ✅ `getAllowedSlugs()` |
| Admin content editor | ✅ `/admin/content` |
| Conversion tracking | ✅ `app/api/conversion` (Meta CAPI) |

Net new: one boolean field, one condition change, one paywall component, one rebuilt page.

**Security note:** `isFree` must be enforced **server-side** in the topic route. Do not ship the
markdown to the client and hide it with CSS — that is not a paywall, it's a blur filter, and
View Source defeats it.

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Free set too generous → cannibalises sales** | High | Start at **3 topics/kit**. Only widen if conversion holds. Easy to reverse: flip a boolean. |
| Free content is thin → damages perceived quality | High | Free topics must be *complete*, not truncated. A weak free article is worse than none. |
| Paywall feels like a bait-and-switch | Medium | Mark free topics as free **in the sidebar, up front**. The reader always knows where the wall is before they walk into it. |
| Content gets scraped | Low | It's marketing. Scraping a free article that links back to you is a cost worth paying. |

---

## 7. What this does NOT fix — and should be next

We removed the fabricated purchase notifications in PRD-001. The **same fabrication is still live
elsewhere** and this PRD does not touch it:

- `students: 2547`, `rating: 4.9`, `reviews: 487` — hardcoded per kit
- Hand-written testimonials with invented names, roles and companies
- A **"97% Success Rate"** badge on the homepage

This is the same trust liability, aimed at the same developer audience, and it now sits
*next to* real social proof — which makes the contrast sharper, not softer.

**PRD-003 should replace these with real review capture** (ask buyers at 30 days, show what comes
back) **or delete them.** Note that free preview reduces the *need* for them: once a prospect can
read the writing, they no longer need to be told it's good by a stranger named "Rahul S., SDE-2".

---

## 8. Open questions

1. **How many free topics per kit?** I recommend 3 to start.
2. **Which topics?** Needs your judgement on what's both genuinely useful and highly searched.
3. **Email gate before reading?** I recommend no — it defeats the purpose. But it is a real
   trade-off between lead capture and friction, and it's your call.
