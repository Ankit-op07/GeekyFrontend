import CompanyKitUser from '@/lib/models/CompanyKitUser';
import Membership from '@/lib/models/Membership';
// `import type` for the interface: a value import of a type-only export is
// elided by SWC (so the Next build passes) but emitted verbatim by Node's
// type-stripping loader, which then fails to find the export at runtime. Any
// script that imports this module directly would break.
import type { MembershipPlan } from '@/lib/membership';
import { computeMembershipExpiry, isMembershipActive } from '@/lib/membership';

/**
 * "Is this person a member, and until when" — the single source of truth.
 *
 * Everything that gates on membership calls this rather than reading
 * `membershipExpiresAt` directly, for the same reason resolveTopicAccess exists:
 * the rule shipped wrong once already in this codebase when each new surface
 * re-derived it. One implementation, and the expiry comparison lives here.
 *
 * Callers must have already run connectToDatabase().
 */

export interface MembershipStatus {
    active: boolean;
    expiresAt: Date | null;
    planId: string | null;
    /** Whole days remaining, rounded up. 0 when inactive. Display only. */
    daysRemaining: number;
}

const INACTIVE: MembershipStatus = {
    active: false,
    expiresAt: null,
    planId: null,
    daysRemaining: 0,
};

export function membershipStatusFrom(
    expiresAt: Date | null | undefined,
    planId: string | null | undefined,
    now: Date = new Date()
): MembershipStatus {
    if (!isMembershipActive(expiresAt, now)) {
        // Deliberately still returns the expiry when it is in the past — the
        // upgrade screen says "your membership ended on <date>", which is much
        // better than pretending they were never a member.
        return { ...INACTIVE, expiresAt: expiresAt ?? null, planId: planId ?? null };
    }
    const ms = expiresAt!.getTime() - now.getTime();
    return {
        active: true,
        expiresAt: expiresAt!,
        planId: planId ?? null,
        daysRemaining: Math.ceil(ms / 86_400_000),
    };
}

/** Resolve membership for a user id. A null/unknown user is simply not a member. */
export async function resolveMembership(
    userId: string | null | undefined
): Promise<MembershipStatus> {
    if (!userId) return { ...INACTIVE };

    const user = (await CompanyKitUser.findById(userId)
        .select('membershipExpiresAt membershipPlanId')
        .lean()) as { membershipExpiresAt?: Date; membershipPlanId?: string } | null;
    if (!user) return { ...INACTIVE };

    return membershipStatusFrom(user.membershipExpiresAt, user.membershipPlanId);
}

/**
 * Grant (or extend) a membership for a captured payment.
 *
 * THE ORDER OF OPERATIONS IS THE WHOLE POINT.
 *
 * The ledger row is claimed FIRST, and the user's expiry is only moved if that
 * insert won. `orderId` is unique, so a Razorpay retry — or the client verify
 * callback racing the webhook for the same payment, which does happen — hits a
 * duplicate key, we return `alreadyGranted`, and nobody gets a second free
 * term. Extending the expiry first and writing the ledger after would make
 * every retry a free month, and the bug would be invisible: the numbers would
 * simply be generous.
 *
 * Safe to call from both the webhook and verify for that reason. Idempotent.
 */
export async function grantMembership(params: {
    userId: unknown;
    email: string;
    plan: MembershipPlan;
    orderId: string;
    paymentId: string;
    /** ₹ captured. */
    amount: number;
    now?: Date;
}): Promise<{ granted: boolean; alreadyGranted: boolean; expiresAt: Date | null }> {
    const { userId, email, plan, orderId, paymentId, amount } = params;
    const now = params.now ?? new Date();

    const user = (await CompanyKitUser.findById(userId)
        .select('membershipExpiresAt')
        .lean()) as { membershipExpiresAt?: Date } | null;
    if (!user) return { granted: false, alreadyGranted: false, expiresAt: null };

    const previousExpiresAt = user.membershipExpiresAt ?? null;
    // Stacks onto an unexpired term; starts from today if lapsed.
    const expiresAt = computeMembershipExpiry(plan, previousExpiresAt, now);

    try {
        await Membership.create({
            userId,
            email: email.toLowerCase(),
            planId: plan.id,
            planName: plan.name,
            months: plan.months,
            amount,
            orderId,
            paymentId,
            previousExpiresAt,
            expiresAt,
        });
    } catch (err: any) {
        if (err?.code === 11000) {
            // Already delivered. Report the expiry actually on the account
            // rather than the one we just computed — the computed one assumed
            // this purchase had not been applied yet, and it has.
            const fresh = (await CompanyKitUser.findById(userId)
                .select('membershipExpiresAt')
                .lean()) as { membershipExpiresAt?: Date } | null;
            return {
                granted: false,
                alreadyGranted: true,
                expiresAt: fresh?.membershipExpiresAt ?? null,
            };
        }
        throw err;
    }

    /* The ledger row is ours, so the extension is ours to make.
     *
     * Guarded with `$lt` rather than a bare $set: if two DIFFERENT purchases
     * land concurrently, both computed their expiry from the same starting
     * point and the smaller one must not overwrite the larger. Worst case a
     * term is granted once instead of twice — reconcilable from the ledger,
     * which is exactly why the ledger exists. Silently shortening someone's
     * paid access is not. */
    await CompanyKitUser.updateOne(
        {
            _id: userId,
            $or: [
                { membershipExpiresAt: { $lt: expiresAt } },
                { membershipExpiresAt: { $exists: false } },
            ],
        },
        {
            $set: { membershipExpiresAt: expiresAt, membershipPlanId: plan.id },
            /* "Member since" — the FIRST membership ever, never rewritten by a
             * renewal. $min, not $set, for the same reason savedJobs.appliedAt
             * uses it: walking someone through later purchases must not rewrite
             * the date they originally joined. Same caveat too — the field must
             * be ABSENT rather than null until the first grant, since $min will
             * not overwrite a stored null. Nothing writes null here. */
            $min: { membershipStartedAt: now },
        }
    );

    return { granted: true, alreadyGranted: false, expiresAt };
}
