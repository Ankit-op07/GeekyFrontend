import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Question from '@/lib/models/Question';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * PUT /api/questions/[id]
 * Update a question (admin)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const question = await Question.findByIdAndUpdate(id, body, { new: true });
        if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ question });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/questions/[id]
 * Delete a question (admin)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const forbidden = requireAdmin(req);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const { id } = await params;
        await Question.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
