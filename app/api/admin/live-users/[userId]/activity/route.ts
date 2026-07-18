import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import UserActivity from '@/lib/models/UserActivity';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/live-users/[userId]/activity
 * Admin-only. Returns a user's recent behaviour timeline (newest first) for the
 * drawer in the Live Users view.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    const { userId } = await params;
    if (!mongoose.isValidObjectId(userId)) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    await connectToDatabase();

    const activity = await UserActivity.find({ userId })
        .select('event path meta createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    return NextResponse.json({ activity });
}
