import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { isMembershipActive } from '@/lib/membership';
import type { MembershipStatus } from '@/lib/membership-access';
import { membershipStatusFrom } from '@/lib/membership-access';

/**
 * Which dashboard features require a membership — the single source of truth.
 *
 * The DSA sheet, Contests and the Job board are the membership tier's reason to
 * exist: unlike the kits, they keep costing us something (feed ingestion, cron
 * runs) and they keep being worth something after you have read them once, which
 * is what a recurring charge is actually for.
 *
 * Every surface over these features gates through resolveFeatureAccess(). This
 * is the same discipline as resolveTopicAccess() in lib/learn-access.ts, and for
 * the same documented reason: when the rule lived inline, one of several routes
 * forgot it and leaked paid content. A UI-only gate is not a gate — the tab can
 * be hidden and /api/jobs still answers.
 */

export type MemberFeature = 'dsa' | 'contests' | 'jobs';

export const MEMBER_FEATURES: Record<MemberFeature, { label: string; blurb: string }> = {
    dsa: {
        label: 'DSA Sheet',
        blurb: '155 interview problems with our approach, video solutions, notes and progress tracking.',
    },
    contests: {
        label: 'Contests',
        blurb: 'Every upcoming Codeforces, AtCoder, CodeChef and LeetCode round, with planning and email reminders.',
    },
    jobs: {
        label: 'Jobs',
        blurb: 'Indian developer openings from 50+ company boards, deduplicated, with an application tracker.',
    },
};

/**
 * Do people who already bought a kit keep these three features for free?
 *
 * FALSE, per the spec ("put the DSA, Contests, Jobs tab for only membership
 * people only"). Be aware of what that means in practice: buyers who have been
 * using the job board and DSA tracker lose them the day this ships. That is a
 * real cost — removing a working feature from a paying customer generates
 * refund requests and is the kind of thing that gets screenshotted.
 *
 * Flipping this to `true` grandfathers every existing kit buyer instead, which
 * costs nothing today (they have already paid) and still gates the features for
 * everyone new. It is one line precisely so the decision stays reversible after
 * the first week of support email.
 */
export const GRANDFATHER_EXISTING_BUYERS = false;

export interface FeatureAccess {
    allowed: boolean;
    /** Why — drives which upsell copy the client shows. */
    reason: 'member' | 'grandfathered' | 'needs-membership' | 'needs-auth';
    membership: MembershipStatus;
}

/**
 * Resolve whether this user may use a membership-gated feature.
 *
 * `userId` null (signed out) → 'needs-auth'.
 *
 * CONNECTS TO THE DATABASE ITSELF rather than requiring callers to have done so,
 * which is how lib/purchase.ts handles the same problem. Not a style choice: the
 * DSA routes that call this all connect AFTER resolving access — reasonable when
 * the check was pure, and every one of them would have thrown the moment it
 * started reading an expiry. connectToDatabase() is cached and idempotent, so
 * owning the call here costs nothing and removes an ordering rule that nine
 * existing call sites already got wrong.
 */
export async function resolveFeatureAccess(
    userId: string | null | undefined,
    _feature: MemberFeature
): Promise<FeatureAccess> {
    const inactive = membershipStatusFrom(null, null);

    if (!userId) {
        return { allowed: false, reason: 'needs-auth', membership: inactive };
    }

    await connectToDatabase();

    const user = (await CompanyKitUser.findById(userId)
        .select('membershipExpiresAt membershipPlanId purchasedKits')
        .lean()) as {
        membershipExpiresAt?: Date;
        membershipPlanId?: string;
        purchasedKits?: string[];
    } | null;

    if (!user) return { allowed: false, reason: 'needs-auth', membership: inactive };

    const membership = membershipStatusFrom(user.membershipExpiresAt, user.membershipPlanId);

    if (isMembershipActive(user.membershipExpiresAt)) {
        return { allowed: true, reason: 'member', membership };
    }

    if (GRANDFATHER_EXISTING_BUYERS && (user.purchasedKits?.length ?? 0) > 0) {
        return { allowed: true, reason: 'grandfathered', membership };
    }

    // Note this returns the (expired) membership too — the upsell screen says
    // "your membership ended on <date>", which converts far better than copy
    // that treats a lapsed member as a stranger.
    return { allowed: false, reason: 'needs-membership', membership };
}
