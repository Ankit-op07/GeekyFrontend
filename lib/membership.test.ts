import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MEMBERSHIP_PLANS,
    addMonths,
    computeMembershipExpiry,
    getMembershipPlan,
    getMembershipPlanByName,
    isMembershipActive,
    isMembershipPlanName,
    membershipSavings,
} from './membership.ts';

/**
 * Pins the membership rules that cost money when they break.
 *
 * Run: npm run test:membership
 */

const monthly = MEMBERSHIP_PLANS[0];
const halfYear = MEMBERSHIP_PLANS[1];
const yearly = MEMBERSHIP_PLANS[2];

test('prices and terms are what was specified', () => {
    assert.equal(monthly.price, 499);
    assert.equal(monthly.months, 1);
    assert.equal(halfYear.price, 1499);
    assert.equal(halfYear.months, 6);
    assert.equal(yearly.price, 2499);
    assert.equal(yearly.months, 12);
});

test('addMonths clamps rather than rolling into the next month', () => {
    // 31 Jan + 1 month must be 28 Feb, NOT 2/3 March. Plain setMonth(+1)
    // normalises "31 February" forward and silently skips the month.
    assert.equal(addMonths(new Date('2026-01-31T10:00:00Z'), 1).getDate(), 28);
    assert.equal(addMonths(new Date('2026-01-31T10:00:00Z'), 1).getMonth(), 1); // Feb

    // Leap year still gets its extra day.
    assert.equal(addMonths(new Date('2028-01-31T10:00:00Z'), 1).getDate(), 29);

    // 31 May + 1 = 30 June (June has 30 days).
    assert.equal(addMonths(new Date('2026-05-31T10:00:00Z'), 1).getDate(), 30);
});

test('addMonths crosses the year boundary', () => {
    const d = addMonths(new Date('2026-08-06T10:00:00Z'), 12);
    assert.equal(d.getFullYear(), 2027);
    assert.equal(d.getMonth(), 7); // August
});

test('a fresh membership starts from today', () => {
    const now = new Date('2026-08-06T10:00:00Z');
    const expiry = computeMembershipExpiry(monthly, null, now);
    assert.equal(expiry.getTime(), addMonths(now, 1).getTime());
});

test('renewing early STACKS onto the remaining term', () => {
    const now = new Date('2026-08-06T10:00:00Z');
    // 20 days left when they renew.
    const currentExpiry = new Date('2026-08-26T10:00:00Z');

    const expiry = computeMembershipExpiry(monthly, currentExpiry, now);

    // Must extend from the EXISTING expiry, not from today — otherwise renewing
    // early silently destroys the 20 days already paid for.
    assert.equal(expiry.getTime(), addMonths(currentExpiry, 1).getTime());
    assert.ok(expiry.getTime() > addMonths(now, 1).getTime());
});

test('renewing after lapsing starts from today, not from the old expiry', () => {
    const now = new Date('2026-08-06T10:00:00Z');
    const lapsed = new Date('2026-05-01T10:00:00Z'); // three months ago

    const expiry = computeMembershipExpiry(monthly, lapsed, now);

    // Extending from a date in the past would sell someone a month that has
    // already elapsed — here, an expiry still behind `now`.
    assert.equal(expiry.getTime(), addMonths(now, 1).getTime());
    assert.ok(expiry.getTime() > now.getTime());
});

test('isMembershipActive is strictly future-dated', () => {
    const now = new Date('2026-08-06T10:00:00Z');
    assert.equal(isMembershipActive(new Date('2026-08-07T10:00:00Z'), now), true);
    assert.equal(isMembershipActive(new Date('2026-08-05T10:00:00Z'), now), false);
    assert.equal(isMembershipActive(now, now), false, 'an expiry exactly now has passed');
    assert.equal(isMembershipActive(null, now), false);
    assert.equal(isMembershipActive(undefined, now), false);
});

test('plan lookup matches rather than trusts', () => {
    assert.equal(getMembershipPlan('membership-monthly')?.price, 499);
    assert.equal(getMembershipPlan('membership-free'), null);
    assert.equal(getMembershipPlan(''), null);
    assert.equal(getMembershipPlanByName(yearly.name)?.id, yearly.id);
    assert.equal(getMembershipPlanByName('Java Interview Preparation Kit'), null);
});

test('membership plan names are recognised — the guard recordPurchase relies on', () => {
    // If this ever returns false for a real plan, recordPurchase would write a
    // membership into purchasedKits, granting the whole catalogue permanently.
    for (const plan of MEMBERSHIP_PLANS) {
        assert.equal(isMembershipPlanName(plan.name), true, plan.name);
    }
    // And it must not swallow genuine kit names.
    assert.equal(isMembershipPlanName('Java Interview Preparation Kit'), false);
    assert.equal(isMembershipPlanName('Complete Kit All Access Bundle'), false);
});

test('savings are real and never negative', () => {
    assert.equal(membershipSavings(monthly), 0, 'monthly cannot save against itself');
    assert.equal(membershipSavings(halfYear), 499 * 6 - 1499);
    assert.equal(membershipSavings(yearly), 499 * 12 - 2499);
    for (const p of MEMBERSHIP_PLANS) assert.ok(membershipSavings(p) >= 0);
});

test('the ladder gets cheaper per month as it gets longer', () => {
    /**
     * The invariant that makes a longer tier worth buying.
     *
     * This was briefly violated: at ₹2999 the annual plan was ₹250/mo, exactly
     * the same rate as the 6-month, so it cost twice as much for no better deal
     * and no rational buyer would take it. A price edit that breaks this is
     * invisible in the UI — every card still renders — so it is pinned here.
     */
    const perMonth = MEMBERSHIP_PLANS.map((p) => p.price / p.months);
    for (let i = 1; i < perMonth.length; i++) {
        assert.ok(
            perMonth[i] < perMonth[i - 1],
            `${MEMBERSHIP_PLANS[i].label} (₹${Math.round(perMonth[i])}/mo) must be cheaper per ` +
                `month than ${MEMBERSHIP_PLANS[i - 1].label} (₹${Math.round(perMonth[i - 1])}/mo)`
        );
    }
    // And the terms must be in ascending order for that comparison to mean anything.
    for (let i = 1; i < MEMBERSHIP_PLANS.length; i++) {
        assert.ok(MEMBERSHIP_PLANS[i].months > MEMBERSHIP_PLANS[i - 1].months);
    }
});

test('plan ids and names are unique', () => {
    assert.equal(new Set(MEMBERSHIP_PLANS.map((p) => p.id)).size, MEMBERSHIP_PLANS.length);
    assert.equal(new Set(MEMBERSHIP_PLANS.map((p) => p.name)).size, MEMBERSHIP_PLANS.length);
});
