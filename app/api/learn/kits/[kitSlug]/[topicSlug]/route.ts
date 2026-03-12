import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Topic from '@/lib/models/Topic';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { getAllowedSlugs } from '@/lib/appConstants';

/**
 * GET /api/learn/kits/[kitSlug]/[topicSlug]
 * Returns topic content (markdown).
 * Requires authentication and kit access.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ kitSlug: string; topicSlug: string }> }
) {
    try {
        // Auth check
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { kitSlug, topicSlug } = await params;

        // Access check
        const user = await CompanyKitUser.findById(session.id)
            .select('purchasedKits')
            .lean() as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const allowedSlugs = getAllowedSlugs(user.purchasedKits || []);
        let hasAccess = false;
        if (allowedSlugs === 'all') {
            hasAccess = true;
        } else {
            hasAccess = Array.from(allowedSlugs).some(s =>
                kitSlug.toLowerCase().includes(s.toLowerCase())
            );
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const kit = await Kit.findOne({ slug: kitSlug }).lean();
        if (!kit) {
            return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
        }

        const topic = await Topic.findOne({
            kitId: (kit as any)._id,
            slug: topicSlug,
        }).lean();

        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Record streak activity
        try {
            await fetch(new URL('/api/user/streak', request.url).toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                },
            });
        } catch { /* non-critical */ }

        return NextResponse.json({ topic });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
