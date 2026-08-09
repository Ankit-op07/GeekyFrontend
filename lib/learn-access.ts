import Kit from '@/lib/models/Kit';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { getAllowedSlugs } from '@/lib/appConstants';
import { isMembershipActive } from '@/lib/membership';

/**
 * Who may read a given topic — the single source of truth.
 *
 * WHY THIS EXISTS
 * ---------------
 * This rule used to live inline in app/api/learn/kits/[kitSlug]/[topicSlug],
 * which meant every NEW surface over the same content had to remember to
 * re-implement it. /api/quiz/* didn't, and shipped checking only that a session
 * existed — so any free signup could read quiz content for paid chapters by
 * calling the API directly. The reader hid it client-side, which is not a gate.
 *
 * PRD-005 §5 promises "access reuses getAllowedSlugs() — no new auth surface".
 * That is only true if there is ONE implementation. This is it. Any new surface
 * over topic content (quiz, exercises, notes...) calls this rather than
 * re-deriving the rule.
 *
 * THE RULE
 * --------
 *   • Active membership → any topic in any kit, until it expires.
 *   • Full access (kit purchased) → any topic in that kit, forever.
 *   • Neither ("preview") → only topics in the kit's FIRST chapter.
 *
 * Membership and purchase are independent: when a membership lapses the user
 * drops back to the kits they bought, never below.
 *
 * Callers must have already run connectToDatabase().
 */

export type TopicAccessReason =
    | 'ok'
    | 'user-not-found'
    | 'kit-not-found'
    | 'topic-not-found'
    | 'locked';

export interface TopicAccess {
    /** Why access resolved the way it did. 'ok' means canRead is true. */
    reason: TopicAccessReason;
    /** May this user read this topic at all? */
    canRead: boolean;
    /**
     * Has the user PURCHASED this kit (vs. reading it as a free preview)?
     *
     * Distinct from `canRead`: a preview user reading chapter 1 has
     * canRead=true, hasFullAccess=false. Phase-0's go/no-go gate lives or dies
     * on this distinction — PRD-005 §15 item 2 says the gate is worthless if it
     * measures buyers when the thing being validated is conversion of
     * non-buyers. Record it on the attempt, don't infer it later.
     */
    hasFullAccess: boolean;
    kit: { _id: unknown; slug: string } | null;
    topic: { _id: unknown; title?: string; slug?: string; content?: string; chapterId?: unknown } | null;
}

const deny = (reason: TopicAccessReason, extra: Partial<TopicAccess> = {}): TopicAccess => ({
    reason,
    canRead: false,
    hasFullAccess: false,
    kit: null,
    topic: null,
    ...extra,
});

/**
 * Kit-level half of THE RULE, shared by the single-topic and bulk resolvers.
 *
 * Split out so that "purchased → everything, otherwise → first chapter only"
 * still has exactly one implementation once a second caller (the roadmap, which
 * needs the lock state of ~70 topics per request and cannot afford 70 round
 * trips) exists. Callers must not re-derive either half.
 *
 * `userId` may be null: a logged-out visitor is simply a preview user.
 */
export interface KitAccess {
    hasFullAccess: boolean;
    kit: { _id: unknown; slug: string } | null;
    /** _id of the free preview chapter (the first one), as a string. */
    previewChapterId: string | null;
    /** False only when a userId was supplied and no such user row exists. */
    userExists: boolean;
}

export async function resolveKitAccess(params: {
    userId: string | null;
    kitSlug: string;
}): Promise<KitAccess> {
    const { userId, kitSlug } = params;

    let purchasedKits: string[] = [];
    let userExists = true;
    let isMember = false;
    if (userId) {
        const user = (await CompanyKitUser.findById(userId)
            .select('purchasedKits membershipExpiresAt')
            .lean()) as {
            purchasedKits?: string[];
            membershipExpiresAt?: Date;
        } | null;
        if (!user) {
            return { hasFullAccess: false, kit: null, previewChapterId: null, userExists: false };
        }
        purchasedKits = user.purchasedKits || [];
        isMember = isMembershipActive(user.membershipExpiresAt);
    }

    // NOTE: substring match, not equality — an allowed slug is a FRAGMENT
    // ("complete" grants "complete-frontend-kit"). Preserved from the original
    // learn route; changing it would silently revoke access.
    const allowedSlugs = getAllowedSlugs(purchasedKits);
    /**
     * An active membership unlocks every kit, for as long as it lasts.
     *
     * Deliberately OR'd with the purchase check rather than replacing it: the
     * two are independent grants and a lapsed member must fall back to exactly
     * the kits they bought outright, not to nothing. Putting membership here —
     * inside the one resolver every topic/quiz/roadmap surface already calls —
     * is what makes "membership grants the whole platform" true everywhere at
     * once, instead of true on each surface someone remembered to update.
     */
    const hasFullAccess =
        isMember ||
        Array.from(allowedSlugs).some((s) => kitSlug.toLowerCase().includes(s.toLowerCase()));

    const kit = (await Kit.findOne({ slug: kitSlug }).select('_id slug').lean()) as {
        _id: unknown;
        slug: string;
    } | null;
    if (!kit) return { hasFullAccess, kit: null, previewChapterId: null, userExists };

    // Preview: the first chapter is the shop window, the rest is paid.
    //
    // Skipped entirely for a buyer — `canReadTopic` short-circuits on
    // hasFullAccess and never reads it, so querying anyway would add a chapter
    // lookup to every request a paying user makes. The original inline rule had
    // the same short-circuit and this preserves it.
    const firstChapter = hasFullAccess
        ? null
        : ((await Chapter.findOne({ kitId: kit._id })
              .sort({ order: 1 })
              .select('_id')
              .lean()) as { _id: unknown } | null);

    return {
        hasFullAccess,
        kit,
        previewChapterId: firstChapter ? String(firstChapter._id) : null,
        userExists,
    };
}

