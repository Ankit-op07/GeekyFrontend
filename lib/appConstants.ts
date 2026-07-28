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
    // Angular kit — fragment matches the DB Kit.slug "angular-interview-kit"
    "Angular Interview Preparation Kit": ["angular"],
    // Node kit
    "Node.js Interview Preparation Kit": ["node"],
    "Node.js Backend Mastery Kit": ["node"],
    // DevOps kit — fragment matches the DB Kit.slug "devops-engineering-kit"
    "DevOps Engineering Kit": ["devops"],
    /* Java kit — PRD-009.
     * ⚠️  The fragment MUST be "java-interview", never "java".
     * Access matching is a SUBSTRING test (resolveTopicAccess in lib/learn-access.ts:
     *   kitSlug.toLowerCase().includes(fragment)
     * ) and "javascript-interview-kit".includes("java") is TRUE — a bare "java"
     * fragment would silently hand every Java buyer the JavaScript kit for free.
     * The reverse is safe: "java-interview-kit".includes("javascript") is false. */
    "Java Interview Preparation Kit": ["java-interview"],
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
 * AI Interview (turn-based, Gemini Flash). MODEL matches the existing admin
 * Gemini routes. DAILY_LIMIT caps interviews started per user per day (cost
 * control); QUESTION_COUNT is how many questions one interview asks before the
 * graded report.
 */
export const AI_INTERVIEW = {
    // Asking the next question needs no deep reasoning → cheapest lite model.
    // Grading benefits from a stronger model. Both use "-latest" aliases so a
    // Google model retirement (e.g. gemini-2.0-flash) doesn't break us, and both
    // run with thinking DISABLED (see lib/gemini.ts) to kill the token cost.
    QUESTION_MODEL: 'gemini-flash-lite-latest',
    GRADE_MODEL: 'gemini-flash-latest',
    DAILY_LIMIT: 3,
    QUESTION_COUNT: 4,
    // Live voice mode (Gemini Live native audio). Far pricier than text (audio
    // tokens), so it has its OWN daily counter and a hard per-session length cap.
    LIVE_MODEL: 'gemini-2.5-flash-native-audio-latest',
    VOICE_DAILY_LIMIT: 2,
    VOICE_MAX_SECONDS: 300,
} as const;

