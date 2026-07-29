import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import RoadmapProgress, { type RoadmapProgressStatus } from '@/lib/models/RoadmapProgress';
import { extractSessionFromRequest } from '@/lib/session';
import { getRoadmap, allNodes } from '@/lib/roadmaps';

const STATUSES: RoadmapProgressStatus[] = ['learning', 'done', 'skipped'];

/**
 * PUT /api/roadmap/progress   { roadmapId, nodeId, status }
 *
 * Set (or clear) one node's marker. `status: "pending"` unsets the key rather
 * than storing it — an untouched roadmap should cost nothing.
 *
 * ⚠️  `nodeId` is used to build a Mongo update PATH (`nodes.<id>`). It is
 * therefore never taken from the body directly: it is matched against the
 * authored roadmap's node ids first and the matched value is what gets written.
 * A dot or `$` in an attacker-supplied key would otherwise be interpreted as a
 * path or an operator.
 */
export async function PUT(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const roadmapId = typeof body?.roadmapId === 'string' ? body.roadmapId : '';
        const rawNodeId = typeof body?.nodeId === 'string' ? body.nodeId : '';
        const status = typeof body?.status === 'string' ? body.status : '';

        const roadmap = getRoadmap(roadmapId);
        if (!roadmap) {
            return NextResponse.json({ error: 'Unknown roadmap' }, { status: 400 });
        }

        // Match, do not trust: `nodeId` is the id from OUR data, not from theirs.
        const node = allNodes(roadmap).find((n) => n.id === rawNodeId);
        if (!node) {
            return NextResponse.json({ error: 'Unknown node' }, { status: 400 });
        }
        const nodeId = node.id;

        if (status !== 'pending' && !STATUSES.includes(status as RoadmapProgressStatus)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectToDatabase();

        const update =
            status === 'pending'
                ? { $unset: { [`nodes.${nodeId}`]: '' } }
                : { $set: { [`nodes.${nodeId}`]: status } };

        const save = () =>
            RoadmapProgress.findOneAndUpdate(
                { userId: session.id, roadmapId: roadmap.id },
                update,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
                .select('nodes')
                .lean() as Promise<{ nodes?: Record<string, string> } | null>;

        let row: { nodes?: Record<string, string> } | null;
        try {
            row = await save();
        } catch (err: any) {
            // An upsert against a unique index can lose a race and come back as a
            // duplicate key: two nodes ticked in the same instant on a roadmap
            // with no document yet. The loser's row now exists, so the retry is
            // a plain update and succeeds. Anything else is a real error.
            if (err?.code !== 11000) throw err;
            row = await save();
        }

        return NextResponse.json({ ok: true, nodes: row?.nodes || {} });
    } catch (error: any) {
        console.error('Roadmap progress error:', error.message);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}
