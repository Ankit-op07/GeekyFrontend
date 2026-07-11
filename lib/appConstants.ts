/* ─── Centralized Kit Catalog ────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH for every kit across the app.
 *  The `id` is the only thing that travels through URLs and APIs.
 *  Prices are resolved server-side — never trust the client.
 * ─────────────────────────────────────────────────────────────── */

export interface KitCatalogItem {
    id: string;
    name: string;
    tagline: string;
    price: number;
    originalPrice: number;
    duration: string;
    badge?: string;
    features: string[];
    comingSoon?: boolean;
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
    // Complete kit — its OWN kit only, does NOT include JS/React/Node
    "Complete Frontend Interview Preparation Kit": ["complete"],
    // Experiences
    "Frontend Interview Experiences Kit": ["experiences"],
    // Placement
    "Ultimate Campus Placement Kit": ["placement"],
};

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
    'complete-kit': {
        id: 'complete-kit',
        name: 'Complete Frontend Interview Preparation Kit',
        tagline: '25 chapters. 570+ questions and practice items. 127,000+ words of frontend interview preparation.',
        price: 299,
        originalPrice: 2999,
        duration: 'Lifetime',
        badge: 'BEST VALUE',
        features: [
            '25 structured chapters from HTML basics to frontend system design',
            '570+ interview questions, coding problems, and practice items',
            '91 detailed articles with interview-ready answers and code examples',
            '180 DSA problems with JavaScript solutions and complexity analysis',
            '42 frontend system design walkthroughs using the RADIO framework',
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
    'placement-kit': {
        id: 'placement-kit',
        name: 'Ultimate Campus Placement Kit',
        tagline: 'Complete campus placement preparation',
        price: 199,
        originalPrice: 999,
        duration: 'Lifetime',
        features: ['Resume Templates', 'Aptitude Q&A', 'HR Interview Tips', 'Core CS Subjects', 'Lifetime access'],
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
