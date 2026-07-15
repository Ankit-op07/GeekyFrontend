import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import {
    KIT_CATALOG,
    PLAN_TO_SLUGS,
    getKitById,
    getAllowedSlugs,
    BUNDLE_KIT_ID,
    BUNDLE_COMPONENT_PLANS,
} from '@/lib/appConstants';
import { quoteUpgradeMath } from '@/lib/pricing-math';

/**
 * ─── Upgrade Credit ────────────────────────────────────────────────────────
 *
 *  Money spent on the single kits the bundle is built from (JS, React, Frontend
 *  System Design) is credited toward the all-access bundle — the user never pays
 *  twice for content they already own. Buying the JS Kit (₹149) then the bundle
 *  (₹499) costs ₹350, not ₹499.
 *
 *  TWO rules (see lib/pricing-math.ts):
 *    1. Credit only flows toward the BUNDLE. Standalone kits are full price —
 *       owning JS does not discount React.
 *    2. Credit is capped so a bundle upgrade always costs at least MIN_TOPUP;
 *       the last kit is never near-free.
 *
 *  ⚠️  SECURITY: this is the ONLY place a payable amount may be computed.
 *  It reads exclusively from the DB. The client may *display* a credit; it may
 *  never *assert* one. `create-order` must call this and ignore any
 *  client-sent amount. Assume the client is hostile.
 *
 *  Credit is PERMANENT — it never expires. (PRD-001, decision #6.)
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface PriceQuote {
    kitId: string;
    kitName: string;
    listPrice: number;
    /** Credit applied toward this purchase, in ₹. credit + payable === listPrice. */
    credit: number;
    /** What they actually pay now, in ₹. For the bundle, never below MIN_TOPUP. */
    payable: number;
    /** True when the user already has access to this kit — block the sale. */
    alreadyOwned: boolean;
    /** Plan names the user has bought. */
    ownedPlans: string[];
    /** True when prior spend exceeded the credit cap (credit was clamped). */
    floored: boolean;
}

/**
 * Sum of what this email has spent on the bundle's COMPONENT kits, in ₹.
 * Only spend on {@link BUNDLE_COMPONENT_PLANS} counts — Node, Experiences,
 * company kits and the bundle itself are excluded (Rule 1).
 *
 * ⚠️  We deliberately count orders of EVERY status.
 *
 * An Order row is only ever created *after* a signature-verified Razorpay
 * `payment.captured` webhook — so the row existing at all means the money was
 * taken. The `status` field tracks the ONBOARDING EMAIL, not the payment:
 *   - 'processing' → captured, email not sent yet
 *   - 'email_sent' → captured, email delivered
 *   - 'failed'     → captured, but the email send threw
 *
 * Filtering to status:'email_sent' would therefore deny credit to a user who
 * genuinely paid but whose welcome email bounced. They paid; they get credit.
 */
export async function getBundleCredit(email: string): Promise<number> {
    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    const orders = await Order.find({
        email: normalizedEmail,
        planName: { $in: BUNDLE_COMPONENT_PLANS }, // Rule 1: in-bundle spend only
        paymentId: { $exists: true, $nin: [null, ''] },
    }).select('amount').lean();

    // Order.amount is stored in PAISE (the webhook writes Razorpay's
    // payment.amount verbatim). Credit is denominated in ₹, so convert here.
    // Without this, one ₹299 order reads as ₹29,900 of credit and every
    // subsequent purchase collapses to the minimum charge.
    const totalPaise = orders.reduce((sum, o: any) => sum + (Number(o.amount) || 0), 0);
    const total = totalPaise / 100;

    // Defensive: never let a corrupt row produce a negative or absurd credit.
    if (!Number.isFinite(total) || total < 0) return 0;
    return Math.round(total);
}

/** Plan names this email has purchased (from the user record). */
export async function getOwnedPlans(email: string): Promise<string[]> {
    await connectToDatabase();
    const user = await CompanyKitUser.findOne({ email: email.toLowerCase().trim() })
        .select('purchasedKits')
        .lean();
    return ((user as any)?.purchasedKits ?? []) as string[];
}

/**
 * Does the user already have access to everything this kit would grant?
 * Prevents selling the React kit to someone who owns the bundle.
 */
function ownsKitAlready(ownedPlans: string[], kitId: string): boolean {
    const kit = getKitById(kitId);
    if (!kit) return false;

    const targetSlugs = PLAN_TO_SLUGS[kit.name];
    if (!targetSlugs?.length) return false;

    const allowed = getAllowedSlugs(ownedPlans);
    return targetSlugs.every((slug) => allowed.has(slug));
}

/**
 * THE pricing function. Server-side only.
 *
 * @param email  the buyer (may be empty for logged-out users → no credit)
 * @param kitId  catalog id of the kit being bought
 */
export async function computeUpgradePrice(
    email: string | null | undefined,
    kitId: string,
): Promise<PriceQuote> {
    const kit = getKitById(kitId);
    if (!kit) throw new Error(`Unknown kit: ${kitId}`);
    if (kit.comingSoon) throw new Error(`Kit is not available yet: ${kitId}`);

    const listPrice = kit.price;
    // The bundle is the only superset SKU, so it is the only target credit
    // flows toward (Rule 1). isBundle drives every branch below.
    const isBundle = kit.isBundle === true || kitId === BUNDLE_KIT_ID;

    // Logged-out / unknown buyer → full price, no credit.
    if (!email) {
        const math = quoteUpgradeMath(isBundle, listPrice, 0);
        return {
            kitId,
            kitName: kit.displayName ?? kit.name,
            listPrice,
            credit: math.credit,
            payable: math.payable,
            alreadyOwned: false,
            ownedPlans: [],
            floored: math.floored,
        };
    }

    // Only pay for the credit query when it can actually apply (bundle target).
    const [bundleCredit, ownedPlans] = await Promise.all([
        isBundle ? getBundleCredit(email) : Promise.resolve(0),
        getOwnedPlans(email),
    ]);

    const alreadyOwned = ownsKitAlready(ownedPlans, kitId);
    const math = quoteUpgradeMath(isBundle, listPrice, bundleCredit);

    return {
        kitId,
        kitName: kit.displayName ?? kit.name,
        listPrice,
        credit: math.credit,
        payable: math.payable,
        alreadyOwned,
        ownedPlans,
        floored: math.floored,
    };
}

/**
 * The bundle, quoted for this user. Convenience wrapper used by every
 * cross-sell surface.
 */
export function computeBundlePrice(email: string | null | undefined) {
    return computeUpgradePrice(email, BUNDLE_KIT_ID);
}

/** Kits this user can still buy (excludes owned + comingSoon). */
export async function getUpsellableKits(email: string): Promise<string[]> {
    const ownedPlans = await getOwnedPlans(email);
    return Object.values(KIT_CATALOG)
        .filter((k) => !k.comingSoon && !ownsKitAlready(ownedPlans, k.id))
        .map((k) => k.id);
}
