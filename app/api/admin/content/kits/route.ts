import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Kit from '@/lib/models/Kit';

/**
 * GET  /api/admin/content/kits     — list all kits
 * POST /api/admin/content/kits     — create kit
 * PUT  /api/admin/content/kits     — update kit (pass _id in body)
 * DELETE /api/admin/content/kits?id=xxx — delete kit + cascade
 */

export async function GET() {
    try {
        await connectToDatabase();
        const kits = await Kit.find().sort({ order: 1 }).lean();
        return NextResponse.json({ kits });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const kit = await Kit.create({
            name: body.name,
            slug,
            description: body.description || '',
            icon: body.icon || '📚',
            color: body.color || 'from-violet-500 to-purple-500',
            order: body.order ?? 0,
        });

        return NextResponse.json({ kit }, { status: 201 });
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

        const kit = await Kit.findByIdAndUpdate(_id, update, { new: true }).lean();
        return NextResponse.json({ kit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectToDatabase();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        // Import here to avoid circular issues
        const Chapter = (await import('@/lib/models/Chapter')).default;
        const Topic = (await import('@/lib/models/Topic')).default;

        await Topic.deleteMany({ kitId: id });
        await Chapter.deleteMany({ kitId: id });
        await Kit.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
