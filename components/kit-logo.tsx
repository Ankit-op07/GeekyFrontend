import type { ReactNode } from 'react';

/**
 * Brand logos for the kits that have official artwork in `public/Kit logos/`.
 * Any kit slug / round id / plan name that matches one of these gets the real
 * logo instead of an emoji. Kits without a logo (placement, experiences,
 * machine-coding round, HR round, …) fall back to their emoji.
 *
 * Match is substring-based so DB slugs ("angular-interview-kit"), round ids
 * ("javascript"), and plan names ("Node.js Backend Mastery Kit") all resolve.
 * Space in the folder name is URL-encoded so the path is valid without relying
 * on the browser to fix it.
 */

/* The all-access BUNDLE, which must never pick up the Frontend System Design
 * logo even though its ids/names also contain the word "complete":
 *   id "complete-access-kit" · id "all-access" · "Complete Kit All Access
 *   Bundle" · "Complete Kit — All 3 Kits, One Price" · display name "Complete Kit".
 * The bundle grants three kits; branding it as one of them is wrong.
 *
 * ⚠️  The last alternative is "complete kit" with a SPACE, deliberately. The
 * bundle is always written for humans ("Complete Kit"); the Frontend System
 * Design kit's own id is hyphenated ("complete-kit") and must keep its logo.
 * Do not relax that space to [-\s] — it would blank the kit's logo at checkout. */
const BUNDLE_KEY = /complete[-\s]?access|all[-\s]?access|all 3 kits|complete kit/i;

const KIT_LOGOS: { test: RegExp; exclude?: RegExp; src: string }[] = [
    { test: /react/i, src: '/Kit%20logos/React.png' },
    /* ⚠️  MUST stay above the JavaScript rule. `\bjava\b` cannot match
     * "JavaScript" (there is no word boundary after "java" there), so the two
     * never cross-match — the ordering is belt-and-braces so that a future
     * loosening of either pattern shows up in review instead of silently
     * putting the JS logo on the Java kit. */
    { test: /\bjava\b/i, src: '/Kit%20logos/java.svg' },
    { test: /angular/i, src: '/Kit%20logos/angular.png' },
    /* ⚠️  MUST stay above the Node rule: "devops-engineering-kit" does not
     * contain "node", but keep the ordering explicit so a future loosening of
     * either pattern surfaces in review. */
    { test: /devops/i, src: '/Kit%20logos/devopsEngineering.png' },
    { test: /node/i, src: '/Kit%20logos/nodejs.svg' },
    /* Frontend System Design Kit. Renamed 2026-07; its DB slug, checkout id and
     * legacy plan name all still say "complete" ("complete-frontend-kit",
     * "complete-kit", "Complete Frontend Interview Preparation Kit"), so both
     * spellings must match — minus the bundle, see BUNDLE_KEY above. */
    { test: /system[-\s]?design|\bcomplete\b/i, exclude: BUNDLE_KEY, src: '/Kit%20logos/frontendSystemDesign.png' },
    { test: /javascript|(^|[^a-z])js([^a-z]|$)/i, src: '/Kit%20logos/JavaScript.svg' },
];

/** Returns the logo path for a kit key, or null when no official logo exists. */
export function getKitLogo(key?: string | null): string | null {
    if (!key) return null;
    for (const { test, exclude, src } of KIT_LOGOS) {
        if (exclude?.test(key)) continue;
        if (test.test(key)) return src;
    }
    return null;
}

/**
 * Renders the kit's brand logo when one exists, otherwise the provided
 * `fallback` (an emoji, an icon, …). `imgClassName` controls the <img> size;
 * pass the same sizing you'd give the fallback so the tile stays consistent.
 */
export function KitLogo({
    nameKey,
    fallback,
    imgClassName = 'w-6 h-6 object-contain',
    alt = '',
}: {
    nameKey?: string | null;
    fallback?: ReactNode;
    imgClassName?: string;
    alt?: string;
}) {
    const src = getKitLogo(nameKey);
    if (!src) return <>{fallback ?? null}</>;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={imgClassName} />;
}