/*
 * The old UPGRADE_FLOOR (₹49) has been removed. Upgrade pricing now lives in
 * lib/pricing-math.ts as MIN_TOPUP (₹149) — a credit CAP, not just a payment
 * floor. See lib/pricing.ts.
 */

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
    'angular-kit': {
        id: 'angular-kit',
        name: 'Angular Interview Preparation Kit',
        tagline: '8 modules · 40 in-depth topics · 63 diagrams — components, DI, RxJS, signals & change detection.',
        price: 199,
        originalPrice: 1999,
        duration: 'Lifetime',
        badge: 'NEW',
        features: [
            '40 in-depth topics across 8 structured modules',
            '63 explanatory diagrams (RxJS marbles, DI injector tree, change detection & more)',
            'Deep dives: components, directives, pipes, DI, RxJS, routing, forms, change detection',
            'Modern Angular (v17+): standalone, signals, @if/@for, functional guards & interceptors',
            '150+ interview questions with model answers and common traps',
            'Common mistakes, gotchas & best practices for every topic',
            'Last-minute revision cheat-cards',
            'Lifetime updates included',
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
        tagline: '15 modules · 70 in-depth topics · 100+ diagrams — event loop, async, streams, Express, REST, databases, auth & security, testing, scaling and production.',
        price: 299,
        originalPrice: 2999,
        duration: 'Lifetime',
        badge: 'BACKEND',
        features: [
            '70 in-depth topics across 15 structured modules',
            '100+ explanatory diagrams (event loop, streams, DB, auth flows & more)',
            'Deep dives: event loop, async patterns, streams, HTTP, Express, REST, databases',
            'Auth & security, error handling, testing, scaling, production & advanced backend',
            '200+ interview questions with model answers and common traps',
            'Common mistakes, gotchas & best practices for every topic',
            'Last-minute revision cheat-cards',
            'Lifetime updates included',
        ],
    },
    /* PRD-009 — Core Java + Spring Boot. Sold standalone; deliberately NOT part
     * of the All-Access bundle (adding it would hand every past bundle buyer a
     * kit they never paid for and break the bundle's honest ₹647 anchor). */
    'java-kit': {
        id: 'java-kit',
        name: 'Java Interview Preparation Kit',
        /* LIVE — 14 modules, 65 topics, 53 animated diagrams, 200 quiz questions.
         * Figures are COUNTED from scripts/java-content, not aspirational:
         *   node scripts/seed-java-kit.js   prints chapters/topics/diagrams.
         * Went on sale 2026-07-28 (comingSoon removed). Keep these numbers in
         * step with the content — they are a promise to a paying buyer. */
        tagline: '14 modules · 65 in-depth topics · 53 animated diagrams — core Java, collections internals, concurrency, the JVM, modern Java 17/21 and Spring Boot, built for interviews.',
        price: 299,
        originalPrice: 2999,
        duration: 'Lifetime',
        badge: 'NEW',
        features: [
            '65 in-depth topics across 14 structured modules',
            '53 animated, theme-aware diagrams (HashMap internals, GC, thread lifecycle & more)',
            'Deep dives: OOP, collections internals, generics, exceptions & functional Java',
            'Concurrency, the Java Memory Model, JVM internals & garbage collection',
            'Modern Java 17→21: records, sealed types, pattern matching, virtual threads',
            'Spring Core, Spring Boot, Spring Data JPA, REST, security & testing',
            'Design patterns, SOLID and Java LLD walkthroughs',
            'Interview questions with model answers and common traps on every topic',
            'Last-minute revision cheat-cards',
            'Lifetime updates included',
        ],
    },
    'devops-kit': {
        id: 'devops-kit',
        name: 'DevOps Engineering Kit',
        tagline: '14 modules · 52 in-depth topics · 130+ animated diagrams — Linux, Git, Docker, Kubernetes, CI/CD, Terraform, cloud, observability, SRE & DevSecOps, built for interviews and the job.',
        price: 399,
        originalPrice: 3999,
        duration: 'Lifetime',
        badge: 'NEW',
        features: [
            '52 in-depth topics across 14 structured modules',
            '130+ animated, theme-aware diagrams (the DevOps loop, CI/CD, Kubernetes & more)',
            'Deep dives: Linux, Git & GitOps, Docker, Kubernetes, CI/CD, Terraform & AWS',
            'Observability, SRE, DevSecOps & incident management',
            '150+ interview questions with model answers and common gotchas',
            'Troubleshooting drills, DevOps system design & a fresher→senior roadmap',
            'Last-minute revision cheat-sheets',
            'Lifetime updates included',
        ],
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
        angular_kit_price: KIT_CATALOG['angular-kit'].price,
        angular_kit_original_price: KIT_CATALOG['angular-kit'].originalPrice,
        angular_kit_plan_name: KIT_CATALOG['angular-kit'].name,
        nodejs_kit_price: KIT_CATALOG['nodejs-kit'].price,
        nodejs_kit_original_price: KIT_CATALOG['nodejs-kit'].originalPrice,
        nodejs_kit_plan_name: KIT_CATALOG['nodejs-kit'].name,
        devops_kit_price: KIT_CATALOG['devops-kit'].price,
        devops_kit_original_price: KIT_CATALOG['devops-kit'].originalPrice,
        devops_kit_plan_name: KIT_CATALOG['devops-kit'].name,
        java_kit_price: KIT_CATALOG['java-kit'].price,
        java_kit_original_price: KIT_CATALOG['java-kit'].originalPrice,
        java_kit_plan_name: KIT_CATALOG['java-kit'].name,
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

/**
 * Plan names whose ENTIRE grant is contained in the bundle — i.e. the single
 * live kits the bundle is built from (JS, React, Frontend System Design, and
 * their legacy aliases). Only spend on THESE plans is credited toward a bundle
 * upgrade.
 *
 * Deliberately EXCLUDES: the bundle itself, Node/Experiences/Placement (not in
 * the bundle), and any company kit. Derived from PLAN_TO_SLUGS so a newly-added
 * alias for a component kit is picked up automatically.
 */
export const BUNDLE_COMPONENT_PLANS: string[] = Object.entries(PLAN_TO_SLUGS)
    .filter(
        ([plan, slugs]) =>
            plan !== 'Complete Kit All Access Bundle' &&
            slugs.length > 0 &&
            slugs.every((slug) => BUNDLE_SLUGS.includes(slug)),
    )
    .map(([plan]) => plan);
