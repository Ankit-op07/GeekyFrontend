import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Company from '@/lib/models/Company';
import Question from '@/lib/models/Question';

/**
 * GET /api/companies/[id]
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const company = await Company.findById(id).lean();
        if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ company });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/companies/[id]
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const company = await Company.findByIdAndUpdate(id, body, { new: true });
        if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ company });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/companies/[id]
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await Question.deleteMany({ companyId: id }); // cascade
        await Company.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
