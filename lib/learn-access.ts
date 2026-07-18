import Kit from '@/lib/models/Kit';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { getAllowedSlugs } from '@/lib/appConstants';

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
 *   • Full access (kit purchased) → any topic.
 *   • No purchase ("preview") → only topics in the kit's FIRST chapter.
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

export async function resolveTopicAccess(params: {
    userId: string;
    kitSlug: string;
    topicSlug: string;
}): Promise<TopicAccess> {
    const { userId, kitSlug, topicSlug } = params;

    const user = (await CompanyKitUser.findById(userId).select('purchasedKits').lean()) as {
        purchasedKits?: string[];
    } | null;
    if (!user) return deny('user-not-found');

    // NOTE: substring match, not equality — an allowed slug is a FRAGMENT
    // ("complete" grants "complete-frontend-kit"). Preserved from the original
    // learn route; changing it would silently revoke access.
    const allowedSlugs = getAllowedSlugs(user.purchasedKits || []);
    const hasFullAccess = Array.from(allowedSlugs).some((s) =>
        kitSlug.toLowerCase().includes(s.toLowerCase())
    );

    const kit = (await Kit.findOne({ slug: kitSlug }).select('_id slug').lean()) as {
        _id: unknown;
        slug: string;
    } | null;
    if (!kit) return deny('kit-not-found', { hasFullAccess });

    const topic = (await Topic.findOne({ kitId: kit._id, slug: topicSlug })
        .select('_id title slug content chapterId')
        .lean()) as TopicAccess['topic'];
    if (!topic) return deny('topic-not-found', { hasFullAccess, kit });

    if (hasFullAccess) {
        return { reason: 'ok', canRead: true, hasFullAccess: true, kit, topic };
    }

    // Preview: the first chapter is the shop window, the rest is paid.
    const firstChapter = (await Chapter.findOne({ kitId: kit._id })
        .sort({ order: 1 })
        .select('_id')
        .lean()) as { _id: unknown } | null;

    const isFirstChapter =
        !!firstChapter && String(topic.chapterId ?? '') === String(firstChapter._id ?? '');

    return {
        reason: isFirstChapter ? 'ok' : 'locked',
        canRead: isFirstChapter,
        hasFullAccess: false,
        kit,
        topic,
    };
}
