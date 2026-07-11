import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import {
    KIT_CATALOG,
    PLAN_TO_SLUGS,
    getKitById,
    getAllowedSlugs,
    UPGRADE_FLOOR,
    BUNDLE_KIT_ID,
} from '@/lib/appConstants';

/**
 * ─── Upgrade Credit ────────────────────────────────────────────────────────
 *
 *  Every rupee a user has already spent with us is credited against a larger
 *  purchase. Buying the JS Kit (₹149) then the Complete Kit (₹499) costs ₹350,
 *  not ₹499 — the user never pays twice for content they already own.
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
    /** Total the user has previously paid us, in ₹. */
    credit: number;
    /** What they actually pay now, in ₹. Never below UPGRADE_FLOOR. */
    payable: number;
    /** True when the user already has access to this kit — block the sale. */
    alreadyOwned: boolean;
    /** Plan names the user has bought. */
    ownedPlans: string[];
    /** True when credit was clamped by UPGRADE_FLOOR. */
    floored: boolean;
}

/**
 * Sum of everything this email has ever successfully paid us.
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
export async function getUserCredit(email: string): Promise<number> {
    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    const orders = await Order.find({
        email: normalizedEmail,
        paymentId: { $exists: true, $nin: [null, ''] },
    }).select('amount').lean();

    const total = orders.reduce((sum, o: any) => sum + (Number(o.amount) || 0), 0);

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

    // Logged-out / unknown buyer → full price, no credit.
    if (!email) {
        return {
            kitId,
            kitName: kit.displayName ?? kit.name,
            listPrice,
            credit: 0,
            payable: listPrice,
            alreadyOwned: false,
            ownedPlans: [],
            floored: false,
        };
    }

    const [credit, ownedPlans] = await Promise.all([
        getUserCredit(email),
        getOwnedPlans(email),
    ]);

    const alreadyOwned = ownsKitAlready(ownedPlans, kitId);

    // Credit can exceed the list price (e.g. someone who bought several kits).
    // Razorpay rejects ₹0 orders, so clamp to the floor rather than going free.
    const rawPayable = listPrice - credit;
    const payable = Math.max(rawPayable, UPGRADE_FLOOR);
    const floored = rawPayable < UPGRADE_FLOOR;

    return {
        kitId,
        kitName: kit.displayName ?? kit.name,
        listPrice,
        // Report the credit that was actually applied, so the UI never shows
        // a ₹498 credit next to a ₹49 charge on a ₹499 kit and look broken.
        credit: Math.min(credit, listPrice - payable),
        payable,
        alreadyOwned,
        ownedPlans,
        floored,
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
