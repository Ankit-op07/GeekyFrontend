'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PresenceTracker — pings POST /api/presence so the admin Live Users view knows
 * who is online and what page they're on.
 *
 * Renders null and does NOT wrap `children`, so it's safe in the root layout:
 * the CLAUDE.md styled-jsx SSR warning is about mounting next-themes as a global
 * usePathname()-based wrapper around the tree, which this is not.
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
    // Keep the interval callback reading the latest path without re-arming it.
    const pathRef = useRef(pathname);
    pathRef.current = pathname;

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

    // Fire a pageview whenever the route changes (and on first mount).
    useEffect(() => {
        send('pageview', pathname);
    }, [pathname]);

    // Heartbeat while the tab is visible, so idle-but-open users stay "online".
    useEffect(() => {
        const beat = () => {
            if (document.visibilityState === 'visible') {
                send('heartbeat', pathRef.current);
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
