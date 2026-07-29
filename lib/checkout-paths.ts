// lib/checkout-paths.ts
//
// "Which checkout page sells this kit?" — one implementation.
//
// WHY THIS EXISTS
// ---------------
// This rule had drifted into three copies (dashboard, /learn, /learn/[kitSlug])
// and they no longer agreed: the two under /learn had never learnt about the
// DevOps or Java SKUs, so an upsell shown to a Java-kit previewer sent them to
// the generic products anchor instead of Java checkout. Matching on kit names
// is inherently fiddly (see the java/javascript note below) and is not a thing
// to get right in more than one file.
//
// Callers pass whatever text they have — a DB slug, or "<name> <slug>" — and
// the match is substring-based so both work.

/**
 * @param label A kit slug ("java-interview-kit") or "<name> <slug>". Case-insensitive.
 * @returns A path suitable for a <Link href>.
 */
export function getCheckoutPathForKit(label: string): string {
    const text = label.toLowerCase();

    // Order matters: check "node"/"angular" before "js" — "node.js" contains "js".
    // DevOps has no /checkout/[kit] page — that SKU is sold through /pay.
    if (text.includes('devops')) return '/pay?kit=devops-kit';

    /* ⚠️  Java must be a WORD match, never a substring: "javascript..." contains
     * "java", so `text.includes('java')` would send JS buyers to Java checkout.
     * `\bjava\b` cannot match inside "javascript" (no boundary after "java"). */
    if (/\bjava\b/.test(text)) return '/checkout/java';

    if (text.includes('angular')) return '/checkout/angular';
    if (text.includes('node')) return '/checkout/nodejs';
    if (text.includes('complete')) return '/checkout/complete';
    if (text.includes('react')) return '/checkout/react';
    if (text.includes('javascript') || text.includes('js')) return '/checkout/javascript';

    // Placement SKU retired — see lib/appConstants.ts. Existing buyers keep
    // access; everyone else goes to pricing.
    if (text.includes('placement')) return '/#pricing';

    return '/#products';
}
