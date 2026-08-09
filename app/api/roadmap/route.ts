import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import RoadmapProgress from '@/lib/models/RoadmapProgress';
import { extractSessionFromRequest } from '@/lib/session';
import { buildKitAccessChecker, KIT_ACCESS_FIELDS } from '@/lib/learn-access';
import { ROADMAPS, allNodes } from '@/lib/roadmaps';

/**
 * GET /api/roadmap
 *
 * The picker: one summary card per roadmap. Deliberately public — the roadmap
 * itself is free to browse (only the kit LESSONS behind a node are gated), so a
 * logged-out visitor gets the same list with hasAccess=false and no progress.
 *
 * Returns no stage or node content; that is /api/roadmap/[roadmapId].
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);

        // Defaults to "no access" for a logged-out visitor.
        let hasKitAccess: (kitSlug: string) => boolean = () => false;
        const doneByRoadmap = new Map<string, number>();

        if (session) {
            await connectToDatabase();

            const [user, progressRows] = await Promise.all([
                CompanyKitUser.findById(session.id).select(KIT_ACCESS_FIELDS).lean() as Promise<{
                    purchasedKits?: string[];
                    membershipExpiresAt?: Date;
                } | null>,
                RoadmapProgress.find({ userId: session.id }).select('roadmapId nodes').lean() as Promise<
                    { roadmapId: string; nodes?: Record<string, string> }[]
                >,
            ]);

            hasKitAccess = buildKitAccessChecker(user);

            for (const row of progressRows) {
                const done = Object.values(row.nodes || {}).filter((s) => s === 'done').length;
                doneByRoadmap.set(row.roadmapId, done);
            }
        }

        const roadmaps = ROADMAPS.map((roadmap) => {
            const nodes = allNodes(roadmap);
            // Single implementation, shared with the learn routes — includes
            // membership and the FRAGMENT (not equality) slug rule.
            const hasAccess = hasKitAccess(roadmap.kitSlug);

            return {
                id: roadmap.id,
                kitSlug: roadmap.kitSlug,
                title: roadmap.title,
                tagline: roadmap.tagline,
                audience: roadmap.audience,
                weeks: roadmap.weeks,
                accent: roadmap.accent,
                stageCount: roadmap.stages.length,
                nodeCount: nodes.length,
                hasAccess,
                doneCount: doneByRoadmap.get(roadmap.id) ?? 0,
            };
        });

        return NextResponse.json({ roadmaps, isLoggedIn: !!session });
    } catch (error: any) {
        console.error('Roadmap list error:', error.message);
        return NextResponse.json({ error: 'Failed to load roadmaps' }, { status: 500 });
    }
}
