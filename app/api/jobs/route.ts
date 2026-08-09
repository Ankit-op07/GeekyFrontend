import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Job from '@/lib/models/Job';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { extractSessionFromRequest } from '@/lib/session';
import { buildJobFilter, buildJobSort, parseJobQuery } from '@/lib/jobs/query';
import { resolveFeatureAccess } from '@/lib/feature-access';

/**
 * GET /api/jobs — the board.
 *
 * Reads the local `Job` cache only; it never calls an upstream feed. Ingest is
 * a separate, scheduled concern (POST /api/jobs/refresh) because fanning out to
 * two dozen third-party APIs inside a page load would put the board's latency
 * and uptime at the mercy of the slowest one.
 *
 * MEMBERSHIP-GATED, and the gate is HERE rather than only on the tab. Hiding a
 * tab hides a link, not an endpoint — /api/jobs would still answer in full to
 * anyone who typed the URL, which is precisely how a paid feature leaks. The
 * listings are also the fruit of our aggregation across ~55 upstreams, so an
 * ungated endpoint is a free scraping target for the whole board.
 */
export async function GET(request: NextRequest) {
    try {
        const session = extractSessionFromRequest(request);
        const access = await resolveFeatureAccess(session?.id ?? null, 'jobs');
        if (!access.allowed) {
            return NextResponse.json(
                {
                    error:
                        access.reason === 'needs-auth'
                            ? 'Not authenticated'
                            : 'A membership is required to use the job board.',
                    // Lets the client route to sign-in vs the membership page
                    // instead of showing one generic failure for both.
                    reason: access.reason,
                    membership: {
                        active: access.membership.active,
                        expiresAt: access.membership.expiresAt,
                    },
                },
                { status: access.reason === 'needs-auth' ? 401 : 403 }
            );
        }

        await connectToDatabase();

        const query = parseJobQuery(request.nextUrl.searchParams);
        const filter = buildJobFilter(query);

        const [jobs, total, categoryFacet, cityFacet, companies, savedRows, newest] = await Promise.all([
            Job.find(filter)
                .sort(buildJobSort(query.sort))
                .skip((query.page - 1) * query.limit)
                .limit(query.limit)
                .lean(),
            Job.countDocuments(filter),
            // Counted with the category filter dropped — see buildJobFilter.
            Job.aggregate<{ _id: string; count: number }>([
                { $match: buildJobFilter(query, 'category') },
                { $group: { _id: '$category', count: { $sum: 1 } } },
            ]),
            // Same, for the city chips.
            Job.aggregate<{ _id: string; count: number }>([
                { $match: buildJobFilter(query, 'city') },
                { $group: { _id: '$city', count: { $sum: 1 } } },
            ]),
            // "N companies hiring" in the header. Folded into this batch rather
            // than awaited inline below — it is an independent query and there
            // is no reason to pay for it serially.
            Job.distinct('company', filter),
            // Non-null: access.allowed is only true for a resolved session.
            CompanyKitUser.findById(session!.id).select('savedJobs').lean() as Promise<{
                savedJobs?: { jobId: string; status?: string }[];
            } | null>,
            // Drives the "updated N hours ago" line and the client's decision to
            // ask for a refresh when the board has gone cold.
            Job.findOne().sort({ lastSeenAt: -1 }).select('lastSeenAt').lean() as Promise<{
                lastSeenAt?: Date;
            } | null>,
        ]);

        // The board shows the tracker stage on each card, so a job you already
        // applied to is obvious while browsing rather than only in the tracker.
        const savedStatus = new Map(
            (savedRows?.savedJobs || []).map((s) => [s.jobId, s.status || 'saved'])
        );

        return NextResponse.json({
            jobs: jobs.map((job: any) => ({
                id: String(job._id),
                title: job.title,
                company: job.company,
                companyLogo: job.companyLogo || null,
                applyUrl: job.applyUrl,
                location: job.location,
                isRemote: !!job.isRemote,
                countryCode: job.countryCode || null,
                city: job.city || null,
                employmentType: job.employmentType,
                category: job.category,
                level: job.level,
                tags: job.tags || [],
                isStartup: !!job.isStartup,
                description: job.description || '',
                salaryMin: job.salaryMin ?? null,
                salaryMax: job.salaryMax ?? null,
                salaryCurrency: job.salaryCurrency || null,
                salaryText: job.salaryText || null,
                // `sources` is deliberately NOT returned. Which upstream a
                // listing came from is our plumbing, not something a candidate
                // needs — and shipping it invites the UI to display it.
                postedAt: job.postedAt,
                saved: savedStatus.has(String(job._id)),
                trackStatus: savedStatus.get(String(job._id)) || null,
            })),
            total,
            page: query.page,
            limit: query.limit,
            hasMore: query.page * query.limit < total,
            categoryCounts: Object.fromEntries(categoryFacet.map((row) => [row._id, row.count])),
            cityCounts: Object.fromEntries(
                cityFacet.filter((row) => row._id).map((row) => [row._id, row.count])
            ),
            companyCount: companies.length,
            lastUpdatedAt: newest?.lastSeenAt || null,
        });
    } catch (error: any) {
        console.error('Job board list error:', error.message);
        return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
    }
}
