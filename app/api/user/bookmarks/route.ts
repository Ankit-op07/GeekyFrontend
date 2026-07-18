import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveTopicAccess } from '@/lib/learn-access';

/**
 * Topic bookmarks — the user's "saved for later" list, surfaced on the
 * dashboard Bookmarks tab and toggled from the Learn reader.
 *
 * A topic is identified by (kitSlug, topicSlug); slugs are unique only per kit.
 * Adding a bookmark goes through resolveTopicAccess() — the single source of
 * truth for topic access — so we never save a topic that doesn't exist or that
 * the user can't read, and we store the canonical title from the DB.
 */

type BookmarkAction = 'toggle' | 'add' | 'remove';

const sameTopic = (b: any, kitSlug: string, topicSlug: string) =>
    b.kitSlug === kitSlug && b.topicSlug === topicSlug;

// Newest-first, plain objects for the client.
function serialize(bookmarks: any[]) {
    return [...bookmarks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((b) => ({
            kitSlug: b.kitSlug,
            topicSlug: b.topicSlug,
            title: b.title || b.topicSlug,
            chapterTitle: b.chapterTitle || '',
            createdAt: b.createdAt,
        }));
}

export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = (await CompanyKitUser.findById(session.id)
            .select('bookmarkedTopics')
            .lean()) as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ bookmarks: serialize(user.bookmarkedTopics || []) });
    } catch (error: any) {
        console.error('GET /api/user/bookmarks error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => null);
        const kitSlug = typeof body?.kitSlug === 'string' ? body.kitSlug : '';
        const topicSlug = typeof body?.topicSlug === 'string' ? body.topicSlug : '';
        const action: BookmarkAction = ['toggle', 'add', 'remove'].includes(body?.action)
            ? body.action
            : 'toggle';
        const chapterTitle = typeof body?.chapterTitle === 'string' ? body.chapterTitle : '';

        if (!kitSlug || !topicSlug) {
            return NextResponse.json({ error: 'Missing kitSlug or topicSlug' }, { status: 400 });
        }

        await connectToDatabase();

        // Resolve intent. `toggle` needs current state; `add`/`remove` (what the
        // client sends based on the button's displayed state) are explicit and
        // idempotent — so a click made from a not-yet-hydrated UI can never
        // silently invert a saved bookmark.
        let wantAdd: boolean;
        if (action === 'toggle') {
            const doc = (await CompanyKitUser.findById(session.id)
                .select('bookmarkedTopics.kitSlug bookmarkedTopics.topicSlug')
                .lean()) as any;
            if (!doc) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            wantAdd = !(doc.bookmarkedTopics || []).some((b: any) => sameTopic(b, kitSlug, topicSlug));
        } else {
            wantAdd = action === 'add';
        }

        if (wantAdd) {
            // Gate on real access + canonical title (never bookmark a locked or
            // non-existent topic).
            const access = await resolveTopicAccess({ userId: session.id, kitSlug, topicSlug });
            if (!access.canRead || !access.topic) {
                return NextResponse.json({ error: 'locked', isPreview: true }, { status: 403 });
            }
            // Atomic guarded push: the $not/$elemMatch filter means a concurrent
            // double-add can't create duplicate entries — the second write's
            // filter no longer matches, so it's a no-op.
            await CompanyKitUser.updateOne(
                { _id: session.id, bookmarkedTopics: { $not: { $elemMatch: { kitSlug, topicSlug } } } },
                { $push: { bookmarkedTopics: { kitSlug, topicSlug, title: access.topic.title || topicSlug, chapterTitle, createdAt: new Date() } } },
            );
        } else {
            await CompanyKitUser.updateOne(
                { _id: session.id },
                { $pull: { bookmarkedTopics: { kitSlug, topicSlug } } },
            );
        }

        const fresh = (await CompanyKitUser.findById(session.id)
            .select('bookmarkedTopics')
            .lean()) as any;

        return NextResponse.json({
            bookmarks: serialize(fresh?.bookmarkedTopics || []),
            bookmarked: wantAdd,
        });
    } catch (error: any) {
        console.error('POST /api/user/bookmarks error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
