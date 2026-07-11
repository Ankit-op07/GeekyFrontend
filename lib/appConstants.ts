/* ─── Centralized Kit Catalog ────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH for every kit across the app.
 *  The `id` is the only thing that travels through URLs and APIs.
 *  Prices are resolved server-side — never trust the client.
 * ─────────────────────────────────────────────────────────────── */

export interface KitCatalogItem {
    id: string;
    /** Canonical plan name — this is the string stored in purchasedKits & PLAN_TO_SLUGS. */
    name: string;
    /** Optional marketing name shown in the UI. Falls back to `name`. */
    displayName?: string;
    tagline: string;
    price: number;
    originalPrice: number;
    duration: string;
    badge?: string;
    features: string[];
    comingSoon?: boolean;
    /** True only for the bundle SKU — grants multiple kits. */
    isBundle?: boolean;
}

/**
 * Map from purchasedKits plan names → Kit collection slug patterns.
 * A single plan may grant access to multiple DB kits (e.g. "Complete" gives all).
 * Uses substring matching on slug so minor naming differences work.
 */
export const PLAN_TO_SLUGS: Record<string, string[]> = {
    // Each kit is independent — buying one does NOT grant access to others
    // JS kit
    "JavaScript Interview Mastery Kit": ["javascript"],
    "JS Interview Preparation Kit": ["javascript"],
    // React kit
    "Reactjs Interview Preparation Kit": ["react"],
    "React.js Interview Preparation Kit": ["react"],
    // Node kit
    "Node.js Interview Preparation Kit": ["node"],
    "Node.js Backend Mastery Kit": ["node"],
    /* ── Frontend System Design Kit ──────────────────────────────
     *  Renamed from "Complete Frontend Interview Preparation Kit" (2026-07).
     *  ⚠️  NEVER delete the legacy key below — past buyers are stored in
     *  CompanyKitUser.purchasedKits by the plan name they bought under.
     *  Removing it silently revokes their access. Append, never replace.
     * ─────────────────────────────────────────────────────────── */
    "Complete Frontend Interview Preparation Kit": ["complete"], // legacy — DO NOT REMOVE
    "Frontend System Design Kit": ["complete"],

    // Experiences (not yet released)
    "Frontend Interview Experiences Kit": ["experiences"],

    /* ── Ultimate Campus Placement Kit — RETIRED (2026-07) ───────
     *  No longer sold; removed from KIT_CATALOG. This key MUST remain so
     *  existing buyers keep lifetime access to content they paid for.
     * ─────────────────────────────────────────────────────────── */
    "Ultimate Campus Placement Kit": ["placement"], // retired SKU — DO NOT REMOVE

    /* ── Complete Kit (the real bundle) ──────────────────────────
     *  Brand-new key. MUST NOT reuse any string above, or every past buyer
     *  of that plan would be silently upgraded to the full bundle for free.
     *  Grants the 3 LIVE kits only — NOT the comingSoon kits.
     * ─────────────────────────────────────────────────────────── */
    "Complete Kit All Access Bundle": ["javascript", "react", "complete"],
};

/** The bundle SKU id — the only kit that grants multiple slugs. */
export const BUNDLE_KIT_ID = 'complete-access-kit';

/**
 * Minimum chargeable amount on an upgrade, in ₹.
 * Razorpay rejects ₹0 orders, so a fully-credited user still pays this floor.
 */
export const UPGRADE_FLOOR = 49;

/**
 * Given a user's purchasedKits array, return the set of slug substrings
 * that the user should have access to.
 */
export function getAllowedSlugs(purchasedKits: string[]): Set<string> {
    const slugs = new Set<string>();
    for (const plan of purchasedKits) {
        const mapped = PLAN_TO_SLUGS[plan];
        if (mapped) {
            mapped.forEach(s => slugs.add(s));
        }
    }
    return slugs;
}

