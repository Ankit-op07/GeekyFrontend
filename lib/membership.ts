/**
 * Membership — time-limited access to the whole platform.
 *
 * A membership is NOT a kit, and the difference is the whole design:
 *
 *   A kit purchase is PERMANENT and SLUG-SCOPED. It appends a plan name to
 *   CompanyKitUser.purchasedKits forever, and PLAN_TO_SLUGS maps that name to
 *   the kit slugs it unlocks. Nothing ever removes it — the comments in
 *   appConstants.ts are emphatic that removing a key silently revokes access
 *   to content someone paid for.
 *
 *   A membership is TEMPORARY and UNSCOPED. It unlocks everything, and it
 *   stops.
 *
 * ⚠️ THEREFORE: a membership plan name must NEVER appear in PLAN_TO_SLUGS, and
 * membership must never be recorded via recordPurchase(). Both would push the
 * plan into purchasedKits, where it is permanent by design — the member would
 * keep full access to every kit forever, and no expiry check anywhere could
 * take it back, because getAllowedSlugs() has no concept of time. That is a
 * one-way mistake: once thousands of rows carry the string, you cannot tell a
 * genuine lifetime buyer from a lapsed member. Membership lives in its own
 * fields (see lib/models/Membership.ts and the membership* fields on
 * CompanyKitUser) precisely so that expiry is expressible.
 *
 * ⚠️ AND: do not reuse `subscriptionStatus` / `subscriptionEndDate` on
 * CompanyKitUser for this. They look like exactly the right fields and they are
 * a trap — `subscriptionStatus` is set to 'active' by recordPurchase() on EVERY
 * kit purchase (and by six other write sites), so every past buyer already
 * reads as an active subscriber. Gating on it would hand free membership to the
 * entire existing customer base. `subscriptionEndDate` is written nowhere and
 * read nowhere. Membership uses its own `membershipExpiresAt`.
 */

export type MembershipPlanId =
    | 'membership-monthly'
    | 'membership-half-yearly'
    | 'membership-yearly';

export interface MembershipPlan {
    id: MembershipPlanId;
    /**
     * Canonical plan name. Stored on Order.planName and in the Razorpay notes,
     * and it is what the webhook matches on.
     *
     * ⚠️ Immutable once live, for the same reason kit plan names are: orders,
     * Razorpay notes and the membership ledger all reference it verbatim.
     */
    name: string;
    label: string;
    /** ₹, charged as-is. The server never takes a price from the client. */
    price: number;
    /** What the same period costs at the monthly rate — for honest "you save ₹X". */
    monthlyEquivalent: number;
    /** Calendar months of access this grants. */
    months: number;
    tagline: string;
    highlight?: boolean;
}

/**
 * The three tiers, priced as specified.
 *
 * THE LADDER HAS TO GET CHEAPER PER MONTH AS IT GETS LONGER, or the longer tier
 * has nothing to sell. ₹499 → ₹250/mo → ₹208/mo does that. It briefly did not:
 * at ₹2999 the annual plan worked out to the same ₹250/month as the 6-month one,
 * so it cost twice as much for no better rate and every rational buyer took the
 * 6-month. If you change a price here, check the per-month figure still falls.
 */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
    {
        id: 'membership-monthly',
        name: 'Geeky Frontend Membership - Monthly',
        label: '1 Month',
        price: 499,
        monthlyEquivalent: 499,
        months: 1,
        tagline: 'Try everything for a month.',
    },
    {
        id: 'membership-half-yearly',
        name: 'Geeky Frontend Membership - 6 Months',
        label: '6 Months',
        price: 1499,
        monthlyEquivalent: 499 * 6,
        months: 6,
        tagline: 'Long enough to actually finish a kit and land the interview.',
        highlight: true,
    },
    {
        id: 'membership-yearly',
        name: 'Geeky Frontend Membership - 1 Year',
        label: '1 Year',
        price: 2499,
        monthlyEquivalent: 499 * 12,
        months: 12,
        tagline: 'A full prep cycle, start to offer.',
    },
];

/** Match, don't trust — an unknown id from a request body resolves to null. */
export function getMembershipPlan(id: string): MembershipPlan | null {
    return MEMBERSHIP_PLANS.find((p) => p.id === id) || null;
}

/** Reverse lookup, for the webhook reading a plan name out of Razorpay notes. */
export function getMembershipPlanByName(name: string): MembershipPlan | null {
    return MEMBERSHIP_PLANS.find((p) => p.name === name) || null;
}

/** Is this plan name a membership at all? The webhook's branch condition. */
export function isMembershipPlanName(name: string): boolean {
    return MEMBERSHIP_PLANS.some((p) => p.name === name);
}

export function membershipSavings(plan: MembershipPlan): number {
    return Math.max(0, plan.monthlyEquivalent - plan.price);
}

/**
 * Add whole calendar months, clamping the day to the target month's length.
 *
 * Calendar months, not 30-day blocks: someone who buys "1 month" on 31 January
 * should get a month, and `setMonth(+1)` alone would silently roll them to
 * 2 or 3 March (JS normalises 31 February forward). Clamping gives 28/29 Feb,
 * which is the shorter, buyer-favouring-nobody answer but the one every
 * subscription product uses and the only one that does not skip a month.
 */
export function addMonths(from: Date, months: number): Date {
    const d = new Date(from.getTime());
    const targetMonth = d.getMonth() + months;
    const dayOfMonth = d.getDate();

    d.setDate(1); // avoid the rollover while we move the month
    d.setMonth(targetMonth);

    // Last day of the month we just landed on.
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dayOfMonth, lastDay));
    return d;
}

/**
 * When does membership end if `plan` is bought now, given any existing expiry?
 *
 * STACKING, NOT RESETTING. Renewing before you lapse extends from the existing
 * expiry, so a member who renews early is never punished by losing the tail of
 * what they already paid for. Once lapsed, the new term starts from today —
 * extending from a date in the past would sell someone a month that already
 * elapsed.
 */
export function computeMembershipExpiry(
    plan: MembershipPlan,
    currentExpiry: Date | null | undefined,
    now: Date
): Date {
    const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
    return addMonths(base, plan.months);
}

/** The single definition of "is this membership live right now". */
export function isMembershipActive(expiresAt: Date | null | undefined, now: Date = new Date()): boolean {
    return !!expiresAt && expiresAt.getTime() > now.getTime();
}
