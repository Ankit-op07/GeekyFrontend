import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { getAllowedSlugs } from '@/lib/appConstants';

function kitMatchesSlugs(kitSlug: string, allowedSlugs: Set<string>): boolean {
    for (const pattern of allowedSlugs) {
        if (kitSlug.toLowerCase().includes(pattern)) return true;
    }
    return false;
}

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
        let purchasedKits: string[] = [];
        if (session) {
            const user = await CompanyKitUser.findById(session.id).select('purchasedKits').lean();
            purchasedKits = (user as any)?.purchasedKits ?? [];
        }

        const allowedSlugs = purchasedKits.length > 0
            ? getAllowedSlugs(purchasedKits)
            : new Set<string>();

        const kits = await getKitsWithCounts();
        const result = kits.map((kit: any) => ({
            ...kit,
            hasAccess: kitMatchesSlugs(kit.slug, allowedSlugs),
        }));

        return NextResponse.json({ kits: result });
    } catch (error: any) {
        console.error('Learn kits error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
