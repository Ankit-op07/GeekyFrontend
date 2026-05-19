import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import InterviewRequest from '@/lib/models/InterviewRequest';
import { extractSessionFromRequest } from '@/lib/session';

const ADMIN_EMAIL = 'geekyfrontend@gmail.com';
const VALID_STATUSES = new Set(['pending', 'approved', 'rejected', 'completed', 'cancelled']);

function isAdmin(request: NextRequest) {
    const session = extractSessionFromRequest(request);
    return session?.email?.toLowerCase() === ADMIN_EMAIL ? session : null;
}

export async function GET(request: NextRequest) {
    try {
        if (!isAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const query: Record<string, any> = {};

        if (status && status !== 'all') query.status = status;

        const interviews = await InterviewRequest.find(query)
            .sort({ preferredTime: 1, createdAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({ interviews });
    } catch (error: any) {
        console.error('GET /api/admin/interviews error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!isAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, status } = body;

        if (!id) return NextResponse.json({ error: 'Interview id is required' }, { status: 400 });
        if (status && !VALID_STATUSES.has(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectToDatabase();

        const update: Record<string, any> = {};
        if (status) {
            update.status = status;
            update.decidedAt = new Date();
            if (status === 'completed') update.completedAt = new Date();
        }
        if (body.meetingLink !== undefined) update.meetingLink = body.meetingLink;
        if (body.adminNotes !== undefined) update.adminNotes = body.adminNotes;
        if (body.preferredTime) {
            const preferredTime = new Date(body.preferredTime);
            if (Number.isNaN(preferredTime.getTime())) {
                return NextResponse.json({ error: 'Invalid preferred time' }, { status: 400 });
            }
            update.preferredTime = preferredTime;
        }
        if (body.durationMinutes) {
            const durationMinutes = Number(body.durationMinutes);
            if (![30, 45, 60].includes(durationMinutes)) {
                return NextResponse.json({ error: 'Duration must be 30, 45, or 60 minutes' }, { status: 400 });
            }
            update.durationMinutes = durationMinutes;
        }
        if (body.report) {
            update.report = {
                rating: body.report.rating ? Number(body.report.rating) : undefined,
                summary: body.report.summary || '',
                strengths: body.report.strengths || '',
                improvements: body.report.improvements || '',
                nextSteps: body.report.nextSteps || '',
                resources: body.report.resources || '',
                submittedAt: new Date(),
            };
            update.status = 'completed';
            update.completedAt = new Date();
        }

        const interview = await InterviewRequest.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!interview) return NextResponse.json({ error: 'Interview request not found' }, { status: 404 });

        return NextResponse.json({ interview });
    } catch (error: any) {
        console.error('PATCH /api/admin/interviews error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
