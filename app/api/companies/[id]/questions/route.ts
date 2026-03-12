import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Question from '@/lib/models/Question';
import Company from '@/lib/models/Company';

/**
 * GET /api/companies/[id]/questions
 * List questions for a company with optional filters
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        // Verify company exists
        const company = await Company.findById(id).lean();
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        // Build filter
        const url = new URL(req.url);
        const difficulty = url.searchParams.get('difficulty');
        const platform = url.searchParams.get('platform');
        const topic = url.searchParams.get('topic');
        const popularity = url.searchParams.get('popularity');
        const search = url.searchParams.get('search');

        const filter: any = { companyId: id };
        if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
        if (platform && platform !== 'All') filter.platform = platform;
        if (popularity && popularity !== 'All') filter.popularity = popularity;
        if (topic && topic !== 'All') filter.tags = topic;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const questions = await Question.find(filter).sort({ frequency: -1 }).lean();

        return NextResponse.json({ questions, company });
    } catch (error: any) {
        console.error('GET /api/companies/[id]/questions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/companies/[id]/questions
 * Add a question to a company (admin)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        // Verify company
        const company = await Company.findById(id);
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        const body = await req.json();
        const { title, difficulty, platform, popularity, tags, frequency } = body;

        if (!title || !difficulty) {
            return NextResponse.json({ error: 'Title and difficulty required' }, { status: 400 });
        }

        const question = await Question.create({
            companyId: id,
            title,
            difficulty,
            platform: platform || 'leetcode',
            popularity: popularity || 'Hot',
            tags: tags || [],
            frequency: frequency || 50,
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/companies/[id]/questions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
