/**
 * Meta Pixel + Conversions API helper utilities
 *
 * Usage:
 *   import { trackPurchase } from '@/lib/meta-pixel';
 *   trackPurchase({ email, phone, name, value, currency, contentName, contentIds });
 */

// ─── Cookie helpers ──────────────────────────────────────────────

/** Read a cookie value by name */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`));
    return match ? match.split('=')[1] : null;
}

/** Get Meta's _fbc (click ID) cookie */
export function getFbc(): string | null {
    return getCookie('_fbc');
}

/** Get Meta's _fbp (browser ID) cookie */
export function getFbp(): string | null {
    return getCookie('_fbp');
}

// ─── Event ID generator ─────────────────────────────────────────

/** Generate a unique event ID for deduplication between Pixel and CAPI */
export function generateEventId(): string {
    // Use crypto.randomUUID if available, fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Production domain check ────────────────────────────────────

const PRODUCTION_DOMAINS = ['geekyfrontend.com', 'geekyfrontend.in'];

export function isProductionDomain(): boolean {
    if (typeof window === 'undefined') return false;
    return PRODUCTION_DOMAINS.includes(window.location.hostname);
}

// ─── Track Purchase (Pixel + CAPI) ──────────────────────────────

interface TrackPurchaseParams {
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    value: number;
    currency?: string;
    contentName?: string;
    contentIds?: string[];
}

/**
 * Fires a Purchase event via BOTH:
 * 1. Browser-side fbq('track', 'Purchase') — for immediate attribution
 * 2. Server-side Conversions API — for reliable, ad-blocker-proof tracking
 *
 * Both use the same event_id so Meta deduplicates them.
 */
export function trackPurchase({
    email,
    phone,
    firstName,
    lastName,
    value,
    currency = 'INR',
    contentName,
    contentIds,
}: TrackPurchaseParams): void {
    // Only fire on production domains
    if (!isProductionDomain()) {
        console.log('[Meta] Skipping — not a production domain');
        return;
    }

    const eventId = generateEventId();
    const fbc = getFbc();
    const fbp = getFbp();

    // 1️⃣ Browser-side pixel event (with event ID for deduplication)
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        (window as any).fbq(
            'track',
            'Purchase',
            {
                value,
                currency,
                content_name: contentName,
                content_ids: contentIds,
            },
            { eventID: eventId }
        );
    }

    // 2️⃣ Server-side CAPI event (same event ID)
    fetch('/api/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_name: 'Purchase',
            event_id: eventId,
            user_data: {
                em: email,
                ph: phone || undefined,
                fn: firstName || undefined,
                ln: lastName || undefined,
                fbc: fbc || undefined,
                fbp: fbp || undefined,
                source_url: window.location.href,
            },
            custom_data: {
                value,
                currency,
                content_name: contentName,
                content_ids: contentIds,
            },
        }),
    }).catch((err) => console.error('[Meta] CAPI error:', err));
}

// ─── Track PageView (for manual use if needed) ──────────────────

export function trackPageView(): void {
    if (!isProductionDomain()) return;
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'PageView');
    }
}