/** DB helpers for interviews: kit context + the atomic daily-slot counter. */

import Kit from '@/lib/models/Kit';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

/**
 * Atomically reserve one of a user's daily slots for `field` (e.g.
 * 'interviewUsage' or 'voiceUsage'). Race-safe: the filter only matches on a new
 * day OR while under the limit, and the pipeline resets-or-increments in one op.
 * Returns the new count, or null if the cap is already spent.
 */
export async function reserveDailySlot(
    userId: string, field: 'interviewUsage' | 'voiceUsage', limit: number, today: string,
): Promise<number | null> {
    const updated = (await CompanyKitUser.findOneAndUpdate(
        {
            _id: userId,
            $or: [{ [`${field}.date`]: { $ne: today } }, { [`${field}.count`]: { $lt: limit } }],
        },
        [{
            $set: {
                [field]: {
                    date: today,
                    count: {
                        $cond: [
                            { $eq: [`$${field}.date`, today] },
                            { $add: [{ $ifNull: [`$${field}.count`, 0] }, 1] },
                            1,
                        ],
                    },
                },
            },
        }],
        { new: true, projection: { [field]: 1 }, updatePipeline: true } as any,
    )) as any;
    return updated ? (updated[field]?.count ?? limit) : null;
}

/** Give a reserved slot back (best-effort) — used when a downstream call fails. */
export async function refundDailySlot(
    userId: string, field: 'interviewUsage' | 'voiceUsage', today: string,
): Promise<void> {
    await CompanyKitUser.updateOne(
        { _id: userId, [`${field}.date`]: today, [`${field}.count`]: { $gt: 0 } },
        { $inc: { [`${field}.count`]: -1 } },
    ).catch(() => { /* best-effort */ });
}

export async function loadKitContext(
    kitSlug: string,
): Promise<{ kitName?: string; topicTitles: string[] }> {
    const kit = (await Kit.findOne({ slug: kitSlug }).select('_id name').lean()) as any;
    if (!kit) return { topicTitles: [] };
    const topics = (await Topic.find({ kitId: kit._id })
        .select('title')
        .limit(80)
        .lean()) as any[];
    return {
        kitName: kit.name,
        topicTitles: topics.map((t) => t.title).filter(Boolean),
    };
}
