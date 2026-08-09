/**
 * Page analytics — turning raw `UserActivity.path` strings into countable pages.
 *
 * The behaviour log stores the literal path the visitor was on. Counting those
 * strings directly is useless: `/learn/js-kit/closures` and
 * `/learn/js-kit/hoisting` are two rows of one page ("the topic reader"), and
 * every DSA problem would be its own line in the report.
 *
 * `toPageKey()` collapses the variable part of a route to a placeholder and
 * `describePage()` puts a human label on the result. Normalisation happens at
 * READ time, not write time, so the rules can change without a backfill and
 * rows written by older deploys still roll up correctly.
 *
 * ⚠️ The dashboard's "pages" are query params, not routes — Jobs and Roadmaps
 * are both `/dashboard`, told apart only by `?tab=`. That is why the tracker
 * sends `?tab=` (and nothing else — see components/presence-tracker.tsx) and
 * why the key keeps it.
 */

export type PageGroup = 'Dashboard' | 'Learn' | 'DSA' | 'Checkout' | 'Account' | 'Marketing' | 'Other';

export interface PageDescriptor {
    /** Canonical, aggregatable identity for the page. */
    key: string;
    /** Human label for the admin table. */
    label: string;
    group: PageGroup;
}

/**
 * Dashboard tabs, keyed by the `?tab=` id used in app/dashboard/page.tsx NAV.
 * Includes the tabs currently commented out of NAV — they are still reachable
 * by URL, and a stale label is better than an unlabelled row if one returns.
 */
const DASHBOARD_TABS: Record<string, string> = {
    overview: 'Overview',
    kits: 'My Kits',
    bookmarks: 'Bookmarks',
    roadmap: 'Roadmaps',
    dsa: 'DSA Sheet',
    jobs: 'Jobs',
    profile: 'Profile',
    'ai-interview': 'AI Interview',
    'team-interview': 'Team Interview',
    leaderboard: 'Leaderboard',
};

/** Static routes we can name outright. */
const STATIC_PAGES: Record<string, { label: string; group: PageGroup }> = {
    '/': { label: 'Home (landing page)', group: 'Marketing' },
    '/contact': { label: 'Contact', group: 'Marketing' },
    '/privacy': { label: 'Privacy policy', group: 'Marketing' },
    '/terms': { label: 'Terms', group: 'Marketing' },
    '/refund': { label: 'Refund policy', group: 'Marketing' },
    '/preview': { label: 'Kit preview', group: 'Marketing' },
    '/learn': { label: 'Learn — kit picker', group: 'Learn' },
    '/pay': { label: 'Pay', group: 'Checkout' },
    '/payment-success': { label: 'Payment success', group: 'Checkout' },
    '/login': { label: 'Login', group: 'Account' },
    '/register': { label: 'Register', group: 'Account' },
    '/forgot-password': { label: 'Forgot password', group: 'Account' },
    '/reset-password': { label: 'Reset password', group: 'Account' },
};

/** Segments that are record ids rather than page identity. */
const ID_SEGMENT = /^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)$/i;

/** Strip the query, hash and trailing slash; lowercase; cap length. */
function cleanPath(raw: string): { path: string; tab: string | null } {
    const input = (raw || '').split('#')[0].slice(0, 512);
    const [rawPath, rawQuery = ''] = input.split('?');

    let path = rawPath.toLowerCase();
    if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '') || '/';
    if (!path.startsWith('/')) path = '/';

    // Only `tab` is ever read back out. Anything else a client may have sent
    // (emails, tokens, redirect targets) is dropped rather than aggregated.
    const tab = new URLSearchParams(rawQuery).get('tab');
    return { path, tab: tab ? tab.toLowerCase().slice(0, 40) : null };
}

/**
 * Collapse a recorded path to the page it represents.
 *
 * Dynamic segments become placeholders, so all 146 topic URLs count as one
 * "topic reader" page. The kit / section slug is KEPT (a bounded, meaningful
 * set — "which kit is being read" is the answer someone wants); only the
 * per-item slug below it is collapsed.
 */
export function toPageKey(rawPath: string): string {
    const { path, tab } = cleanPath(rawPath);

    if (path === '/dashboard') {
        // No tab recorded → a row written before tab tracking shipped. Kept
        // distinct rather than folded into Overview, which would invent views.
        if (!tab) return '/dashboard';
        return `/dashboard?tab=${tab in DASHBOARD_TABS ? tab : 'other'}`;
    }

    const seg = path.split('/').filter(Boolean);

    // /learn/[kitSlug]/[topicSlug]
    if (seg[0] === 'learn' && seg.length >= 3) return `/learn/${seg[1]}/:topic`;
    if (seg[0] === 'learn' && seg.length === 2) return `/learn/${seg[1]}`;

    // /dsa/[sectionSlug]/[problemSlug]
    if (seg[0] === 'dsa' && seg.length >= 3) return `/dsa/${seg[1]}/:problem`;

    // Everything else: collapse anything that looks like a record id.
    const collapsed = seg.map((s) => (ID_SEGMENT.test(s) ? ':id' : s));
    return '/' + collapsed.join('/');
}

/** Key → label + group for the admin table. */
export function describePage(key: string): PageDescriptor {
    if (key === '/dashboard') {
        return { key, label: 'Dashboard (tab not recorded — pre-tracking)', group: 'Dashboard' };
    }

    if (key.startsWith('/dashboard?tab=')) {
        const tab = key.slice('/dashboard?tab='.length);
        return {
            key,
            label: `Dashboard — ${DASHBOARD_TABS[tab] ?? 'Other tab'}`,
            group: 'Dashboard',
        };
    }

    const seg = key.split('/').filter(Boolean);

    if (seg[0] === 'learn' && seg.length >= 2) {
        const kit = seg[1];
        return {
            key,
            label: seg[2] ? `Learn — ${kit} (topic reader)` : `Learn — ${kit} (kit home)`,
            group: 'Learn',
        };
    }

    if (seg[0] === 'dsa') {
        return {
            key,
            label: seg.length >= 3 ? `DSA — ${seg[1]} (problem)` : `DSA — ${seg[1] ?? 'sheet'}`,
            group: 'DSA',
        };
    }

    if (seg[0] === 'checkout') {
        return { key, label: `Checkout — ${seg[1] ?? 'kit'}`, group: 'Checkout' };
    }

    const staticPage = STATIC_PAGES[key];
    if (staticPage) return { key, ...staticPage };

    return { key, label: key, group: 'Other' };
}
