'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * PresenceTracker — pings POST /api/presence so the admin Live Users view knows
 * who is online and what page they're on, and so /admin/page-analytics can
 * count which pages get visited.
 *
 * Renders null and does NOT wrap `children`, so it's safe in the root layout:
 * the CLAUDE.md styled-jsx SSR warning is about mounting next-themes as a global
 * usePathname()-based wrapper around the tree, which this is not.
 *
 * It reports the pathname PLUS the `tab` query param, because the dashboard's
 * pages ARE tabs — Jobs and Roadmaps are both `/dashboard`, and on pathname
 * alone every dashboard visit collapses into one indistinguishable row. No
 * other param is forwarded: query strings elsewhere on the site carry emails,
 * reset tokens and redirect targets that have no business in a behaviour log.
 *
 * useSearchParams() opts its subtree out of static prerendering, so this
 * component must stay inside a <Suspense> boundary in the root layout —
 * otherwise it deopts every page on the site.
 *
 * To keep signed-out visitors from invoking the endpoint on every page of the
 * marketing site, it only pings when the readable `gf_online` flag cookie is
 * present (set alongside the HttpOnly session at login, cleared at logout). The
 * server still verifies the real gf_session on every hit — the flag is only a
 * client-side "worth pinging?" hint, never trusted for auth.
 */

const HEARTBEAT_MS = 45_000;

function isLoggedIn(): boolean {
    if (typeof document === 'undefined') return false;
    return /(?:^|;\s*)gf_online=1(?:;|$)/.test(document.cookie);
}

export function PresenceTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /**
     * The reported location. On /dashboard an absent `tab` is reported as
     * `overview` because that is the tab the page actually renders
     * (`searchParams.get("tab") || "overview"` in app/dashboard/page.tsx) —
     * reporting a bare /dashboard would file real Overview views under
     * "tab not recorded".
     */
    const tab = searchParams.get('tab');
    let location = pathname;
    if (pathname === '/dashboard') {
        location = `/dashboard?tab=${encodeURIComponent(tab || 'overview')}`;
    } else if (tab) {
        location = `${pathname}?tab=${encodeURIComponent(tab)}`;
    }

    // Keep the interval callback reading the latest location without re-arming it.
    const locationRef = useRef(location);
    locationRef.current = location;

    const send = (type: 'pageview' | 'heartbeat', path: string) => {
        // Skip signed-out visitors (no serverless hit) and the admin's own
        // browsing of the admin panel.
        if (!isLoggedIn() || path.startsWith('/admin')) return;
        fetch('/api/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, type }),
            keepalive: true,
        }).catch(() => { /* presence is best-effort */ });
    };

    // Fire a pageview whenever the route OR the tab changes (and on first mount).
    useEffect(() => {
        send('pageview', location);
    }, [location]);

    // Heartbeat while the tab is visible, so idle-but-open users stay "online".
    useEffect(() => {
        const beat = () => {
            if (document.visibilityState === 'visible') {
                send('heartbeat', locationRef.current);
            }
        };
        const interval = setInterval(beat, HEARTBEAT_MS);
        // Also beat immediately when the user returns to the tab.
        const onVisible = () => {
            if (document.visibilityState === 'visible') beat();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    return null;
}
