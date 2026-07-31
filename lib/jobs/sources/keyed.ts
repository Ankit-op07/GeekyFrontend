/**
 * Sources that need an API key.
 *
 * Both are optional and self-disabling: with no key in the environment the
 * adapter is simply not registered, and the board runs on the key-free sources
 * alone. They are worth wiring up because they are the only ones here that
 * cover the **Indian on-site market** — every free source above is remote-first
 * and Western-skewed, which is the wrong shape for most of this audience.
 *
 *   ADZUNA_APP_ID + ADZUNA_APP_KEY   free tier, https://developer.adzuna.com
 *   RAPIDAPI_KEY                     JSearch (LinkedIn/Indeed/Glassdoor
 *                                    aggregated), https://rapidapi.com/letscrape
 */

import { fetchJson, parseDate } from '../fetch-json';
import type { RawJob } from '../types';

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
const asNumber = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;

/**
 * What we ask the keyed sources for. They bill per call and return everything
 * under the sun otherwise, so the queries are narrow and match what this
 * platform actually teaches.
 */
export const KEYED_QUERIES = [
    'frontend developer',
    'react developer',
    'javascript developer',
    'node js developer',
    'full stack developer',
];

export function hasAdzunaKeys(): boolean {
    return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

export function hasJSearchKey(): boolean {
    return Boolean(process.env.RAPIDAPI_KEY);
}

// ── Adzuna ────────────────────────────────────────────────────────────────

/**
 * One call per (country, query). `in` is the point of this source; `gb`/`us`
 * ride along cheaply for the remote-curious. Adzuna's free tier is ~250
 * calls/day, and this is 10 per refresh.
 */
export async function fetchAdzuna(country: string, what: string): Promise<RawJob[]> {
    const params = new URLSearchParams({
        app_id: process.env.ADZUNA_APP_ID || '',
        app_key: process.env.ADZUNA_APP_KEY || '',
        results_per_page: '50',
        what,
        max_days_old: '30',
        'content-type': 'application/json',
    });
    const data = await fetchJson<{ results?: unknown }>(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`
    );
    return asArray(data.results)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = String(j.id ?? '');
            const title = asString(j.title);
            const url = asString(j.redirect_url);
            const company = asString((j.company as Record<string, unknown>)?.display_name);
            if (!id || !title || !url || !company) return null;
            return {
                externalId: id,
                title,
                company,
                applyUrl: url,
                location: asString((j.location as Record<string, unknown>)?.display_name),
                employmentType: `${asString(j.contract_time)} ${asString(j.contract_type)}`,
                description: asString(j.description),
                salaryMin: asNumber(j.salary_min),
                salaryMax: asNumber(j.salary_max),
                // Adzuna reports salary in the country's own currency.
                salaryCurrency: country === 'in' ? 'INR' : country === 'gb' ? 'GBP' : 'USD',
                postedAt: parseDate(j.created),
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── JSearch (RapidAPI) ────────────────────────────────────────────────────

export async function fetchJSearch(query: string, country: string): Promise<RawJob[]> {
    const params = new URLSearchParams({
        query,
        page: '1',
        num_pages: '1',
        country,
        date_posted: 'month',
    });
    const data = await fetchJson<{ data?: unknown }>(
        `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
        {
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
            },
        }
    );
    return asArray(data.data)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = asString(j.job_id);
            const title = asString(j.job_title);
            const company = asString(j.employer_name);
            const url = asString(j.job_apply_link);
            if (!id || !title || !company || !url) return null;
            const city = asString(j.job_city);
            const region = asString(j.job_state);
            const nation = asString(j.job_country);
            return {
                externalId: id,
                title,
                company,
                applyUrl: url,
                companyLogo: asString(j.employer_logo) || undefined,
                location: [city, region, nation].filter(Boolean).join(', '),
                isRemote: typeof j.job_is_remote === 'boolean' ? j.job_is_remote : undefined,
                employmentType: asString(j.job_employment_type),
                description: asString(j.job_description),
                salaryMin: asNumber(j.job_min_salary),
                salaryMax: asNumber(j.job_max_salary),
                salaryCurrency: asString(j.job_salary_currency) || undefined,
                postedAt: parseDate(j.job_posted_at_timestamp) || parseDate(j.job_posted_at_datetime_utc),
            };
        })
        .filter((j): j is RawJob => j !== null);
}
