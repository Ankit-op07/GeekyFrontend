import connectToDatabase from '@/lib/db';
import CouponModel, { ICoupon } from '@/lib/models/Coupon';
import CouponRedemption from '@/lib/models/CouponRedemption';
import Order from '@/lib/models/Order';
import { getKitById } from '@/lib/appConstants';
import {
    applyCouponMath,
    normaliseCode,
    isValidCodeFormat,
    type CouponMath,
} from '@/lib/coupon-math';

/**
 * ─── Coupon validation & redemption ────────────────────────────────────────
 *
 *  ⚠️  SECURITY, and it is the same rule as lib/pricing.ts: the client may
 *  *send a code string* and *display* a discount. It may never *assert* one.
 *  Every field that decides the discount is read from the DB here, and
 *  /api/payment/create-order calls this again from scratch before charging.
 *  Assume the client is hostile.
 *
 *  Validation order matters — it is the order of the checks in
 *  {@link evaluateCoupon} — because the FIRST failing check is what the buyer
 *  is told, and "this code has run out" is a very different message from
 *  "this code isn't for this kit".
 *
 *  ⚠️  WHICH EMAIL — a deliberate asymmetry with lib/pricing.ts.
 *
 *  Upgrade CREDIT is keyed to the email in the SIGNED SESSION COOKIE, because
 *  credit is money already spent: letting a caller name someone else's email
 *  would let them spend a stranger's purchase history (see the comment in
 *  /api/payment/create-order).
 *
 *  Coupon eligibility is keyed to the BUYER email — the session email when
 *  signed in, otherwise the address typed into the guest checkout form. Guest
 *  checkout is the primary purchase path here, so requiring a session would
 *  make the whole feature unreachable for most buyers. The claimed email is
 *  unverified, but the purchase is bound to that same address, so the cost of
 *  farming a per-user limit is buying another kit on another account.
 *
 *  When no email is known yet (guest, form still empty) the per-buyer rules
 *  cannot be evaluated. They are SKIPPED and the result is marked
 *  `provisional` — /api/payment/create-order re-checks against the real buyer
 *  email before a single rupee is charged.
 *
 *  Nothing here mutates the coupon. Counters move exactly once per captured
 *  payment, in {@link recordRedemption}.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type CouponRejection =
    | 'missing_code'
    | 'bad_format'
    | 'unknown_code'
    | 'inactive'
    | 'not_started'
    | 'expired'
    | 'wrong_kit'
    | 'below_min_order'
    | 'sold_out'
    | 'already_used'
    | 'first_purchase_only'
    | 'no_stack_with_credit'
    | 'no_discount_possible';

/** Buyer-facing copy for each rejection. Never leaks whether a code exists. */
const REJECTION_MESSAGE: Record<CouponRejection, string> = {
    missing_code: 'Enter a coupon code.',
    bad_format: "That doesn't look like a valid code.",
    unknown_code: 'This code is not valid.',
    inactive: 'This code is no longer active.',
    not_started: 'This offer has not started yet.',
    expired: 'This code has expired.',
    wrong_kit: 'This code does not apply to this kit.',
    below_min_order: 'Your order is below the minimum for this code.',
    sold_out: 'This code has been fully claimed.',
    already_used: 'You have already used this code.',
    first_purchase_only: 'This code is only for your first purchase.',
    no_stack_with_credit:
        'This code cannot be combined with your upgrade credit — your credit is the bigger saving.',
    no_discount_possible: 'This code cannot be applied to this amount.',
};

export interface AppliedCoupon {
    code: string;
    description: string;
    kind: 'percent' | 'flat';
    value: number;
    /** ₹ taken off. */
    discount: number;
    /** True when the discount was reduced to keep the charge at the ₹ floor. */
    floored: boolean;
    /** True when this was applied without the buyer typing anything. */
    auto: boolean;
    /**
     * True when the per-buyer rules could not be checked because no email was
     * known yet (a guest who hasn't filled the form). The discount shown is
     * provisional; create-order re-checks it against the real buyer email.
     */
    provisional: boolean;
}

export type CouponEvaluation =
    | { ok: true; coupon: AppliedCoupon; math: CouponMath }
    | { ok: false; reason: CouponRejection; message: string };

function reject(reason: CouponRejection): CouponEvaluation {
    return { ok: false, reason, message: REJECTION_MESSAGE[reason] };
}

