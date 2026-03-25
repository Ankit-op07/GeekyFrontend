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
    // JS variants
    "JavaScript Interview Mastery Kit": ["javascript"],
    "JS Interview Preparation Kit": ["javascript"],
    // React variants
    "Reactjs Interview Preparation Kit": ["react"],
    "React.js Interview Preparation Kit": ["react"],
    // Node variants
    "Node.js Interview Preparation Kit": ["node"],
    "Node.js Backend Mastery Kit": ["node"],
    // Complete — grants access to all
    "Complete Frontend Interview Preparation Kit": ["javascript", "react", "node", "frontend", "complete"],
    // Experiences
    "Frontend Interview Experiences Kit": ["frontend", "experiences"],
    // Placement
    "Ultimate Campus Placement Kit": ["placement", "campus"],
    // Company kits (DSA)
    "Company Wise DSA Kit — 3 Months": ["company"],
    "Company Wise DSA Kit — 6 Months": ["company"],
    "Company Wise DSA Kit — Lifetime": ["company"],
};

/**
 * Given a user's purchasedKits array, return the set of slug substrings
 * that the user should have access to.
 */
export function getAllowedSlugs(purchasedKits: string[]): Set<string> | 'all' {
    const slugs = new Set<string>();
    for (const plan of purchasedKits) {
        const mapped = PLAN_TO_SLUGS[plan];
        if (mapped) {
            mapped.forEach(s => slugs.add(s));
        }
    }
    // "Complete" kit grants everything
    if (slugs.size >= 4) return 'all';
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
        tagline: 'Everything you need to succeed',
        price: 299,
        originalPrice: 2999,
        duration: 'Lifetime',
        badge: 'BEST VALUE',
        features: [
            'JS Interview Preparation Kit content included',
            'Resources to learn Frontend (Gold Mine)',
            'React interview questions & patterns',
            'HTML & CSS mastery for interview questions',
            'Web performance and security',
            'DSA for Frontend: Must know problems',
            'Machine coding practice: components & mini-apps',
            'Cold Email Templates and How to Cold email guide (Bonus)',
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
        tagline: 'Master React concepts for interviews',
        price: 199,
        originalPrice: 1999,
        duration: 'Lifetime',
        features: [
            'Machine Coding Rounds',
            'System Design for UI',
            'Core React Concepts',
            'Performance Optimization',
            'Regular updates included',
            'Lifetime access',
        ],
    },
    'company-kit-3m': {
        id: 'company-kit-3m',
        name: 'Company Wise DSA Kit — 3 Months',
        tagline: '3 months of company-wise DSA prep',
        price: 299,
        originalPrice: 599,
        duration: '3 Months',
        features: ['Complete Company Questions', '24/7 Access', 'Detailed Solutions', 'Regular Updates'],
    },
    'company-kit-6m': {
        id: 'company-kit-6m',
        name: 'Company Wise DSA Kit — 6 Months',
        tagline: '6 months of company-wise DSA prep',
        price: 599,
        originalPrice: 999,
        duration: '6 Months',
        badge: 'POPULAR',
        features: ['Everything in 3 Months', 'Priority Updates', 'Mock Interviews Access', 'Expert Support'],
    },
    'company-kit-lifetime': {
        id: 'company-kit-lifetime',
        name: 'Company Wise DSA Kit — Lifetime',
        tagline: 'Lifetime company-wise DSA access',
        price: 899,
        originalPrice: 1999,
        duration: 'Lifetime',
        badge: 'BEST VALUE',
        features: ['Pay once, access forever', 'All future updates free', 'VIP Support', 'Priority Access'],
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
        company_kit_price: KIT_CATALOG['company-kit-3m'].price,
        js_kit_original_price: KIT_CATALOG['js-kit'].originalPrice,
        complete_kit_original_price: KIT_CATALOG['complete-kit'].originalPrice,
        experiences_kit_original_price: KIT_CATALOG['experiences-kit'].originalPrice,
        react_kit_original_price: KIT_CATALOG['react-kit'].originalPrice,
        company_kit_original_price: KIT_CATALOG['company-kit-3m'].originalPrice,
        discount_percentage: 90,
        discount_ios_percentage: 50,
        js_kit_plan_name: KIT_CATALOG['js-kit'].name,
        complete_kit_plan_name: KIT_CATALOG['complete-kit'].name,
        experiences_kit_plan_name: KIT_CATALOG['experiences-kit'].name,
        company_kit_plan_name: KIT_CATALOG['company-kit-3m'].name,

        // Company Wise Kit Pricing Tiers
        company_kit_plans: {
            '3m': {
                id: '3m',
                name: '3 Months',
                duration: '3 months',
                durationDays: 90,
                price: KIT_CATALOG['company-kit-3m'].price,
                originalPrice: KIT_CATALOG['company-kit-3m'].originalPrice,
                perMonth: 100,
                popular: false,
            },
            '6m': {
                id: '6m',
                name: '6 Months',
                duration: '6 months',
                durationDays: 180,
                price: KIT_CATALOG['company-kit-6m'].price,
                originalPrice: KIT_CATALOG['company-kit-6m'].originalPrice,
                perMonth: 100,
                popular: true,
            },
            'lifetime': {
                id: 'lifetime',
                name: 'Lifetime',
                duration: 'Forever',
                durationDays: 36500,
                price: KIT_CATALOG['company-kit-lifetime'].price,
                originalPrice: KIT_CATALOG['company-kit-lifetime'].originalPrice,
                perMonth: null,
                popular: false,
                bestValue: true,
            },
        },
    }
}