import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Company from '@/lib/models/Company';
import Question from '@/lib/models/Question';

/**
 * GET /api/companies
 * List all companies with aggregated question stats
 */
export async function GET() {
    try {
        await connectToDatabase();

        const companies = await Company.find().sort({ name: 1 }).lean();

        // Aggregate question stats per company
        const stats = await Question.aggregate([
            {
                $group: {
                    _id: '$companyId',
                    totalQuestions: { $sum: 1 },
                    easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } },
                    medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
                    hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } },
                    // Top patterns (tags)
                    tags: { $push: '$tags' },
                },
            },
        ]);

        const statsMap = new Map(stats.map(s => [s._id.toString(), s]));

        const result = companies.map(c => {
            const s = statsMap.get((c as any)._id.toString());
            // Flatten tags and count occurrences for patterns
            const tagCounts: Record<string, number> = {};
            if (s?.tags) {
                s.tags.flat().forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
            }
            const patterns = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, count]) => ({ name, count }));

            return {
                _id: (c as any)._id,
                name: c.name,
                slug: c.slug,
                logo: c.logo,
                color: c.color,
                totalQuestions: s?.totalQuestions || 0,
                difficulty: {
                    easy: s?.easy || 0,
                    medium: s?.medium || 0,
                    hard: s?.hard || 0,
                },
                patterns,
            };
        });

        return NextResponse.json({ companies: result });
    } catch (error: any) {
        console.error('GET /api/companies error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/companies
 * Create a new company (admin)
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { name, logo, color } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const existing = await Company.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'Company already exists' }, { status: 409 });
        }

        const company = await Company.create({
            name,
            slug,
            logo: logo || '🏢',
            color: color || 'from-violet-500 to-purple-500',
        });

        return NextResponse.json({ company }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/companies error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
