import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import Kit from '@/lib/models/Kit';
import Topic from '@/lib/models/Topic';
import { extractSessionFromRequest } from '@/lib/session';

const REACT_KIT_SLUG = 'react-interview-kit';

function initialsFromName(name = '') {
    return name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
}

export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const kit = await Kit.findOne({ slug: REACT_KIT_SLUG }).select('_id slug name').lean() as any;
        const totalTopics = kit ? await Topic.countDocuments({ kitId: kit._id }) : 0;

        const users = await CompanyKitUser.find({
            $or: [
                { 'kitProgress.kitSlug': REACT_KIT_SLUG },
                { purchasedKits: /react/i },
            ],
        })
            .select('name email profilePicture currentStreak longestStreak kitProgress')
            .lean() as any[];

        const rows = users.map((user) => {
            const progress = (user.kitProgress || []).find((p: any) => p.kitSlug === REACT_KIT_SLUG);
            const completedCount = progress?.completedCount || 0;
            const progressPercent = totalTopics > 0
                ? Math.min(100, Math.round((completedCount / totalTopics) * 100))
                : progress?.progressPercent || 0;

            return {
                userId: String(user._id),
                name: user.name || 'Student',
                initials: initialsFromName(user.name),
                profilePicture: user.profilePicture || null,
                completedCount,
                totalTopics,
                progressPercent,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastActiveAt: progress?.updatedAt || null,
                isCurrentUser: String(user._id) === session.id,
            };
        });

        rows.sort((a, b) => {
            if (b.progressPercent !== a.progressPercent) return b.progressPercent - a.progressPercent;
            if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
            if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
            return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
        });

        const rankedRows = rows.map((row, index) => ({ ...row, rank: index + 1 }));
        const currentUser = rankedRows.find((row) => row.isCurrentUser) || null;

        return NextResponse.json({
            kit: {
                slug: REACT_KIT_SLUG,
                name: kit?.name || 'React.js Interview Kit',
                totalTopics,
            },
            leaderboard: rankedRows.slice(0, 25),
            currentUser,
            participantsCount: rankedRows.length,
        });
    } catch (error: any) {
        console.error('GET /api/leaderboard/react error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
