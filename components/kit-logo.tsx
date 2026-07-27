import type { ReactNode } from 'react';

/**
 * Brand logos for the four kits that have official artwork in
 * `public/Kit logos/`. Any kit slug / round id / plan name that matches one of
 * these gets the real logo instead of an emoji. Kits without a logo (placement,
 * system-design, machine-coding round, HR round, …) fall back to their emoji.
 *
 * Match is substring-based so DB slugs ("angular-interview-kit"), round ids
 * ("javascript"), and plan names ("Node.js Backend Mastery Kit") all resolve.
 * Space in the folder name is URL-encoded so the path is valid without relying
 * on the browser to fix it.
 */
const KIT_LOGOS: { test: RegExp; src: string }[] = [
    { test: /react/i, src: '/Kit%20logos/React.png' },
    /* ⚠️  MUST stay above the JavaScript rule. `\bjava\b` cannot match
     * "JavaScript" (there is no word boundary after "java" there), so the two
     * never cross-match — the ordering is belt-and-braces so that a future
     * loosening of either pattern shows up in review instead of silently
     * putting the JS logo on the Java kit. */
    { test: /\bjava\b/i, src: '/Kit%20logos/java.svg' },
    { test: /angular/i, src: '/Kit%20logos/angular.png' },
    { test: /node/i, src: '/Kit%20logos/nodejs.svg' },
    { test: /javascript|(^|[^a-z])js([^a-z]|$)/i, src: '/Kit%20logos/JavaScript.svg' },
];

/** Returns the logo path for a kit key, or null when no official logo exists. */
export function getKitLogo(key?: string | null): string | null {
    if (!key) return null;
    for (const { test, src } of KIT_LOGOS) if (test.test(key)) return src;
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
