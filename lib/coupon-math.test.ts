import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyCouponMath,
    bestCouponMath,
    totalSavings,
    normaliseCode,
    isValidCodeFormat,
    MIN_PAYABLE,
    MAX_PERCENT,
} from './coupon-math.ts';
import { quoteUpgradeMath, MIN_TOPUP } from './pricing-math.ts';

/**
 * Tests for the discount rules.
 *
 * Every one of these asserts about money that leaves the business. A wrong
 * `Math.round`, a missing floor or a percent applied to the wrong base is not a
 * cosmetic bug — it either undercharges every redemption of a live campaign or
 * hands Razorpay an amount it refuses. That is why this file exists.
 *
 * Run: npm run test:coupons
 */

// ── percent ──────────────────────────────────────────────────────────────────

test('percent discount is computed off the post-credit amount', () => {
    const r = applyCouponMath(500, { kind: 'percent', value: 20 });
    assert.equal(r.discount, 100);
    assert.equal(r.payable, 400);
});

test('percent discount floors — never rounds up', () => {
    // 20% of 149 = 29.8. Rounding up gives ₹30 off, ₹1 more than promised, on
    // every single redemption of the campaign.
    const r = applyCouponMath(149, { kind: 'percent', value: 20 });
    assert.equal(r.discount, 29);
    assert.equal(r.payable, 120);
});

test('percent discount respects maxDiscount', () => {
    const r = applyCouponMath(499, { kind: 'percent', value: 50, maxDiscount: 100 });
    assert.equal(r.discount, 100);
    assert.equal(r.capped, true);
});

test('maxDiscount of 0/null means uncapped, not "no discount"', () => {
    assert.equal(applyCouponMath(400, { kind: 'percent', value: 25, maxDiscount: 0 }).discount, 100);
    assert.equal(applyCouponMath(400, { kind: 'percent', value: 25, maxDiscount: null }).discount, 100);
});

test('percent is clamped to MAX_PERCENT even if a row says 200', () => {
    const r = applyCouponMath(1000, { kind: 'percent', value: 200 });
    assert.equal(r.discount, (1000 * MAX_PERCENT) / 100);
});

// ── flat ─────────────────────────────────────────────────────────────────────

test('flat discount comes straight off', () => {
    const r = applyCouponMath(299, { kind: 'flat', value: 50 });
    assert.equal(r.discount, 50);
    assert.equal(r.payable, 249);
});

// ── the floor ────────────────────────────────────────────────────────────────

test('a coupon can never take the bill below MIN_PAYABLE', () => {
    // ₹500 off a ₹299 kit would be a negative charge; Razorpay would reject the
    // order and the buyer would see a broken checkout, not a free kit.
    const r = applyCouponMath(299, { kind: 'flat', value: 500 });
    assert.equal(r.payable, MIN_PAYABLE);
    assert.equal(r.discount, 299 - MIN_PAYABLE);
    assert.equal(r.floored, true);
});

test('90% off a small kit still leaves MIN_PAYABLE', () => {
    const r = applyCouponMath(149, { kind: 'percent', value: 90 });
    assert.equal(r.payable, MIN_PAYABLE);
    assert.ok(r.discount < 149);
});

test('a bill already at or below the floor is left untouched', () => {
    const r = applyCouponMath(MIN_PAYABLE, { kind: 'flat', value: 100 });
    assert.equal(r.discount, 0);
    assert.equal(r.payable, MIN_PAYABLE);
});

test('never returns a negative or NaN bill from corrupt input', () => {
    for (const bad of [NaN, -1, undefined, null] as any[]) {
        const r = applyCouponMath(bad, { kind: 'flat', value: 50 });
        assert.equal(r.discount, 0);
        assert.ok(r.payable >= 0);
    }
    const r = applyCouponMath(299, { kind: 'flat', value: NaN as any });
    assert.equal(r.discount, 0);
    assert.equal(r.payable, 299);
});

// ── composition with the upgrade credit (the double-dip guard) ───────────────

test('percent applies AFTER upgrade credit, not to the list price', () => {
    // Bundle ₹499, buyer already spent ₹350 on component kits → owes ₹149.
    // A 50% coupon must take ₹74 off ₹149, not ₹249 off ₹499.
    const credit = quoteUpgradeMath(true, 499, 350);
    assert.equal(credit.payable, MIN_TOPUP);

    const r = applyCouponMath(credit.payable, { kind: 'percent', value: 50 });
    assert.equal(r.discount, 74);
    assert.equal(r.payable, 75);
    assert.ok(r.payable > 0, 'a stacked coupon must never invert the bill');
});

test('credit + coupon together still respect MIN_PAYABLE', () => {
    const credit = quoteUpgradeMath(true, 499, 350);
    const r = applyCouponMath(credit.payable, { kind: 'flat', value: 1000 });
    assert.equal(r.payable, MIN_PAYABLE);
});

// ── auto-apply picks the best offer ──────────────────────────────────────────

test('bestCouponMath picks the deepest discount for the buyer', () => {
    const picked = bestCouponMath(499, [
        { kind: 'flat', value: 50, code: 'FLAT50' },
        { kind: 'percent', value: 20, code: 'PCT20' }, // ₹99 — deeper
        { kind: 'percent', value: 5, code: 'PCT5' },
    ] as any);
    assert.equal((picked!.rule as any).code, 'PCT20');
    assert.equal(picked!.math.discount, 99);
});

test('bestCouponMath returns null when nothing can discount', () => {
    assert.equal(bestCouponMath(MIN_PAYABLE, [{ kind: 'flat', value: 100 }]), null);
    assert.equal(bestCouponMath(499, []), null);
});

// ── savings + code hygiene ───────────────────────────────────────────────────

test('totalSavings never goes negative', () => {
    assert.equal(totalSavings(1499, 149), 1350);
    assert.equal(totalSavings(100, 299), 0);
});

test('codes normalise to one canonical form', () => {
    assert.equal(normaliseCode('  new year 25 '), 'NEWYEAR25');
    assert.equal(normaliseCode(undefined as any), '');
});

test('code format rejects the unusable and accepts the ordinary', () => {
    assert.ok(isValidCodeFormat('LAUNCH50'));
    assert.ok(isValidCodeFormat('NEW-YEAR_25'));
    assert.ok(!isValidCodeFormat('AB'), 'too short to be unguessable');
    assert.ok(!isValidCodeFormat('HAS SPACE'));
    assert.ok(!isValidCodeFormat('WITH/SLASH'));
    assert.ok(!isValidCodeFormat('-LEADINGDASH'));
    assert.ok(!isValidCodeFormat('X'.repeat(25)));
});
