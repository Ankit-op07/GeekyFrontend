import { getPurchasableKits } from '@/lib/appConstants';
import { normaliseCode, isValidCodeFormat, MAX_PERCENT } from '@/lib/coupon-math';

/**
 * Validation for the admin coupon form.
 *
 * Lives in lib/ rather than beside the route because Next's App Router only
 * permits its own exports from a `route.ts`, and both the create (POST) and
 * edit (PATCH) routes need exactly these rules — one copy, so a coupon cannot
 * be created invalid or edited into an invalid state.
 *
 * This guards INTENT, not security: every value is re-read from the DB when a
 * price is computed. The point is to stop an admin shipping a campaign that
 * quietly does the wrong thing — the classic one being "50" typed into the
 * percent field when ₹50 was meant, which is a 50% discount on every sale.
 */
export interface CouponPayload {
    code?: string;
    kind?: 'percent' | 'flat';
    value?: number;
    maxDiscount?: number | null;
    minOrderValue?: number;
    maxRedemptions?: number | null;
    maxPerUser?: number;
    appliesTo?: string[];
    validFrom?: string | null;
    validUntil?: string | null;
    [key: string]: unknown;
}

/**
 * @param body     the submitted payload
 * @param options  `partial` skips checks for fields the payload omits (PATCH).
 *                 Pass `kind` so a percent cap can be enforced on an edit that
 *                 changes only the value.
 * @returns a human-readable error, or null when the payload is sound
 */
export function validateCouponPayload(
    body: CouponPayload,
    options: { partial?: boolean; kind?: 'percent' | 'flat' } = {},
): string | null {
    const { partial = false } = options;
    const has = (k: string) => body[k] !== undefined && body[k] !== null && body[k] !== '';

    if (!partial || has('code')) {
        if (!isValidCodeFormat(normaliseCode(String(body.code ?? '')))) {
            return 'Code must be 3–24 characters: letters, numbers, - or _, starting with a letter or number.';
        }
    }

    if (!partial || has('kind')) {
        if (body.kind !== 'percent' && body.kind !== 'flat') {
            return 'Discount type must be "percent" or "flat".';
        }
    }

    // On an edit that touches only `value`, the kind comes from the stored row.
    const effectiveKind = body.kind ?? options.kind;

    if (!partial || has('value')) {
        const value = Number(body.value);
        if (!Number.isFinite(value) || value < 1) return 'Value must be at least 1.';
        if (effectiveKind === 'percent' && value > MAX_PERCENT) {
            return `A percent coupon cannot exceed ${MAX_PERCENT}%. For a deeper discount, use a flat ₹ amount.`;
        }
    }

    if (has('maxDiscount') && Number(body.maxDiscount) < 0) return 'Max discount cannot be negative.';
    if (has('minOrderValue') && Number(body.minOrderValue) < 0) return 'Minimum order cannot be negative.';
    if (has('maxRedemptions') && Number(body.maxRedemptions) < 1) {
        return 'Total redemptions must be at least 1 — leave it blank for unlimited.';
    }
    if (has('maxPerUser') && Number(body.maxPerUser) < 1) return 'Per-user limit must be at least 1.';

    if (body.appliesTo !== undefined) {
        if (!Array.isArray(body.appliesTo)) return 'appliesTo must be a list of kit ids.';
        const valid = new Set(getPurchasableKits().map((k) => k.id));
        const unknown = body.appliesTo.find((id) => !valid.has(id));
        if (unknown) return `Unknown kit: ${unknown}`;
    }

    if (has('validFrom') && Number.isNaN(Date.parse(String(body.validFrom)))) return 'Invalid start date.';
    if (has('validUntil') && Number.isNaN(Date.parse(String(body.validUntil)))) return 'Invalid end date.';
    if (
        has('validFrom') &&
        has('validUntil') &&
        Date.parse(String(body.validFrom)) > Date.parse(String(body.validUntil))
    ) {
        return 'The offer cannot end before it starts.';
    }

    return null;
}
