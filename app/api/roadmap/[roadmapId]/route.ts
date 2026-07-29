import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';
import RoadmapProgress from '@/lib/models/RoadmapProgress';
import { extractSessionFromRequest } from '@/lib/session';
import { resolveKitTopicAccess } from '@/lib/learn-access';
import { getRoadmap, ownKitTopicSlugs, crossKitTopicSlugs } from '@/lib/roadmaps';

/**
 * GET /api/roadmap/[roadmapId]
 *
 * The authored roadmap, with each lesson reference resolved to a real title and
 * a lock state, plus this user's ticks.
 *
 * Public on purpose. The roadmap — stages, node summaries, interview questions,
 * external links — is free for everyone; what is gated is the LESSON behind a
 * node, and that gate is `canRead` per topic, resolved through
 * `resolveKitTopicAccess()` so the purchased/preview rule stays in one place.
 * No lesson content is returned here at all, only titles and links.
 *
 * Curated article/video references are NOT included — they are large and only
 * one node is open at a time. See /api/roadmap/[roadmapId]/[nodeId]/refs.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roadmapId: string }> }
) {
    try {
        const { roadmapId } = await params;
        const roadmap = getRoadmap(roadmapId);
        if (!roadmap) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        await connectToDatabase();
        const session = extractSessionFromRequest(request);
        const userId = session?.id ?? null;

        // Own kit + every kit referenced by a crossKit node, resolved in parallel.
        const crossKits = crossKitTopicSlugs(roadmap);
        const [ownAccess, ...crossResults] = await Promise.all([
            resolveKitTopicAccess({
                userId,
                kitSlug: roadmap.kitSlug,
                topicSlugs: ownKitTopicSlugs(roadmap),
            }),
            ...Array.from(crossKits.entries()).map(async ([kitSlug, slugs]) => ({
                kitSlug,
                access: await resolveKitTopicAccess({
                    userId,
                    kitSlug,
                    topicSlugs: [...slugs],
                }),
            })),
        ]);

        const crossAccessByKit = new Map(crossResults.map((r) => [r.kitSlug, r.access]));

        // Display names for the "from the <X> kit" label on cross-kit links.
        const kitSlugs = [roadmap.kitSlug, ...crossKits.keys()];
        const kitRows = (await Kit.find({ slug: { $in: kitSlugs } })
            .select('slug name')
            .lean()) as { slug: string; name?: string }[];
        const kitNames = new Map(kitRows.map((k) => [k.slug, k.name || k.slug]));

        let progress: Record<string, string> = {};
        if (userId) {
            const row = (await RoadmapProgress.findOne({ userId, roadmapId })
                .select('nodes')
                .lean()) as { nodes?: Record<string, string> } | null;
            progress = row?.nodes || {};
        }

        const stages = roadmap.stages.map((stage) => ({
            id: stage.id,
            title: stage.title,
            goal: stage.goal,
            nodes: stage.nodes.map((node) => {
                const lessons = (node.topics ?? [])
                    .map((slug) => ownAccess.topics.get(slug))
                    .filter((t): t is NonNullable<typeof t> => !!t)
                    .map((t) => ({
                        slug: t.slug,
                        title: t.title,
                        canRead: t.canRead,
                        kitSlug: roadmap.kitSlug,
                        kitName: kitNames.get(roadmap.kitSlug) ?? roadmap.kitSlug,
                    }));

                const crossLessons = (node.crossKit ?? []).flatMap((ref) => {
                    const access = crossAccessByKit.get(ref.kitSlug);
                    if (!access) return [];
                    return ref.topics
                        .map((slug) => access.topics.get(slug))
                        .filter((t): t is NonNullable<typeof t> => !!t)
                        .map((t) => ({
                            slug: t.slug,
                            title: t.title,
                            canRead: t.canRead,
                            kitSlug: ref.kitSlug,
                            kitName: kitNames.get(ref.kitSlug) ?? ref.kitSlug,
                        }));
                });

                return {
                    id: node.id,
                    title: node.title,
                    summary: node.summary,
                    tier: node.tier,
                    kind: node.kind ?? 'core',
                    est: node.est ?? null,
                    external: node.external ?? [],
                    interview: node.interview ?? [],
                    build: node.build ?? null,
                    lessons: [...lessons, ...crossLessons],
                    /** True when at least one linked lesson is behind a paywall for this user. */
                    hasLockedLesson: [...lessons, ...crossLessons].some((l) => !l.canRead),
                    status: progress[node.id] ?? 'pending',
                };
            }),
        }));

        return NextResponse.json({
            roadmap: {
                id: roadmap.id,
                kitSlug: roadmap.kitSlug,
                kitName: kitNames.get(roadmap.kitSlug) ?? roadmap.kitSlug,
                title: roadmap.title,
                tagline: roadmap.tagline,
                audience: roadmap.audience,
                weeks: roadmap.weeks,
                accent: roadmap.accent,
                hasAccess: ownAccess.hasFullAccess,
                stages,
            },
            isLoggedIn: !!session,
        });
    } catch (error: any) {
        console.error('Roadmap detail error:', error.message);
        return NextResponse.json({ error: 'Failed to load roadmap' }, { status: 500 });
    }
}
