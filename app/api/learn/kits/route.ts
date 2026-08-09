import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { buildKitAccessChecker, KIT_ACCESS_FIELDS } from '@/lib/learn-access';

type KitWithCounts = Record<string, any> & {
    chaptersCount: number;
    topicsCount: number;
};

const KIT_LIST_CACHE_TTL_MS = 60 * 1000;
let kitsWithCountsCache: { expiresAt: number; kits: KitWithCounts[] } | null = null;

async function getKitsWithCounts(): Promise<KitWithCounts[]> {
    const now = Date.now();
    if (kitsWithCountsCache && kitsWithCountsCache.expiresAt > now) {
        return kitsWithCountsCache.kits;
    }

    const [allKits, chapterCounts, topicCounts] = await Promise.all([
        Kit.find().sort({ order: 1 }).lean(),
        Chapter.aggregate([
            { $group: { _id: '$kitId', count: { $sum: 1 } } },
        ]),
        Topic.aggregate([
            { $group: { _id: '$kitId', count: { $sum: 1 } } },
        ]),
    ]);

    const chapterCountByKitId = new Map(
        chapterCounts.map((item: any) => [item._id.toString(), item.count])
    );
    const topicCountByKitId = new Map(
        topicCounts.map((item: any) => [item._id.toString(), item.count])
    );

    const kits = allKits.map((kit: any) => {
        const kitId = kit._id.toString();
        return {
            ...kit,
            chaptersCount: chapterCountByKitId.get(kitId) ?? 0,
            topicsCount: topicCountByKitId.get(kitId) ?? 0,
        };
    });

    kitsWithCountsCache = {
        expiresAt: now + KIT_LIST_CACHE_TTL_MS,
        kits,
    };

    return kits;
}

/**
 * GET /api/learn/kits
 * Returns ALL kits from DB. Each kit includes a `hasAccess` boolean
 * so the frontend can decide what to show (owned vs locked).
 * If user is not logged in, all kits are returned with hasAccess: false.
 */
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        // Get logged-in user
        const session = extractSessionFromRequest(request);
        const user = session
            ? await CompanyKitUser.findById(session.id).select(KIT_ACCESS_FIELDS).lean()
            : null;

        /* ONE checker, built from the user row, then asked per kit.
         *
         * This route used to call getAllowedSlugs() and match slugs itself. When
         * membership shipped, that inline copy of the rule never learned about
         * it, so a paying member saw "Preview" and "Buy" on every kit they
         * already had full access to. buildKitAccessChecker is the single
         * implementation — do not re-derive this here again. */
        const hasAccess = buildKitAccessChecker(user as any);
        /* The SAME checker with membership deliberately stripped out, so the UI
         * can tell "you bought this" from "your membership unlocks this".
         *
         * That distinction is not cosmetic: the kit card says "Lifetime access",
         * which is TRUE of a purchase and FALSE of a membership — that access
         * ends with the term. Showing it on a membership-unlocked kit is the
         * kind of claim that becomes a refund dispute. */
        const ownsOutright = buildKitAccessChecker({
            purchasedKits: (user as any)?.purchasedKits ?? [],
        });

        const kits = await getKitsWithCounts();
        const result = kits.map((kit: any) => ({
            ...kit,
            hasAccess: hasAccess(kit.slug),
            ownedOutright: ownsOutright(kit.slug),
        }));

        return NextResponse.json({ kits: result });
    } catch (error: any) {
        console.error('Learn kits error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