export interface EvaluateCouponInput {
    code: string;
    /**
     * The BUYER email — session email when signed in, otherwise the address
     * typed into guest checkout. null when it isn't known yet, which downgrades
     * the result to `provisional`. See the file header on why this is not the
     * same key as upgrade credit uses.
     */
    email: string | null | undefined;
    kitId: string;
    /** ₹ owed after upgrade credit — the base a percent coupon applies to. */
    payableBeforeCoupon: number;
    /** ₹ of upgrade credit already applied to this quote. */
    credit: number;
}

/**
 * Is this code usable, by this buyer, on this kit, right now — and for how much?
 *
 * Cheap checks first, DB round-trips only when they can still change the answer.
 */
export async function evaluateCoupon(input: EvaluateCouponInput): Promise<CouponEvaluation> {
    const code = normaliseCode(input.code);
    if (!code) return reject('missing_code');
    // Rejected before touching the DB — a typo costs us nothing, and a script
    // spraying junk codes never reaches the collection.
    if (!isValidCodeFormat(code)) return reject('bad_format');

    const kit = getKitById(input.kitId);
    if (!kit || kit.comingSoon) return reject('wrong_kit');

    await connectToDatabase();
    const coupon = await CouponModel.findOne({ code }).lean<ICoupon>();
    if (!coupon) return reject('unknown_code');

    return evaluateLoadedCoupon(coupon, input, false);
}

/**
 * The rules, applied to an already-loaded coupon row. Shared by the typed-code
 * path and the auto-apply sweep so both can never drift apart.
 */
async function evaluateLoadedCoupon(
    coupon: ICoupon,
    input: EvaluateCouponInput,
    auto: boolean,
): Promise<CouponEvaluation> {
    const email = input.email?.toLowerCase().trim() || '';

    // ── Lifecycle ───────────────────────────────────────────────────────────
    if (!coupon.active) return reject('inactive');
    const now = Date.now();
    if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now) return reject('not_started');
    if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now) return reject('expired');

    // ── Eligibility of the cart ─────────────────────────────────────────────
    // An empty appliesTo means "every purchasable kit" — deliberately, so the
    // common case (a sitewide campaign) needs no per-kit maintenance when a new
    // kit ships.
    if (coupon.appliesTo?.length && !coupon.appliesTo.includes(input.kitId)) {
        return reject('wrong_kit');
    }
    const base = Number(input.payableBeforeCoupon) || 0;
    if (coupon.minOrderValue > 0 && base < coupon.minOrderValue) return reject('below_min_order');

    // A stacking ban is about margin: some codes are only meant for new buyers
    // paying full price, not on top of an already-credited upgrade.
    if (coupon.stacksWithCredit === false && (Number(input.credit) || 0) > 0) {
        return reject('no_stack_with_credit');
    }

    // ── Global cap ──────────────────────────────────────────────────────────
    // Read-only here. The authoritative claim happens atomically at capture in
    // recordRedemption(); this check is what stops us from *quoting* a code that
    // has already run out.
    if (coupon.maxRedemptions != null && coupon.timesUsed >= coupon.maxRedemptions) {
        return reject('sold_out');
    }

    // ── Per-buyer rules ─────────────────────────────────────────────────────
    // These need an email to mean anything. Without one (guest, form still
    // empty) they are skipped and the quote is flagged `provisional` — showing
    // a guest "no offers for you" before they have identified themselves would
    // cost far more sales than the rare late correction costs us. create-order
    // runs this again with the real buyer email before charging.
    const provisional = !email;
    if (email) {
        if (coupon.firstPurchaseOnly && (await hasPriorPurchase(email))) {
            return reject('first_purchase_only');
        }
        if (coupon.maxPerUser > 0) {
            const used = await CouponRedemption.countDocuments({ code: coupon.code, email });
            if (used >= coupon.maxPerUser) return reject('already_used');
        }
    }

    // ── The money ───────────────────────────────────────────────────────────
    const math = applyCouponMath(base, {
        kind: coupon.kind,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
    });
    if (math.discount <= 0) return reject('no_discount_possible');

    return {
        ok: true,
        math,
        coupon: {
            code: coupon.code,
            description: coupon.description || '',
            kind: coupon.kind,
            value: coupon.value,
            discount: math.discount,
            floored: math.floored,
            auto,
            provisional,
        },
    };
}

/**
 * The best auto-apply offer for this buyer, or null.
 *
 * This is the conversion lever: the buyer lands on checkout and the discount is
 * already on, with no code to hunt for. It is evaluated with the same rules as a
 * typed code (including per-user limits), and re-evaluated in create-order, so
 * it cannot be farmed.
 *
 * "Best" = deepest discount. If two offers tie, the one created later wins,
 * which is what an admin expects when they replace a campaign.
 */
