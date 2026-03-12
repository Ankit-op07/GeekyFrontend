import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Topic from '@/lib/models/Topic';

/**
 * GET    /api/admin/content/topics?chapterId=xxx
 * POST   /api/admin/content/topics
 * PUT    /api/admin/content/topics
 * DELETE /api/admin/content/topics?id=xxx
 */

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const chapterId = req.nextUrl.searchParams.get('chapterId');
        if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });

        const topics = await Topic.find({ chapterId }).sort({ order: 1 }).lean();
        return NextResponse.json({ topics });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const topic = await Topic.create({
            chapterId: body.chapterId,
            kitId: body.kitId,
            title: body.title,
            slug,
            content: body.content || '',
            order: body.order ?? 0,
        });

        return NextResponse.json({ topic }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { _id, ...update } = body;
        if (!_id) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });

        const topic = await Topic.findByIdAndUpdate(_id, update, { new: true }).lean();
        return NextResponse.json({ topic });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectToDatabase();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await Topic.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
