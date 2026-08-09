import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import type { ICompanyKitUser } from '@/lib/models/CompanyKitUser';
import Kit from '@/lib/models/Kit';
import { getAllowedSlugs } from '@/lib/appConstants';
import { isMembershipPlanName } from '@/lib/membership';

interface RecordPurchaseParams {
    email: string;
    name?: string;
    planName?: string;
    paymentId: string;
    orderId: string;
}

interface RecordPurchaseResult {
    user: ICompanyKitUser;
    isNewUser: boolean;
}

/**
 * Upserts the CompanyKitUser for a completed payment, assigns the purchased
 * kit, and bumps the kit's purchasesCount. Shared by the client-side verify
 * callback and the Razorpay webhook so a purchase is recorded identically
 * regardless of which one fires.
 */
export async function recordPurchase({
    email,
    name,
    planName,
    paymentId,
    orderId,
}: RecordPurchaseParams): Promise<RecordPurchaseResult> {
    /* ── A membership must NEVER land in purchasedKits ────────────────────
     * purchasedKits is permanent by design — getAllowedSlugs() has no concept
     * of expiry, and the comments in appConstants.ts are explicit that entries
     * are appended, never removed. Writing a membership plan name here would
     * therefore grant the whole catalogue forever, and it could not be undone
     * later without also stripping genuine lifetime buyers, whose rows look
     * identical.
     *
     * This guard sits in recordPurchase rather than only at its callers because
     * this function is the SINGLE writer of purchasedKits, and one caller
     * (/api/payment/verify) takes `planName` straight from the request body.
     * Guarding at the writer means no present or future caller can make this
     * mistake, whatever it is handed.
     *
     * It runs FIRST — before the new-user branch below, which seeds
     * purchasedKits from the plan name and would otherwise write it on the one
     * path the guard was meant to cover.
     * ─────────────────────────────────────────────────────────────────────── */
    let plan = planName;
    if (plan && isMembershipPlanName(plan)) {
        console.error(
            `⚠️ recordPurchase refused a membership plan name ("${plan}") — ` +
                `memberships are granted via grantMembership(), not purchasedKits.`
        );
        plan = undefined;
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase();
    let user = await CompanyKitUser.findOne({ email: normalizedEmail });
    const isNewUser = !user;

    if (!user) {
        user = new CompanyKitUser({
            email: normalizedEmail,
            name: name || normalizedEmail.split('@')[0],
            emailVerified: true,
            subscriptionStatus: 'active',
            purchasedKits: plan ? [plan] : [],
        });
    }

    if (plan && !user.purchasedKits?.includes(plan)) {
        if (!user.purchasedKits) user.purchasedKits = [];
        user.purchasedKits.push(plan);

        try {
            const allowedSlugs = getAllowedSlugs([plan]);
            if (allowedSlugs.size > 0) {
                const orConditions = Array.from(allowedSlugs).map((s) => ({ slug: { $regex: s, $options: 'i' } }));
                await Kit.updateMany({ $or: orConditions }, { $inc: { purchasesCount: 1 } });
            }
        } catch (kitErr) {
            console.error('Failed to increment kit purchases:', kitErr);
        }
    }

    user.paymentId = paymentId;
    user.orderId = orderId;
    user.subscriptionStatus = 'active';
    await user.save();

    return { user, isNewUser };
}
