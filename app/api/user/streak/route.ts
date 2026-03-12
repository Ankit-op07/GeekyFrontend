import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { verifySessionToken } from '@/lib/session';

/**
 * GET /api/user/streak
 * Returns the user's current streak, longest streak, and last active date.
 */
export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = await CompanyKitUser.findById(session.id)
            .select('currentStreak longestStreak lastActiveDate')
            .lean() as any;

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Compute live streak (might have broken since last visit)
        const streak = computeCurrentStreak(user.lastActiveDate, user.currentStreak);

        return NextResponse.json({
            currentStreak: streak,
            longestStreak: user.longestStreak || 0,
            lastActiveDate: user.lastActiveDate || null,
        });
    } catch (error: any) {
        console.error('GET /api/user/streak error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/user/streak
 * Called when user performs a learning activity (views a topic, completes a question, etc).
 * Updates the streak counter.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        const user = await CompanyKitUser.findById(session.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const now = new Date();
        const todayStr = toDateStr(now);
        const lastStr = user.lastActiveDate ? toDateStr(new Date(user.lastActiveDate)) : null;

        // Already recorded today — no change
        if (lastStr === todayStr) {
            return NextResponse.json({
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                alreadyRecorded: true,
            });
        }

        // Calculate new streak
        const yesterdayStr = toDateStr(new Date(now.getTime() - 86400000));

        if (lastStr === yesterdayStr) {
            // Consecutive day — increment streak
            user.currentStreak = (user.currentStreak || 0) + 1;
        } else {
            // Streak broken (or first activity) — start new streak
            user.currentStreak = 1;
        }

        // Update longest streak
        if (user.currentStreak > (user.longestStreak || 0)) {
            user.longestStreak = user.currentStreak;
        }

        user.lastActiveDate = now;
        await user.save();

        return NextResponse.json({
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
        });
    } catch (error: any) {
        console.error('POST /api/user/streak error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── Helpers ──────────────────────────────────────────────

/** Convert Date to YYYY-MM-DD string using IST (UTC+5:30) */
function toDateStr(date: Date): string {
    // Use IST offset
    const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
}

/** Compute live streak accounting for time since last activity */
function computeCurrentStreak(lastActiveDate: Date | undefined, storedStreak: number): number {
    if (!lastActiveDate || !storedStreak) return 0;
    const now = new Date();
    const todayStr = toDateStr(now);
    const lastStr = toDateStr(new Date(lastActiveDate));
    const yesterdayStr = toDateStr(new Date(now.getTime() - 86400000));

    if (lastStr === todayStr || lastStr === yesterdayStr) {
        return storedStreak;
    }
    // Streak is broken
    return 0;
}

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
