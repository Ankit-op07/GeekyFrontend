/**
 * The key-free remote-job aggregators.
 *
 * All five are public, unauthenticated JSON endpoints. They overlap heavily —
 * the same Remotive posting shows up on Jobicy and Himalayas — which is fine
 * and expected: `fingerprintJob()` collapses them into one row, and having
 * three sources means one going down doesn't empty the board.
 *
 * Every adapter is defensive about shape. These are community APIs with no
 * contract; a renamed field must yield a skipped job, never a thrown ingest.
 */

import { fetchJson, parseDate } from '../fetch-json';
import type { RawJob } from '../types';

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asNumber = (value: unknown): number | undefined => {
    const n = typeof value === 'string' ? Number(value) : value;
    return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
};
const asStringArray = (value: unknown): string[] =>
    asArray(value).map((v) => asString(v)).filter(Boolean);

// ── RemoteOK ──────────────────────────────────────────────────────────────

/**
 * https://remoteok.com/api — a flat array whose FIRST element is a legal
 * notice object, not a job. Dropping it by index is what the API documents.
 * Salaries are USD annual.
 */
export async function fetchRemoteOk(): Promise<RawJob[]> {
    const rows = asArray(await fetchJson<unknown>('https://remoteok.com/api'));
    return rows
        .slice(1)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = asString(j.id) || String(j.id ?? '');
            const title = asString(j.position);
            const company = asString(j.company);
            const url = asString(j.apply_url) || asString(j.url);
            if (!id || !title || !company || !url) return null;
            return {
                externalId: id,
                title,
                company,
                applyUrl: url,
                companyLogo: asString(j.company_logo) || asString(j.logo) || undefined,
                location: asString(j.location) || 'Remote',
                isRemote: true, // the entire board is remote-only
                description: asString(j.description),
                tags: asStringArray(j.tags),
                salaryMin: asNumber(j.salary_min),
                salaryMax: asNumber(j.salary_max),
                salaryCurrency: 'USD',
                postedAt: parseDate(j.epoch) || parseDate(j.date),
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── Remotive ──────────────────────────────────────────────────────────────

/** https://remotive.com/api/remote-jobs — `{ jobs: [...] }`, salary is prose. */
export async function fetchRemotive(): Promise<RawJob[]> {
    const data = await fetchJson<{ jobs?: unknown }>(
        'https://remotive.com/api/remote-jobs?limit=200'
    );
    return asArray(data.jobs)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = String(j.id ?? '');
            const title = asString(j.title);
            const company = asString(j.company_name);
            const url = asString(j.url);
            if (!id || !title || !company || !url) return null;
            return {
                externalId: id,
                title,
                company,
                applyUrl: url,
                companyLogo: asString(j.company_logo) || undefined,
                location: asString(j.candidate_required_location) || 'Remote',
                isRemote: true,
                employmentType: asString(j.job_type),
                description: asString(j.description),
                tags: [...asStringArray(j.tags), asString(j.category)].filter(Boolean),
                salaryText: asString(j.salary) || undefined,
                postedAt: parseDate(j.publication_date),
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── Arbeitnow ─────────────────────────────────────────────────────────────

/**
 * https://www.arbeitnow.com/api/job-board-api — `{ data: [...] }`, paginated.
 * It is a general job board (heavily German), so most of what comes back is
 * filtered out later by `isEngineeringRole`. Two pages is the useful depth.
 */
export async function fetchArbeitnow(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    for (const page of [1, 2]) {
        const data = await fetchJson<{ data?: unknown }>(
            `https://www.arbeitnow.com/api/job-board-api?page=${page}`
        );
        for (const row of asArray(data.data)) {
            const j = row as Record<string, unknown>;
            const id = asString(j.slug);
            const title = asString(j.title);
            const company = asString(j.company_name);
            const url = asString(j.url);
            if (!id || !title || !company || !url) continue;
            jobs.push({
                externalId: id,
                title,
                company,
                applyUrl: url,
                location: asString(j.location),
                isRemote: j.remote === true,
                employmentType: asStringArray(j.job_types).join(' '),
                description: asString(j.description),
                tags: asStringArray(j.tags),
                postedAt: parseDate(j.created_at),
            });
        }
    }
    return jobs;
}

// ── Jobicy ────────────────────────────────────────────────────────────────

/**
 * https://jobicy.com/api/v2/remote-jobs — `{ jobs: [...] }`, remote-only.
 *
 * `geo=india` asks for roles open to Indian candidates rather than filtering a
 * global list down to nothing afterwards. It is the one aggregator here that
 * can target India at the source.
 */
export async function fetchJobicy(): Promise<RawJob[]> {
    const data = await fetchJson<{ jobs?: unknown }>(
        'https://jobicy.com/api/v2/remote-jobs?count=50&geo=india'
    );
    return asArray(data.jobs)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = String(j.id ?? j.jobSlug ?? '');
            const title = asString(j.jobTitle);
            const company = asString(j.companyName);
            const url = asString(j.url);
            if (!id || !title || !company || !url) return null;
            return {
                externalId: id,
                title,
                company,
                applyUrl: url,
                companyLogo: asString(j.companyLogo) || undefined,
                location: asString(j.jobGeo) || 'Remote',
                isRemote: true,
                employmentType: asStringArray(j.jobType).join(' '),
                description: asString(j.jobDescription) || asString(j.jobExcerpt),
                tags: [...asStringArray(j.jobIndustry), ...asStringArray(j.jobLevel)],
                salaryMin: asNumber(j.annualSalaryMin),
                salaryMax: asNumber(j.annualSalaryMax),
                salaryCurrency: asString(j.salaryCurrency) || undefined,
                postedAt: parseDate(j.pubDate),
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── Himalayas ─────────────────────────────────────────────────────────────

/** https://himalayas.app/jobs/api — `{ jobs: [...] }`, remote-only. */
export async function fetchHimalayas(): Promise<RawJob[]> {
    const data = await fetchJson<{ jobs?: unknown }>('https://himalayas.app/jobs/api?limit=100');
    return asArray(data.jobs)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = String(j.guid ?? j.id ?? '');
            const title = asString(j.title);
            const company = asString(j.companyName);
            const url = asString(j.applicationLink) || asString(j.url);
            if (!id || !title || !company || !url) return null;
            const restrictions = asStringArray(j.locationRestrictions);
            return {
                externalId: id,
                title,
                company,
                applyUrl: url,
                companyLogo: asString(j.companyLogo) || undefined,
                location: restrictions.length ? `Remote — ${restrictions.join(', ')}` : 'Remote',
                isRemote: true,
                employmentType: asString(j.employmentType),
                description: asString(j.description) || asString(j.excerpt),
                tags: [...asStringArray(j.categories), ...asStringArray(j.seniority)],
                salaryMin: asNumber(j.minSalary),
                salaryMax: asNumber(j.maxSalary),
                salaryCurrency: 'USD',
                postedAt: parseDate(j.pubDate),
            };
        })
        .filter((j): j is RawJob => j !== null);
}
