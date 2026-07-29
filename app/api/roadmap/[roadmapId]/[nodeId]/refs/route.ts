import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import Topic from '@/lib/models/Topic';
import { getRoadmap, allNodes } from '@/lib/roadmaps';
import { getTopicReferences, type RefLink } from '@/lib/topic-references';

/**
 * GET /api/roadmap/[roadmapId]/[nodeId]/refs
 *
 * Free articles and videos for one node, reusing the curated per-topic table
 * the Learn reader's right rail already uses (`lib/topic-references.ts`). That
 * table is ~1900 lines, so it stays server-side and is fetched per open node
 * rather than shipped with the roadmap payload or bundled into the dashboard.
 *
 * Public: these are links to other people's free content, and the roadmap is
 * browsable by everyone.
 *
 * Topics whose slug does not resolve are skipped, so a node still returns the
 * references of the lessons that do exist.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roadmapId: string; nodeId: string }> }
) {
    try {
        const { roadmapId, nodeId } = await params;
        const roadmap = getRoadmap(roadmapId);
        if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });

        const node = allNodes(roadmap).find((n) => n.id === nodeId);
        if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

        // Which kit each referenced slug belongs to — getTopicReferences uses the
        // kit name only to build sensible fallback search links.
        const wanted: { kitSlug: string; slug: string }[] = [
            ...(node.topics ?? []).map((slug) => ({ kitSlug: roadmap.kitSlug, slug })),
            ...(node.crossKit ?? []).flatMap((ref) =>
                ref.topics.map((slug) => ({ kitSlug: ref.kitSlug, slug }))
            ),
        ];

        if (wanted.length === 0) {
            return NextResponse.json({ articles: [], videos: [] });
        }

        await connectToDatabase();

        const kitSlugs = [...new Set(wanted.map((w) => w.kitSlug))];
        const kits = (await Kit.find({ slug: { $in: kitSlugs } })
            .select('_id slug name')
            .lean()) as { _id: unknown; slug: string; name?: string }[];
        const kitBySlug = new Map(kits.map((k) => [k.slug, k]));

        const topics = (await Topic.find({
            kitId: { $in: kits.map((k) => k._id) },
            slug: { $in: wanted.map((w) => w.slug) },
        })
            .select('slug title kitId')
            .lean()) as { slug: string; title?: string; kitId: unknown }[];

        // (kitId, slug) → title. Slugs are only unique per kit, and two kits do
        // share slugs here (e.g. `async-await` exists in both the JS and Node
        // kits), so keying on slug alone would cross the wires.
        const titleByKey = new Map(
            topics.map((t) => [`${String(t.kitId)}::${t.slug}`, t.title || t.slug])
        );

        const articles: RefLink[] = [];
        const videos: RefLink[] = [];
        const seen = new Set<string>();

        for (const { kitSlug, slug } of wanted) {
            const kit = kitBySlug.get(kitSlug);
            if (!kit) continue;
            const title = titleByKey.get(`${String(kit._id)}::${slug}`);
            if (!title) continue;

            const refs = getTopicReferences(slug, title, kit.name);
            for (const article of refs.articles) {
                if (seen.has(article.url)) continue;
                seen.add(article.url);
                articles.push(article);
            }
            for (const video of refs.videos) {
                if (seen.has(video.url)) continue;
                seen.add(video.url);
                videos.push(video);
            }
        }

        // A node can point at five lessons; showing 20 links helps nobody.
        return NextResponse.json({
            articles: articles.slice(0, 8),
            videos: videos.slice(0, 6),
        });
    } catch (error: any) {
        console.error('Roadmap refs error:', error.message);
        return NextResponse.json({ error: 'Failed to load references' }, { status: 500 });
    }
}