/**
 * "Does this user have full access to <kitSlug>?" as a reusable predicate.
 *
 * WHY THIS EXISTS, and it is the same story as the file header.
 *
 * `resolveKitAccess` above is the resolver for ONE kit, and it does its own
 * database read. Several routes need the answer for MANY kits at once from a
 * user row they have already loaded — the kit list, the roadmap — so they were
 * each calling getAllowedSlugs() and re-implementing the substring match
 * inline. That was survivable while purchase was the only grant. The moment
 * membership was added, every one of those routes silently kept answering the
 * old question: a paying member saw "Preview" and "Buy" on kits they had full
 * access to, because four separate copies of the rule never learned about
 * expiry. Exactly the bug this file's header warns about, in the same file.
 *
 * So: build the checker ONCE from a user row, then call it per kit. No route
 * should ever call getAllowedSlugs() directly again.
 *
 * `user` may be null — a logged-out visitor simply has access to nothing.
 */
export function buildKitAccessChecker(
    user: { purchasedKits?: string[]; membershipExpiresAt?: Date } | null | undefined
): (kitSlug: string) => boolean {
    // An active membership unlocks every kit for as long as it lasts. OR'd with
    // the purchase check, never replacing it: a lapsed member must fall back to
    // exactly the kits they bought outright, not to nothing.
    const isMember = isMembershipActive(user?.membershipExpiresAt);
    const allowed = Array.from(getAllowedSlugs(user?.purchasedKits || [])).map((s) =>
        s.toLowerCase()
    );

    return (kitSlug: string) => {
        if (isMember) return true;
        const slug = (kitSlug || '').toLowerCase();
        // Substring match, not equality — an allowed slug is a FRAGMENT.
        return allowed.some((s) => slug.includes(s));
    };
}

/** The fields `buildKitAccessChecker` needs. Use in `.select()` so a route
 *  cannot forget `membershipExpiresAt` and quietly lock members out again. */
export const KIT_ACCESS_FIELDS = 'purchasedKits membershipExpiresAt';

/** Topic-level half of THE RULE. Pure — no I/O, so both resolvers can share it. */
function canReadTopic(access: KitAccess, chapterId: unknown): boolean {
    if (access.hasFullAccess) return true;
    return !!access.previewChapterId && String(chapterId ?? '') === access.previewChapterId;
}

export async function resolveTopicAccess(params: {
    userId: string;
    kitSlug: string;
    topicSlug: string;
}): Promise<TopicAccess> {
    const { userId, kitSlug, topicSlug } = params;

    const access = await resolveKitAccess({ userId, kitSlug });
    if (!access.userExists) return deny('user-not-found');

    const { hasFullAccess, kit } = access;
    if (!kit) return deny('kit-not-found', { hasFullAccess });

    const topic = (await Topic.findOne({ kitId: kit._id, slug: topicSlug })
        .select('_id title slug content chapterId')
        .lean()) as TopicAccess['topic'];
    if (!topic) return deny('topic-not-found', { hasFullAccess, kit });

    const canRead = canReadTopic(access, topic?.chapterId);
    return {
        reason: canRead ? 'ok' : 'locked',
        canRead,
        hasFullAccess,
        kit,
        topic,
    };
}

/** One topic's lock state, as returned by the bulk resolver. */
export interface TopicAccessSummary {
    slug: string;
    title: string;
    /** May this user open the lesson? */
    canRead: boolean;
}

/**
 * Bulk version of THE RULE: lock state for many topics in one kit, in two
 * queries instead of 2N.
 *
 * Deliberately returns NO `content` — this powers link lists (the roadmap
 * drawer), not a reader. Slugs that do not exist in the kit are omitted rather
 * than returned as locked, so a caller can tell "not bought" from "typo".
 */
export async function resolveKitTopicAccess(params: {
    userId: string | null;
    kitSlug: string;
    topicSlugs: string[];
}): Promise<{ hasFullAccess: boolean; kitExists: boolean; topics: Map<string, TopicAccessSummary> }> {
    const { userId, kitSlug, topicSlugs } = params;
    const topics = new Map<string, TopicAccessSummary>();

    if (topicSlugs.length === 0) {
        const access = await resolveKitAccess({ userId, kitSlug });
        return { hasFullAccess: access.hasFullAccess, kitExists: !!access.kit, topics };
    }

    const access = await resolveKitAccess({ userId, kitSlug });
    if (!access.kit) {
        return { hasFullAccess: access.hasFullAccess, kitExists: false, topics };
    }

    const rows = (await Topic.find({ kitId: access.kit._id, slug: { $in: topicSlugs } })
        .select('slug title chapterId')
        .lean()) as { slug: string; title?: string; chapterId?: unknown }[];

    for (const row of rows) {
        topics.set(row.slug, {
            slug: row.slug,
            title: row.title || row.slug,
            canRead: canReadTopic(access, row.chapterId),
        });
    }

    return { hasFullAccess: access.hasFullAccess, kitExists: true, topics };
}
