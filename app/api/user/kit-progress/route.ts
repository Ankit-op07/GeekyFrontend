import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import Kit from '@/lib/models/Kit';
import Topic from '@/lib/models/Topic';
import { extractSessionFromRequest } from '@/lib/session';

const DEFAULT_KIT_SLUG = 'react-interview-kit';

async function getTopicCount(kitSlug: string): Promise<number> {
    const kit = await Kit.findOne({ slug: kitSlug }).select('_id').lean() as any;
    if (!kit) return 0;
    return Topic.countDocuments({ kitId: kit._id });
}

function buildProgress(completedTopics: string[], totalTopics: number) {
    const uniqueCompleted = Array.from(new Set(completedTopics.filter(Boolean)));
    const completedCount = uniqueCompleted.length;
    const progressPercent = totalTopics > 0
        ? Math.min(100, Math.round((completedCount / totalTopics) * 100))
        : 0;

    return { uniqueCompleted, completedCount, progressPercent };
}

export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const kitSlug = searchParams.get('kitSlug') || DEFAULT_KIT_SLUG;

        await connectToDatabase();
        const [user, totalTopics] = await Promise.all([
            CompanyKitUser.findById(session.id).select('kitProgress').lean() as any,
            getTopicCount(kitSlug),
        ]);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const progress = (user.kitProgress || []).find((p: any) => p.kitSlug === kitSlug);

        return NextResponse.json({
            kitSlug,
            totalTopics,
            completedTopics: progress?.completedTopics || [],
            lastTopicSlug: progress?.lastTopicSlug || null,
            completedCount: progress?.completedCount || 0,
            progressPercent: progress?.progressPercent || 0,
            updatedAt: progress?.updatedAt || null,
        });
    } catch (error: any) {
        console.error('GET /api/user/kit-progress error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const kitSlug = body.kitSlug || DEFAULT_KIT_SLUG;
        const topicSlug = body.topicSlug;
        const action = body.action;

        if (!['complete', 'incomplete', 'sync', 'view'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await connectToDatabase();

        const [user, totalTopics] = await Promise.all([
            CompanyKitUser.findById(session.id),
            getTopicCount(kitSlug),
        ]);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const progressList = (user.kitProgress || []) as any[];
        let progress = progressList.find((p) => p.kitSlug === kitSlug);

        if (!progress) {
            progress = {
                kitSlug,
                completedTopics: [],
                completedCount: 0,
                totalTopics,
                progressPercent: 0,
                updatedAt: new Date(),
            };
            progressList.push(progress);
        }

        let completedTopics = progress.completedTopics || [];

        if (action === 'sync' && Array.isArray(body.completedTopics)) {
            completedTopics = body.completedTopics;
        } else if (topicSlug && action === 'complete') {
            completedTopics = [...completedTopics, topicSlug];
        } else if (topicSlug && action === 'incomplete') {
            completedTopics = completedTopics.filter((slug: string) => slug !== topicSlug);
        }

        const { uniqueCompleted, completedCount, progressPercent } = buildProgress(completedTopics, totalTopics);

        progress.completedTopics = uniqueCompleted;
        progress.lastTopicSlug = topicSlug || progress.lastTopicSlug;
        progress.completedCount = completedCount;
        progress.totalTopics = totalTopics;
        progress.progressPercent = progressPercent;
        progress.updatedAt = new Date();

        user.kitProgress = progressList;
        await user.save();

        return NextResponse.json({
            kitSlug,
            completedTopics: uniqueCompleted,
            lastTopicSlug: progress.lastTopicSlug || null,
            completedCount,
            totalTopics,
            progressPercent,
            updatedAt: progress.updatedAt,
        });
    } catch (error: any) {
        console.error('POST /api/user/kit-progress error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