export async function findAutoCoupon(
    input: Omit<EvaluateCouponInput, 'code'>,
): Promise<CouponEvaluation | null> {
    const kit = getKitById(input.kitId);
    if (!kit || kit.comingSoon) return null;

    await connectToDatabase();
    const now = new Date();
    const candidates = await CouponModel.find({
        active: true,
        autoApply: true,
        $and: [
            { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
            { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
        ],
    })
        .sort({ createdAt: -1 })
        .limit(25) // a sane blast radius; more than this is a campaign-hygiene problem
        .lean<ICoupon[]>();

    if (!candidates.length) return null;

    /* Evaluate BEST-FIRST and stop at the first pass.
     *
     * This runs on every checkout page load and again inside create-order, and
     * evaluateLoadedCoupon() costs up to two queries per candidate (prior
     * purchase, per-user count). Evaluating all 25 unconditionally would be 50
     * queries on the hot path to answer a question the first hit usually
     * settles.
     *
     * Ordering by the pure discount math first is safe precisely because the
     * remaining checks can only REJECT a candidate — none of them can make one
     * worth more. So the first candidate that passes is provably the deepest
     * one that could have. Ties keep the newest coupon (the find() sort), which
     * is what an admin expects after replacing a campaign. */
    const ranked = candidates
        .map((coupon) => ({
            coupon,
            potential: applyCouponMath(input.payableBeforeCoupon, {
                kind: coupon.kind,
                value: coupon.value,
                maxDiscount: coupon.maxDiscount,
            }).discount,
        }))
        .filter((c) => c.potential > 0)
        .sort((a, b) => b.potential - a.potential);

    for (const { coupon } of ranked) {
        const result = await evaluateLoadedCoupon(coupon, { ...input, code: coupon.code }, true);
        if (result.ok) return result;
    }
    return null;
}

/**
 * Offers worth advertising outside checkout (dashboard banner, kit pages).
 * Only `promoted` codes are ever exposed — an unpromoted code stays private, so
 * a partner/affiliate code is not discoverable by reading our own API.
 */
export interface PublicOffer {
    code: string;
    description: string;
    kind: 'percent' | 'flat';
    value: number;
    /** Kit ids it applies to; empty = all. */
    appliesTo: string[];
    /** ISO date the offer ends, if it does. Drives the countdown. */
    endsAt: string | null;
    autoApply: boolean;
}

export async function getPromotedOffers(limit = 3): Promise<PublicOffer[]> {
    await connectToDatabase();
    const now = new Date();
    const rows = await CouponModel.find({
        active: true,
        promoted: true,
        $and: [
            { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
            { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
            // Don't advertise something already claimed out.
            { $or: [{ maxRedemptions: null }, { $expr: { $lt: ['$timesUsed', '$maxRedemptions'] } }] },
        ],
    })
        .sort({ validUntil: 1, createdAt: -1 })
        .limit(Math.max(1, Math.min(limit, 10)))
        .lean<ICoupon[]>();

    return rows.map((c) => ({
        code: c.code,
        description: c.description || '',
        kind: c.kind,
        value: c.value,
        appliesTo: c.appliesTo ?? [],
        endsAt: c.validUntil ? new Date(c.validUntil).toISOString() : null,
        autoApply: !!c.autoApply,
    }));
}

/** Has this email ever paid us anything? Drives `firstPurchaseOnly`. */
async function hasPriorPurchase(email: string): Promise<boolean> {
    // Order rows are only written after a verified capture (see lib/pricing.ts
    // on why every status counts), so one row = one real purchase.
    const count = await Order.countDocuments({
        email: email.toLowerCase().trim(),
        paymentId: { $exists: true, $nin: [null, ''] },
    });
    return count > 0;
}

export interface RecordRedemptionInput {
    code: string;
    email: string;
    kitId: string;
    planName?: string;
    orderId: string;
    paymentId?: string;
    listPrice: number;
    credit: number;
    discount: number;
    amountPaid: number;
}

/**
 * Book a redemption against a CAPTURED payment. Idempotent.
 *
 * Called from ONE place: /api/payment/webhook. /api/payment/verify deliberately
 * does not call it — same reasoning as the onboarding email that route also
 * leaves to the webhook: the webhook is the server-to-server confirmation that
 * arrives even when the buyer closed the tab, so a single owner writes the
 * counters and there is no cross-route race to reason about.
 *
 * Idempotent anyway, because Razorpay retries a webhook it thinks failed and can
 * deliver the same capture twice: the unique index on orderId means whoever
 * inserts first keeps the counter increment, and every later delivery gives its
 * own increment back.
 *
 * Never throws. A payment must never be lost because the accounting half of it
 * failed — the buyer's access is already recorded by recordPurchase().
 */
export async function recordRedemption(input: RecordRedemptionInput): Promise<void> {
    const code = normaliseCode(input.code);
    if (!code || !input.orderId) return;

    try {
        await connectToDatabase();
        const coupon = await CouponModel.findOne({ code }).select('_id maxRedemptions').lean<ICoupon>();
        if (!coupon) {
            console.error(`⚠️ Redemption for unknown coupon ${code} on order ${input.orderId}`);
            return;
        }

        const discount = Math.max(0, Math.round(Number(input.discount) || 0));
        const amountPaid = Math.max(0, Math.round(Number(input.amountPaid) || 0));

        /* Claim the global slot FIRST, atomically. $expr lets the filter compare
         * two fields of the same document, so "increment only while under the
         * cap" is one operation — two simultaneous checkouts cannot both pass.
         * An uncapped coupon has no race to lose. */
        let overLimit = false;
        if (coupon.maxRedemptions != null) {
            const claimed = await CouponModel.findOneAndUpdate(
                { _id: coupon._id, $expr: { $lt: ['$timesUsed', '$maxRedemptions'] } },
                { $inc: { timesUsed: 1, revenue: amountPaid, discountGiven: discount } },
                { new: true },
            );
            // Lost the race: the money is already taken, so we honour the sale
            // and flag the row instead of failing a paying customer.
            overLimit = !claimed;
        }

        /* The upsert has its own try/catch, and that is load-bearing.
         *
         * Two deliveries of the same capture can run concurrently (Razorpay
         * retries while the first is still in flight). Both pass the claim
         * above, then both upsert — and the loser hits the unique index on
         * orderId with an E11000 rather than a clean "matched, didn't insert".
         * If that threw out to the outer catch, the loser's increment would
         * never be given back and a limited campaign would permanently show one
         * redemption more than it sold. Treating E11000 as "already booked"
         * routes it into the refund path below, where it belongs. */
        let inserted = false;
        try {
            const res = await CouponRedemption.updateOne(
                { orderId: input.orderId },
                {
                    $setOnInsert: {
                        code,
                        couponId: coupon._id,
                        email: input.email.toLowerCase().trim(),
                        kitId: input.kitId,
                        planName: input.planName || '',
                        orderId: input.orderId,
                        paymentId: input.paymentId,
                        listPrice: Math.max(0, Math.round(Number(input.listPrice) || 0)),
                        credit: Math.max(0, Math.round(Number(input.credit) || 0)),
                        discount,
                        amountPaid,
                        overLimit,
                    },
                },
                { upsert: true },
            );
            inserted = (res as any).upsertedCount === 1;
        } catch (err: any) {
            if (err?.code !== 11000) throw err; // a real failure — let the outer catch log it
            inserted = false;
        }

        if (!inserted) {
            /* Duplicate delivery for an order we already booked. If we just
             * incremented the capped counter above, give it back — otherwise a
             * webhook retry burns a second slot of a limited campaign. */
            if (coupon.maxRedemptions != null && !overLimit) {
                await CouponModel.updateOne(
                    { _id: coupon._id },
                    { $inc: { timesUsed: -1, revenue: -amountPaid, discountGiven: -discount } },
                );
            }
            return;
        }

        // Uncapped coupons skipped the atomic claim above, so their counters are
        // moved here — once, on the insert that won.
        if (coupon.maxRedemptions == null) {
            await CouponModel.updateOne(
                { _id: coupon._id },
                { $inc: { timesUsed: 1, revenue: amountPaid, discountGiven: discount } },
            );
        }

        console.log(`🎟️ Coupon ${code} redeemed by ${input.email} (−₹${discount}) on ${input.orderId}`);
    } catch (err: any) {
        // Swallowed on purpose — see the doc comment.
        console.error('⚠️ recordRedemption failed:', err?.message);
    }
}

/** Buyer-facing message for a rejection reason. Exported for API responses. */
export function couponRejectionMessage(reason: CouponRejection): string {
    return REJECTION_MESSAGE[reason];
}