/**
 * Legacy/stored plan name → the kit name currently shown to users.
 *
 * purchasedKits, Order.planName and the PLAN_TO_SLUGS keys still hold the
 * ORIGINAL strings — those are access keys and must never be renamed. Use this
 * ONLY for display (emails, admin UI, anywhere a human reads a kit name), so a
 * user who bought under the old name still sees the current one.
 *
 * NOTE: distinct from getKitDisplayName(kitId) below — this takes a stored
 * PLAN NAME (from purchasedKits / Order.planName), not a catalog id.
 */
const PLAN_DISPLAY_OVERRIDES: Record<string, string> = {
    "Complete Frontend Interview Preparation Kit": "Frontend System Design Kit",
    "Complete Frontend Kit": "Frontend System Design Kit",
};

export function getPlanDisplayName(planName: string): string {
    if (!planName) return planName;
    return PLAN_DISPLAY_OVERRIDES[planName] || planName;
}

export const KIT_CATALOG: Record<string, KitCatalogItem> = {
    'js-kit': {
        id: 'js-kit',
        name: 'JS Interview Preparation Kit',
        tagline: 'Master JavaScript fundamentals',
        price: 149,
        originalPrice: 1499,
        duration: 'Lifetime',
        badge: 'FOUNDATION',
        features: [
            'JS Interview preparation questions',
            'Tricky JS questions asked in interviews',
            'Polyfill and modern JS questions',
            'JS and React patterns and Solid principles',
            'Topic-wise breakdown: closures, async, prototypes, etc.',
            'Lightweight cheat-sheets and notes',
            'Regular updates included',
            'Lifetime access',
        ],
    },
    /* Renamed 2026-07 from "Complete Frontend Interview Preparation Kit".
     * The tagline MUST lead with the full contents — the name promises system
     * design, but system design is ~42 of 570+ items. See PRD-001 §3.1a. */
    'complete-kit': {
        id: 'complete-kit',
        name: 'Frontend System Design Kit',
        tagline: '42 frontend system design walkthroughs (RADIO framework) — plus 180 DSA problems, 60 machine coding challenges, 35 JS coding challenges and 91 in-depth articles.',
        price: 299,
        originalPrice: 2999,
        duration: 'Lifetime',
        badge: 'ADVANCED',
        features: [
            '42 frontend system design walkthroughs using the RADIO framework',
            '25 structured chapters from HTML basics to frontend system design',
            '570+ interview questions, coding problems, and practice items',
            '91 detailed articles with interview-ready answers and code examples',
            '180 DSA problems with JavaScript solutions and complexity analysis',
            '60 machine coding problems with accessibility and edge cases',
            '35 JavaScript coding challenges from SDE1 to SDE3 level',
            '30-day prep plans, salary negotiation scripts, and quick revision sheets',
            'Regular updates included',
            'Lifetime access',
        ],
    },
    'experiences-kit': {
        id: 'experiences-kit',
        name: 'Frontend Interview Experiences Kit',
        tagline: 'Learn from real experiences',
        price: 299,
        originalPrice: 2999,
        duration: 'Lifetime',
        badge: 'INSIDER',
        comingSoon: true,
        features: [
            '30+ curated interview experiences (SDE/Frontend)',
            'Company-wise patterns and rounds breakdown',
            'Role/seniority expectations & common pitfalls',
            'Questions that actually appeared',
            'Post-offer insights: timelines & negotiation pointers',
            'Regular updates included',
            'Lifetime access',
        ],
    },
    'react-kit': {
        id: 'react-kit',
        name: 'React.js Interview Preparation Kit',
        tagline: '57 articles · 15 machine coding challenges · 10 structured modules',
        price: 199,
        originalPrice: 1999,
        duration: 'Lifetime',
        badge: 'BESTSELLER',
        features: [
            '57 in-depth articles across 10 modules',
            '15 machine coding challenges with solutions',
            '60+ output-based trick questions',
            'Scripted interview answers for every concept',
            'Design patterns, testing & performance',
            'Scenario & behavioral round preparation',
            'Lifetime updates included',
            'Instant access after payment',
        ],
    },
    /* ── THE BUNDLE ──────────────────────────────────────────────
     *  Grants the 3 LIVE kits. Does NOT grant nodejs-kit or experiences-kit.
     *  ⚠️  Never market this as "everything" / "all future kits" — Node and
     *  Experiences are visible on the site as coming-soon and are NOT included.
     *  That mis-naming is the exact bug this SKU exists to fix. PRD-001 §3.1.
     * ─────────────────────────────────────────────────────────── */
    'complete-access-kit': {
        id: 'complete-access-kit',
        name: 'Complete Kit All Access Bundle',
        displayName: 'Complete Kit — All 3 Kits, One Price',
        tagline: 'JavaScript + React + Frontend System Design. All three kits, one price, lifetime access.',
        price: 499,
        originalPrice: 647, // honest anchor: 149 + 199 + 299
        duration: 'Lifetime',
        badge: 'BEST VALUE',
        isBundle: true,
        features: [
            'JS Interview Preparation Kit (worth ₹149)',
            'React.js Interview Preparation Kit (worth ₹199)',
            'Frontend System Design Kit (worth ₹299)',
            'Save ₹148 vs buying the three separately',
            'Everything already spent on any kit is credited toward this',
            'Regular updates to all three kits included',
            'Lifetime access',
        ],
    },
    'nodejs-kit': {
        id: 'nodejs-kit',
        name: 'Node.js Backend Mastery Kit',
        tagline: 'Master Node.js for backend interviews',
        price: 299,
        originalPrice: 1499,
        duration: 'Lifetime',
        comingSoon: true,
        features: ['System Design', 'Database Modeling', 'API Security', 'Performance Scaling', 'Lifetime access'],
    },
};

