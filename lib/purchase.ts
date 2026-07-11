import connectToDatabase from '@/lib/db';
import CompanyKitUser, { ICompanyKitUser } from '@/lib/models/CompanyKitUser';
import Kit from '@/lib/models/Kit';
import { getAllowedSlugs } from '@/lib/appConstants';

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
            purchasedKits: planName ? [planName] : [],
        });
    }

    if (planName && !user.purchasedKits?.includes(planName)) {
        if (!user.purchasedKits) user.purchasedKits = [];
        user.purchasedKits.push(planName);

        try {
            const allowedSlugs = getAllowedSlugs([planName]);
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
