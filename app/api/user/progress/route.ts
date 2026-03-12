import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { verifySessionToken } from '@/lib/session';

/**
 * GET /api/user/progress
 * Returns the current user's completed and favorite question IDs
 */
export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = await CompanyKitUser.findById(session.id)
            .select('completedQuestions favoriteQuestions')
            .lean();

        return NextResponse.json({
            completedQuestions: user?.completedQuestions || [],
            favoriteQuestions: user?.favoriteQuestions || [],
        });
    } catch (error: any) {
        console.error('GET /api/user/progress error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/user/progress
 * Toggle a question as completed or favorited
 * Body: { questionId: string, action: "complete" | "favorite" }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { questionId, action } = await req.json();

        if (!questionId || !['complete', 'favorite'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request. Need questionId and action (complete|favorite)' }, { status: 400 });
        }

        await connectToDatabase();

        const field = action === 'complete' ? 'completedQuestions' : 'favoriteQuestions';
        const user = await CompanyKitUser.findById(session.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const arr: string[] = user[field] || [];
        const idx = arr.indexOf(questionId);

        if (idx === -1) {
            arr.push(questionId);
        } else {
            arr.splice(idx, 1);
        }

        user[field] = arr;
        await user.save();

        return NextResponse.json({
            [field]: arr,
            toggled: idx === -1 ? 'added' : 'removed',
        });
    } catch (error: any) {
        console.error('POST /api/user/progress error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── Helper ───────────────────────────────────────────────
async function getSessionUser(): Promise<{ id: string; email: string } | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('gf_session')?.value;
        if (!token) return null;
        const payload = verifySessionToken(token);
        if (!payload) return null;
        return { id: payload.id, email: payload.email };
    } catch {
        return null;
    }
}