/** Helper: look up a kit by ID — returns undefined if not found */
export function getKitById(kitId: string): KitCatalogItem | undefined {
    return KIT_CATALOG[kitId];
}

/* ─── Legacy helper (backward-compat) ───────────────────────────
 *  Still used by some components. Derives values from the catalog.
 * ─────────────────────────────────────────────────────────────── */
export function appConstants() {
    return {
        all_access_price: KIT_CATALOG['complete-access-kit'].price,
        all_access_original_price: KIT_CATALOG['complete-access-kit'].originalPrice,
        js_kit_price: KIT_CATALOG['js-kit'].price,
        complete_kit_price: KIT_CATALOG['complete-kit'].price,
        experiences_kit_price: KIT_CATALOG['experiences-kit'].price,
        react_kit_price: KIT_CATALOG['react-kit'].price,
        js_kit_original_price: KIT_CATALOG['js-kit'].originalPrice,
        complete_kit_original_price: KIT_CATALOG['complete-kit'].originalPrice,
        experiences_kit_original_price: KIT_CATALOG['experiences-kit'].originalPrice,
        react_kit_original_price: KIT_CATALOG['react-kit'].originalPrice,
        discount_percentage: 90,
        discount_ios_percentage: 50,
        js_kit_plan_name: KIT_CATALOG['js-kit'].name,
        complete_kit_plan_name: KIT_CATALOG['complete-kit'].name,
        experiences_kit_plan_name: KIT_CATALOG['experiences-kit'].name,
    }
}

/** UI-facing name for a kit — prefers displayName, falls back to the plan name. */
export function getKitDisplayName(kitId: string): string {
    const kit = KIT_CATALOG[kitId];
    if (!kit) return kitId;
    return kit.displayName ?? kit.name;
}

/** Every kit SKU that can actually be bought right now. */
export function getPurchasableKits(): KitCatalogItem[] {
    return Object.values(KIT_CATALOG).filter((k) => !k.comingSoon);
}

/**
 * Slugs the bundle grants. Single source of truth for "what is in the bundle".
 * Deliberately excludes comingSoon kits and the retired placement kit.
 */
export const BUNDLE_SLUGS = PLAN_TO_SLUGS['Complete Kit All Access Bundle'];
