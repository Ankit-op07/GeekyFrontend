/**
 * Hacker News "Ask HN: Who is hiring?" — the startup channel.
 *
 * Every month the `whoishiring` bot posts one thread and each top-level comment
 * is one opening, overwhelmingly at startups that never touch a job board. It
 * is the single best free source for "startup jobs", and the only one here that
 * is prose rather than structured data.
 *
 * There is no schema, only a strong community convention for the first line:
 *
 *     Company | Job Title | Location | REMOTE | Full-time | https://apply.here
 *
 * We parse that and DROP anything we can't confidently read. A garbled row on a
 * job board is worse than a missing one — the user clicks through to nothing —
 * so every ambiguous case here fails closed.
 */

import { fetchJson, parseDate } from '../fetch-json';
import { isEngineeringRole, stripHtml } from '../normalize';
import type { RawJob } from '../types';

interface AlgoliaHit {
    objectID?: string;
    title?: string;
    comment_text?: string;
    author?: string;
    parent_id?: number;
    created_at_i?: number;
}

const ALGOLIA = 'https://hn.algolia.com/api/v1';

/**
 * Segments that describe the arrangement, not the role or the place.
 * The leading digit/currency case is the pay band — "175,000 - 220,000" sits
 * where a location would and otherwise gets read as one.
 */
const META_SEGMENT =
    /^([\d$₹€£]|remote|onsite|on[ -]site|hybrid|full[ -]?time|part[ -]?time|contract|intern(ship)?|visa|no visa|h1b|equity|competitive|salary|comp\b|apply)/i;

const URL_IN_TEXT = /https?:\/\/[^\s<>"')]+/i;

/**
 * The most recent Who-is-hiring threads. Two months, because the current
 * month's thread is nearly empty on the 1st and the previous one is still the
 * live source of applications; older than that and the listings are stale.
 */
async function findHiringThreads(limit = 2): Promise<{ id: string; postedAt?: Date }[]> {
    const data = await fetchJson<{ hits?: AlgoliaHit[] }>(
        `${ALGOLIA}/search_by_date?tags=story,author_whoishiring&hitsPerPage=10`
    );
    return (data.hits || [])
        // The bot also posts "Who wants to be hired?" and "Freelancer?" threads.
        .filter((hit) => /who is hiring/i.test(hit.title || ''))
        .slice(0, limit)
        .map((hit) => ({ id: String(hit.objectID), postedAt: parseDate(hit.created_at_i) }))
        .filter((t) => t.id && t.id !== 'undefined');
}

/**
 * Reads one comment into a job, or null.
 *
 * `threadDate` is the fallback posting date: Algolia gives each comment its own
 * timestamp, which is what we want, but the thread date keeps a comment with a
 * missing timestamp inside the right month rather than dated "today".
 */
function parseHiringComment(hit: AlgoliaHit, threadDate?: Date): RawJob | null {
    const id = String(hit.objectID || '');
    const text = stripHtml(hit.comment_text || '');
    if (!id || !text) return null;

    const firstLine = text.split('\n')[0].trim();
    const segments = firstLine
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);

    // Without the pipe convention there is no reliable company/title split.
    if (segments.length < 2) return null;

    const company = segments[0].replace(/\s*\(.*?\)\s*$/, '').trim();
    if (!company || company.length > 60) return null;

    const rest = segments.slice(1);
    const title = rest.find((s) => s.length <= 80 && isEngineeringRole(s));
    if (!title) return null;

    const isRemote = /\bremote\b/i.test(firstLine) && !/\bno remote\b/i.test(firstLine);
    const location = rest.find(
        (s) => s !== title && !META_SEGMENT.test(s) && !URL_IN_TEXT.test(s) && s.length <= 60
    );

    /**
     * The apply link comes from the FIRST LINE only, where the convention puts
     * it. Scanning the whole comment for a URL looks more thorough and is
     * actively wrong: job posts embed links to the company blog, to a
     * recruiter's referral page, to the founders' Twitter. Probing this parser
     * against a live thread produced two unrelated companies whose "apply"
     * link was the same third-party referral URL lifted out of the body.
     *
     * With no link on the first line we send the user to the HN comment itself,
     * which always exists, always shows the real post, and is honest about
     * where the listing came from.
     */
    const linkMatch = firstLine.match(URL_IN_TEXT);
    const applyUrl = linkMatch ? linkMatch[0] : `https://news.ycombinator.com/item?id=${id}`;

    return {
        externalId: id,
        title,
        company,
        applyUrl,
        location: location || (isRemote ? 'Remote' : ''),
        isRemote,
        employmentType: firstLine,
        description: text,
        postedAt: parseDate(hit.created_at_i) || threadDate,
        // Definitionally: this thread is where startups hire.
        isStartup: true,
    };
}

export async function fetchHnHiring(): Promise<RawJob[]> {
    const threads = await findHiringThreads();
    const jobs: RawJob[] = [];

    for (const thread of threads) {
        const data = await fetchJson<{ hits?: AlgoliaHit[] }>(
            `${ALGOLIA}/search?tags=comment,story_${thread.id}&hitsPerPage=300`
        );
        for (const hit of data.hits || []) {
            // Replies to a job post are discussion, not jobs. Only comments
            // whose parent is the thread itself are openings.
            if (String(hit.parent_id ?? '') !== thread.id) continue;
            const job = parseHiringComment(hit, thread.postedAt);
            if (job) jobs.push(job);
        }
    }

    return jobs;
}
