import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { buildKitAccessChecker, KIT_ACCESS_FIELDS } from '@/lib/learn-access';

/**
 * GET /api/learn/kits/[kitSlug]
 * Returns kit info + full sidebar tree (chapters with nested topics).
 * Requires authentication and kit access.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ kitSlug: string }> }
) {
    try {
        // Auth check
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { kitSlug } = await params;

        // Access check — verify user owns this kit
        const user = await CompanyKitUser.findById(session.id)
            .select(KIT_ACCESS_FIELDS)
            .lean() as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Single implementation — includes membership. This used to inline
        // getAllowedSlugs() + a substring match, which meant members were shown
        // locked content they had paid for. See buildKitAccessChecker.
        const hasAccess = buildKitAccessChecker(user)(kitSlug);

        const kit = await Kit.findOne({ slug: kitSlug }).lean();
        if (!kit) {
            return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
        }

        const chapters = await Chapter.find({ kitId: (kit as any)._id })
            .sort({ order: 1 })
            .lean();

        const sidebar = await Promise.all(
            chapters.map(async (ch: any) => {
                const topics = await Topic.find({ chapterId: ch._id })
                    .select('title slug order')
                    .sort({ order: 1 })
                    .lean();
                return {
                    _id: ch._id,
                    title: ch.title,
                    slug: ch.slug,
                    topics,
                };
            })
        );

        if (!hasAccess) {
            return NextResponse.json({ 
                kit, 
                sidebar, 
                isPreview: true, 
                firstChapterId: chapters.length > 0 ? chapters[0]._id : null 
            });
        }

        return NextResponse.json({ kit, sidebar, isPreview: false, firstChapterId: null });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
