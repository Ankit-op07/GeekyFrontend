/* ─── Pure coupon math ──────────────────────────────────────────────────────
 *  NO imports on purpose — the same rule as lib/pricing-math.ts. This file is
 *  dependency-free so the discount rules can be unit-tested without a DB, Next
 *  or mongoose (`npm run test:coupons`). All money values are whole ₹.
 *
 *  ORDER OF OPERATIONS (the thing to get right):
 *
 *      listPrice
 *        − upgrade credit        (lib/pricing-math.ts, capped at MIN_TOPUP)
 *        = payableBeforeCoupon
 *        − coupon discount       (THIS file, floored at MIN_PAYABLE)
 *        = payable   ← what Razorpay is asked to charge
 *
 *  A percent coupon is applied to `payableBeforeCoupon`, NOT to `listPrice`.
 *  Applying it to listPrice would double-dip: a user with ₹350 of upgrade
 *  credit on the ₹499 bundle pays ₹149, and a 50% coupon computed off ₹499
 *  would take ₹249 off a ₹149 bill — i.e. we'd owe them money.
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Floor for what a coupon may leave payable, in ₹.
 *
 * Two reasons this is not 0:
 *   1. Razorpay rejects orders below ₹1, so a 100%-off code would break the
 *      checkout rather than gift the kit — a silent, confusing failure.
 *   2. A paid order is what proves intent and creates the Order row that our
 *      upgrade credit and refunds are computed from. Free grants must go
 *      through /admin/access, not through the payment gateway.
 *
 * To genuinely give a kit away, use the admin grant-access flow.
 */
export const MIN_PAYABLE = 49;

/** Hard ceiling on a percent coupon. Anything deeper is almost certainly a typo. */
export const MAX_PERCENT = 90;

export type CouponKind = 'percent' | 'flat';

/** The only fields of a coupon the math cares about. */
export interface CouponRule {
    kind: CouponKind;
    /** percent → 1..MAX_PERCENT, flat → ₹ off. */
    value: number;
    /** Cap on a percent discount, in ₹. null/0/undefined = uncapped. */
    maxDiscount?: number | null;
}

export interface CouponMath {
    /** ₹ actually taken off. Always an integer ≥ 0. */
    discount: number;
    /** ₹ the user pays after the coupon. Never below MIN_PAYABLE (unless the
     *  pre-coupon amount was already below it, in which case it is unchanged). */
    payable: number;
    /** True when the raw discount had to be reduced to respect MIN_PAYABLE. */
    floored: boolean;
    /** True when a percent discount was reduced by `maxDiscount`. */
    capped: boolean;
}

/**
 * THE pure coupon rule.
 *
 * @param payableBeforeCoupon  ₹ owed after upgrade credit, before this coupon
 * @param rule                 the coupon's kind/value/cap
 */
export function applyCouponMath(
    payableBeforeCoupon: number,
    rule: CouponRule,
): CouponMath {
    const base = normaliseMoney(payableBeforeCoupon);

    // Nothing to discount (free/invalid base) → no-op rather than a negative bill.
    if (base <= 0) {
        return { discount: 0, payable: base, floored: false, capped: false };
    }

    const value = normaliseMoney(rule.value);
    if (value <= 0) {
        return { discount: 0, payable: base, floored: false, capped: false };
    }

    // ── Raw discount ────────────────────────────────────────────────────────
    // floor(), never round(): rounding up hands out ₹1 more than the coupon
    // promises on odd amounts, and that ₹1 is real money times every redemption.
    let raw: number;
    let capped = false;
    if (rule.kind === 'percent') {
        const pct = Math.min(value, MAX_PERCENT);
        raw = Math.floor((base * pct) / 100);
        const cap = normaliseMoney(rule.maxDiscount ?? 0);
        if (cap > 0 && raw > cap) {
            raw = cap;
            capped = true;
        }
    } else {
        raw = value;
    }

    // ── Floors ──────────────────────────────────────────────────────────────
    // A coupon may never take the bill below MIN_PAYABLE. If the bill is
    // already at/below the floor (a deeply credited bundle upgrade), the coupon
    // simply does nothing — it must not push the charge below what Razorpay
    // accepts, and it must not go negative.
    const maxAllowed = Math.max(base - MIN_PAYABLE, 0);
    const discount = Math.min(raw, maxAllowed);

    return {
        discount,
        payable: base - discount,
        floored: raw > maxAllowed,
        capped,
    };
}

/**
 * Pick the deepest discount among several candidate rules — used for
 * auto-applied offers, where the buyer types nothing and we must not show them
 * a worse deal than one we were willing to give.
 *
 * Ties keep the FIRST rule, so callers control precedence by ordering.
 * Returns null when no rule produces a discount.
 */
export function bestCouponMath<T extends CouponRule>(
    payableBeforeCoupon: number,
    rules: T[],
): { rule: T; math: CouponMath } | null {
    let best: { rule: T; math: CouponMath } | null = null;
    for (const rule of rules) {
        const math = applyCouponMath(payableBeforeCoupon, rule);
        if (math.discount <= 0) continue;
        if (!best || math.discount > best.math.discount) best = { rule, math };
    }
    return best;
}

/**
 * Total the buyer saves versus the catalog anchor — the one number that drives
 * the "you save ₹X" line. Kept here so every surface computes it identically.
 */
export function totalSavings(
    originalPrice: number,
    payable: number,
): number {
    const saved = normaliseMoney(originalPrice) - normaliseMoney(payable);
    return saved > 0 ? saved : 0;
}

/** Codes are stored and compared in one canonical form: UPPERCASE, no spaces. */
export function normaliseCode(code: string): string {
    return String(code ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * A code must be typeable and unambiguous. Rejects the characters that get
 * mistyped from a screenshot or a reel, and anything a URL would have to encode.
 */
export function isValidCodeFormat(code: string): boolean {
    return /^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code);
}

/** Guards a DB-read number so a corrupt row can't produce a NaN bill. */
function normaliseMoney(n: unknown): number {
    const v = Number(n);
    if (!Number.isFinite(v) || v < 0) return 0;
    return Math.floor(v);
}
