import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { getAllowedSlugs } from '@/lib/appConstants';

function kitMatchesSlugs(kitSlug: string, allowedSlugs: Set<string> | 'all'): boolean {
    if (allowedSlugs === 'all') return true;
    for (const pattern of allowedSlugs) {
        if (kitSlug.toLowerCase().includes(pattern)) return true;
    }
    return false;
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

        // Fetch all kits with chapter/topic counts
        const allKits = await Kit.find().sort({ order: 1 }).lean();

        const result = await Promise.all(
            allKits.map(async (kit: any) => {
                const [chaptersCount, topicsCount] = await Promise.all([
                    Chapter.countDocuments({ kitId: kit._id }),
                    Topic.countDocuments({ kitId: kit._id }),
                ]);
                return {
                    ...kit,
                    chaptersCount,
                    topicsCount,
                    hasAccess: kitMatchesSlugs(kit.slug, allowedSlugs),
                };
            })
        );

        return NextResponse.json({ kits: result });
    } catch (error: any) {
        console.error('Learn kits error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
