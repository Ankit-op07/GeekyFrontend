/* ─── Pure pricing math ─────────────────────────────────────────────────────
 *  NO imports on purpose: this file is dependency-free so the pricing rules can
 *  be unit-tested without a DB, Next, or mongoose. All money values are whole ₹.
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Minimum an upgrade to the bundle can ever cost, in ₹.
 *
 * This is the single business dial for upgrade generosity. It caps how much
 * prior spend may be credited toward the bundle, so the *last* kit is never
 * near-free: a user who already owns two kits (React ₹199 + Frontend ₹299 =
 * ₹498 ≈ the ₹499 bundle) would otherwise get the third for ~₹1.
 *
 *   ₹149 — strictest; the last kit always costs ~its standalone price.
 *   ₹99  — softer; a small loyalty discount on the last kit.
 *   ₹49  — the old floor; effectively gives the last kit away.
 */
export const MIN_TOPUP = 149;

export interface QuoteMath {
    /** Credit actually applied, in ₹. Invariant: credit + payable === listPrice. */
    credit: number;
    /** What the user pays now, in ₹. For the bundle, never below MIN_TOPUP. */
    payable: number;
    /** True when prior spend exceeded the credit cap (credit was clamped). */
    floored: boolean;
}

/**
 * THE pure pricing rule.
 *
 *  Rule 1 — credit only flows toward the bundle (a superset of the single kits).
 *           A standalone kit is always full price; owning JS does NOT discount
 *           React, because React does not contain JS.
 *  Rule 2 — bundle credit is capped at (listPrice − MIN_TOPUP), so upgrading to
 *           all-access always costs at least MIN_TOPUP.
 *
 * @param isBundle      is the target the all-access bundle?
 * @param listPrice     catalog price of the target kit, in ₹
 * @param bundleCredit  ₹ the user has already spent on kits the bundle is built
 *                      from (0 for logged-out users or no prior in-bundle spend)
 */
export function quoteUpgradeMath(
    isBundle: boolean,
    listPrice: number,
    bundleCredit: number,
): QuoteMath {
    // Rule 1: no cross-credit toward a standalone kit — always full price.
    if (!isBundle) {
        return { credit: 0, payable: listPrice, floored: false };
    }

    // Rule 2: cap credit so payable can never drop below MIN_TOPUP.
    const creditCap = Math.max(listPrice - MIN_TOPUP, 0);
    const safeCredit =
        Number.isFinite(bundleCredit) && bundleCredit > 0 ? bundleCredit : 0;
    const credit = Math.min(safeCredit, creditCap);
    const payable = listPrice - credit; // ≥ MIN_TOPUP by construction

    return { credit, payable, floored: safeCredit > creditCap };
}
