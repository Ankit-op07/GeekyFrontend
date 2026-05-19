import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import InterviewRequest from '@/lib/models/InterviewRequest';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';

const ALLOWED_DURATIONS = new Set([30, 45, 60]);

export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const interviews = await InterviewRequest.find({ userId: session.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ interviews });
    } catch (error: any) {
        console.error('GET /api/interviews error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const preferredTime = new Date(body.preferredTime);
        const durationMinutes = Number(body.durationMinutes);

        if (Number.isNaN(preferredTime.getTime())) {
            return NextResponse.json({ error: 'Please select a valid interview time.' }, { status: 400 });
        }

        if (preferredTime.getTime() < Date.now() + 30 * 60 * 1000) {
            return NextResponse.json({ error: 'Please choose a time at least 30 minutes from now.' }, { status: 400 });
        }

        if (!ALLOWED_DURATIONS.has(durationMinutes)) {
            return NextResponse.json({ error: 'Duration must be 30, 45, or 60 minutes.' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await CompanyKitUser.findById(session.id)
            .select('name email')
            .lean() as any;

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const openRequest = await InterviewRequest.findOne({
            userId: session.id,
            status: { $in: ['pending', 'approved'] },
        }).lean();

        if (openRequest) {
            return NextResponse.json({
                error: 'You already have an active interview request. Please wait for the team to respond or complete it first.',
            }, { status: 409 });
        }

        const interview = await InterviewRequest.create({
            userId: session.id,
            studentName: user.name || session.name,
            studentEmail: user.email || session.email,
            kit: body.kit || 'React',
            interviewType: body.interviewType || 'React Interview',
            preferredTime,
            durationMinutes,
            status: 'pending',
            adminNotes: body.note || '',
        });

        return NextResponse.json({ interview }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/interviews error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
