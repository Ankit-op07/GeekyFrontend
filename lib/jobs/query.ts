/**
 * Turning the job board's query string into a Mongo filter.
 *
 * Split out of the route so the filter is built once and shared by the list and
 * its facet counts — if those two drifted, the chip would say "Frontend (42)"
 * and the list would show 39.
 */

import { escapeRegex } from '@/lib/escape-regex';
import { ALL_TAGS, INDIAN_CITIES } from './normalize';

/** Sort keys the client may ask for. Anything else falls back to newest. */
export type JobSort = 'recent' | 'relevant';

export const JOB_CATEGORIES = [
    'frontend',
    'backend',
    'fullstack',
    'mobile',
    'data',
    'devops',
    'qa',
    'software',
    'other',
] as const;

export const JOB_LEVELS = ['internship', 'junior', 'mid', 'senior', 'lead'] as const;

/**
 * The board is India-only (see the India gate in lib/jobs/ingest.ts), so a
 * country filter would have exactly one option. City replaces it — 'Remote'
 * included, because on an Indian board "where do I sit" is the same question.
 */
export const JOB_CITIES = [...INDIAN_CITIES, 'Remote'] as const;

export interface JobQuery {
    q: string;
    category: string;
    level: string;
    tag: string;
    city: string;
    remote: boolean;
    startup: boolean;
    sort: JobSort;
    page: number;
    limit: number;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
/** Longer than any real search, and short enough that the regex stays cheap. */
const MAX_QUERY_LENGTH = 80;

export function parseJobQuery(params: URLSearchParams): JobQuery {
    const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): string =>
        value && (allowed as readonly string[]).includes(value) ? value : '';

    const page = Math.max(1, Number(params.get('page')) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.get('limit')) || DEFAULT_LIMIT));

    return {
        q: (params.get('q') || '').trim().slice(0, MAX_QUERY_LENGTH),
        category: oneOf(params.get('category'), JOB_CATEGORIES),
        level: oneOf(params.get('level'), JOB_LEVELS),
        tag: oneOf(params.get('tag'), ALL_TAGS),
        city: oneOf(params.get('city'), JOB_CITIES),
        remote: params.get('remote') === '1',
        startup: params.get('startup') === '1',
        sort: params.get('sort') === 'relevant' ? 'relevant' : 'recent',
        page,
        limit,
    };
}

/**
 * Builds the Mongo filter.
 *
 * `omit` lets the facet pass drop the dimension it is counting — a category
 * facet computed with the category filter still applied would report the
 * selected category and zeroes for everything else, so the user could never
 * switch away from it.
 */
export function buildJobFilter(
    query: JobQuery,
    omit?: 'category' | 'level' | 'city'
): Record<string, unknown> {
    /**
     * THE BOARD IS INDIA-ONLY, AND THIS IS THE LINE THAT GUARANTEES IT.
     *
     * The ingest gate (`isIndianJob`) stops non-Indian jobs being WRITTEN. It
     * does nothing about rows already in the collection — and when the board
     * was converted to India-only, thousands of previously-ingested US and EU
     * rows were still sitting there, perfectly visible, until their 21-day TTL
     * ran out. The board looked broken because it was.
     *
     * A gate on the write path alone is not enough when the store outlives the
     * rule. This filter makes the query itself incapable of returning a
     * non-Indian job, whatever is in the collection.
     */
    const filter: Record<string, unknown> = { countryCode: 'IN' };

    if (query.q) {
        // Free text hits the fields a job seeker actually types into: role,
        // employer, and the skill chips. NOT the description — a substring
        // regex over 4KB bodies with no index is the one query here that could
        // hurt, and it mostly returns noise ("react" appears in every JD).
        const rx = new RegExp(escapeRegex(query.q), 'i');
        filter.$or = [{ title: rx }, { company: rx }, { tags: rx }];
    }
    if (query.category && omit !== 'category') filter.category = query.category;
    if (query.level && omit !== 'level') filter.level = query.level;
    if (query.tag) filter.tags = query.tag;
    if (query.city && omit !== 'city') filter.city = query.city;
    if (query.remote) filter.isRemote = true;
    if (query.startup) filter.isStartup = true;

    return filter;
}

/**
 * Sort spec.
 *
 * "relevant" is not a text score — it is *corroboration*: a job carried by
 * several feeds, or posted straight to a company ATS, is likelier to be real
 * and open than a lone aggregator row. Ties break on recency.
 */
export function buildJobSort(sort: JobSort): Record<string, 1 | -1> {
    if (sort === 'relevant') return { sourceCount: -1, postedAt: -1 };
    return { postedAt: -1 };
}
