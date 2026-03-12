import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Chapter from '@/lib/models/Chapter';
import Topic from '@/lib/models/Topic';

/**
 * GET    /api/admin/content/chapters?kitId=xxx
 * POST   /api/admin/content/chapters
 * PUT    /api/admin/content/chapters
 * DELETE /api/admin/content/chapters?id=xxx
 */

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const kitId = req.nextUrl.searchParams.get('kitId');
        if (!kitId) return NextResponse.json({ error: 'Missing kitId' }, { status: 400 });

        const chapters = await Chapter.find({ kitId }).sort({ order: 1 }).lean();
        return NextResponse.json({ chapters });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const chapter = await Chapter.create({
            kitId: body.kitId,
            title: body.title,
            slug,
            order: body.order ?? 0,
        });

        return NextResponse.json({ chapter }, { status: 201 });
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

        const chapter = await Chapter.findByIdAndUpdate(_id, update, { new: true }).lean();
        return NextResponse.json({ chapter });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectToDatabase();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await Topic.deleteMany({ chapterId: id });
        await Chapter.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
