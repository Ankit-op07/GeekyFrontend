import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Company from '@/lib/models/Company';
import Question from '@/lib/models/Question';
import { COMPANIES } from '@/lib/data/company-questions';

/**
 * POST /api/admin/seed-questions
 * One-time seed: populate MongoDB from the static data file.
 * Skips companies that already exist (idempotent).
 */
export async function POST() {
    try {
        await connectToDatabase();

        let companiesCreated = 0;
        let questionsCreated = 0;
        let skipped = 0;

        for (const c of COMPANIES) {
            // Check if company already exists
            const slug = c.id; // static data 'id' maps to our slug
            let company = await Company.findOne({ slug });

            if (company) {
                skipped++;
                continue;
            }

            // Create company
            company = await Company.create({
                name: c.name,
                slug,
                logo: c.logo,
                color: c.color,
            });
            companiesCreated++;

            // Create questions
            const qDocs = c.questions.map(q => ({
                companyId: company!._id,
                title: q.title,
                difficulty: q.difficulty,
                platform: q.platform,
                popularity: q.popularity,
                tags: q.tags,
                frequency: q.frequency,
            }));

            if (qDocs.length > 0) {
                await Question.insertMany(qDocs);
                questionsCreated += qDocs.length;
            }
        }

        return NextResponse.json({
            success: true,
            companiesCreated,
            questionsCreated,
            skipped,
            message: `Seeded ${companiesCreated} companies, ${questionsCreated} questions. ${skipped} existing companies skipped.`,
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
