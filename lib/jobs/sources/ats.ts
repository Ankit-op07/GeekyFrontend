/**
 * Company career boards, straight from the ATS.
 *
 * Greenhouse, Lever, Ashby and SmartRecruiters all expose the hosted job board
 * as public JSON — no key, no scraping. These are the freshest possible
 * listings (the aggregators are downstream of exactly this) and, for startups,
 * usually the ONLY listing.
 *
 * This is also the answer to "where do Indian jobs come from". Naukri,
 * Instahyre, Cutshort, Wellfound and LinkedIn have no free public API and
 * scraping them breaks their terms — but the Indian employers *behind* those
 * listings post to an ATS, and the ATS is open. Going to the source gets the
 * same roles, fresher, legally, with no key.
 *
 * ── On the board list below ───────────────────────────────────────────────
 * A board is identified by the company's ATS slug, and there is no directory to
 * look them up in — you read it off the company's careers URL. The seed list is
 * therefore BEST-EFFORT: a slug that has changed or was never right returns 404
 * and contributes nothing. That failure is deliberately visible — POST
 * /api/jobs/refresh reports every board's status, so a dead entry shows up as
 * `ok: false` and can be pruned. Add boards without a deploy via the
 * JOB_ATS_BOARDS env var (`greenhouse:acme,lever:beta,ashby:gamma`).
 */

import { fetchJson, parseDate } from '../fetch-json';
import { stripHtml } from '../normalize';
import type { JobSource, RawJob } from '../types';

export interface AtsBoard {
    ats: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';
    /** The company's slug on that ATS. */
    token: string;
    /** Display name, and the company name we store when the feed omits one. */
    name: string;
    /**
     * Whether the "Startups" filter should surface this company.
     *
     * NOT "is this an ATS board" — the first version of this file set the
     * startup flag on every ATS row, which made 94% of the board a "startup"
     * and the filter meaningless. It is a per-company judgement, and the line
     * drawn is: still private and small enough that joining is an early-stage
     * bet. Airbnb, Reddit, Coinbase, Spotify, Instacart and DoorDash are public
     * companies; Databricks, OpenAI, Stripe and Anthropic are private but far
     * past the stage anyone means by "startup job".
     */
    startup?: boolean;
}

/**
 * Companies that hire the audience this platform trains (JS/React/Node, India
 * + remote). `startup: true` marks the ones the "Startups" filter surfaces —
 * see the field's doc comment for where that line is drawn.
 *
 * ⚠️ Every slug here was verified by FETCHING THE BOARD AND COUNTING ITS INDIAN
 * POSTINGS — not by checking that the URL returns 200. That distinction cost
 * real entries: `greenhouse:slice` answers fine and is a US/Macedonia company,
 * not the Indian fintech; `ashby:navi` is a San Francisco company; `ashby:bounce`
 * is Portuguese. All three were in an earlier draft of this list purely because
 * they responded. A slug that resolves is not the company you meant.
 *
 * Slugs also rot — `doordash` and `netflix` were here and both 404 now. Re-check
 * from the refresh health report rather than trusting this list.
 */
const SEED_BOARDS: AtsBoard[] = [
    /* ── Indian employers ────────────────────────────────────────────────── */
    { ats: 'lever', token: 'paytm', name: 'Paytm' },
    { ats: 'lever', token: 'meesho', name: 'Meesho', startup: true },
    { ats: 'lever', token: 'zeta', name: 'Zeta', startup: true },
    { ats: 'lever', token: 'cred', name: 'CRED', startup: true },
    { ats: 'lever', token: 'epifi', name: 'Fi Money', startup: true },
    { ats: 'lever', token: 'fampay', name: 'FamPay', startup: true },
    { ats: 'lever', token: 'mindtickle', name: 'Mindtickle', startup: true },
    { ats: 'lever', token: 'hevodata', name: 'Hevo Data', startup: true },
    { ats: 'greenhouse', token: 'phonepe', name: 'PhonePe' },
    { ats: 'greenhouse', token: 'groww', name: 'Groww', startup: true },
    { ats: 'greenhouse', token: 'tekion', name: 'Tekion', startup: true },
    { ats: 'greenhouse', token: 'hackerrank', name: 'HackerRank', startup: true },
    { ats: 'greenhouse', token: 'postman', name: 'Postman', startup: true },
    { ats: 'greenhouse', token: 'turing', name: 'Turing', startup: true },
    { ats: 'greenhouse', token: 'observeai', name: 'Observe.AI', startup: true },
    { ats: 'greenhouse', token: 'sigmoid', name: 'Sigmoid', startup: true },
    { ats: 'greenhouse', token: 'glance', name: 'Glance', startup: true },
    { ats: 'greenhouse', token: 'inmobi', name: 'InMobi' },
    { ats: 'ashby', token: 'atlan', name: 'Atlan', startup: true },
    { ats: 'ashby', token: 'spotdraft', name: 'SpotDraft', startup: true },
    { ats: 'smartrecruiters', token: 'freshworks', name: 'Freshworks' },
    { ats: 'smartrecruiters', token: 'swiggy', name: 'Swiggy' },
    { ats: 'smartrecruiters', token: 'unacademy', name: 'Unacademy', startup: true },
    { ats: 'smartrecruiters', token: 'ixigo', name: 'ixigo' },
    { ats: 'smartrecruiters', token: 'cars24', name: 'CARS24', startup: true },
    { ats: 'smartrecruiters', token: 'whatfix', name: 'Whatfix', startup: true },
    { ats: 'smartrecruiters', token: 'kredx', name: 'KredX', startup: true },
    { ats: 'smartrecruiters', token: 'refyne', name: 'Refyne', startup: true },
    { ats: 'smartrecruiters', token: 'nobroker', name: 'NoBroker', startup: true },
    { ats: 'smartrecruiters', token: 'lendingkart', name: 'Lendingkart', startup: true },

    /* ── Global employers, kept for their Indian engineering centres ──────
     * Every one of these was measured carrying live Bengaluru / Hyderabad /
     * Pune / Chennai openings. Their non-India roles never reach the board —
     * the India gate in ingest.ts drops those. */
    { ats: 'greenhouse', token: 'databricks', name: 'Databricks' },
    { ats: 'greenhouse', token: 'zscaler', name: 'Zscaler' },
    { ats: 'greenhouse', token: 'mongodb', name: 'MongoDB' },
    { ats: 'greenhouse', token: 'gitlab', name: 'GitLab' },
    { ats: 'greenhouse', token: 'twilio', name: 'Twilio' },
    { ats: 'greenhouse', token: 'rubrik', name: 'Rubrik' },
    { ats: 'greenhouse', token: 'stripe', name: 'Stripe' },
    { ats: 'greenhouse', token: 'coinbase', name: 'Coinbase' },
    { ats: 'greenhouse', token: 'cloudflare', name: 'Cloudflare' },
    { ats: 'greenhouse', token: 'datadog', name: 'Datadog' },
    { ats: 'greenhouse', token: 'elastic', name: 'Elastic' },
    { ats: 'greenhouse', token: 'fastly', name: 'Fastly' },
    { ats: 'greenhouse', token: 'launchdarkly', name: 'LaunchDarkly', startup: true },
    { ats: 'greenhouse', token: 'airbnb', name: 'Airbnb' },
    { ats: 'greenhouse', token: 'anthropic', name: 'Anthropic' },
    { ats: 'ashby', token: 'snowflake', name: 'Snowflake' },
    { ats: 'ashby', token: 'confluent', name: 'Confluent' },
    { ats: 'ashby', token: 'openai', name: 'OpenAI' },
    { ats: 'ashby', token: 'notion', name: 'Notion', startup: true },
    { ats: 'ashby', token: 'cursor', name: 'Cursor', startup: true },
    { ats: 'smartrecruiters', token: 'servicenow', name: 'ServiceNow' },
];

/**
 * `JOB_ATS_BOARDS="greenhouse:acme,lever:beta:Beta Inc"` — ats:token[:name].
 * Env-added boards are not flagged as startups; that is a judgement call the
 * seed list makes deliberately and a config string can't.
 */
function boardsFromEnv(): AtsBoard[] {
    const raw = process.env.JOB_ATS_BOARDS;
    if (!raw) return [];
    return raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry): AtsBoard | null => {
            const [ats, token, ...nameParts] = entry.split(':').map((p) => p.trim());
            if (ats !== 'greenhouse' && ats !== 'lever' && ats !== 'ashby' && ats !== 'smartrecruiters')
                return null;
            if (!token) return null;
            return { ats, token, name: nameParts.join(':') || token };
        })
        .filter((b): b is AtsBoard => b !== null);
}

export function getAtsBoards(): AtsBoard[] {
    const boards = [...SEED_BOARDS, ...boardsFromEnv()];
    // Env entries can re-declare a seed board (to fix a slug or rename it);
    // last one wins.
    const byKey = new Map(boards.map((b) => [`${b.ats}:${b.token}`, b]));
    return Array.from(byKey.values());
}

/** Which JobSource a board's rows are stored under. */
export const ATS_SOURCE: Record<AtsBoard['ats'], JobSource> = {
    greenhouse: 'greenhouse',
    lever: 'lever',
    ashby: 'ashby',
    smartrecruiters: 'smartrecruiters',
};

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

// ── Greenhouse ────────────────────────────────────────────────────────────

async function fetchGreenhouse(board: AtsBoard): Promise<RawJob[]> {
    const data = await fetchJson<{ jobs?: unknown }>(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.token)}/jobs?content=true`
    );
    return asArray(data.jobs)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = String(j.id ?? '');
            const title = asString(j.title);
            const url = asString(j.absolute_url);
            if (!id || !title || !url) return null;
            const location = asString((j.location as Record<string, unknown>)?.name);
            return {
                externalId: `${board.token}-${id}`,
                title,
                // Greenhouse carries the employer's own name; prefer it, since
                // one board can host several brands under one parent company.
                company: asString(j.company_name) || board.name,
                applyUrl: url,
                location,
                // Greenhouse `content` is HTML *entity-encoded* — one pass
                // decodes the entities back into tags, the second strips them.
                description: stripHtml(stripHtml(asString(j.content))),
                // `first_published` is when the role opened; `updated_at` moves
                // every time someone edits the copy. Using updated_at would
                // make every lightly-edited old req look posted today and pin
                // it to the top of a newest-first board.
                postedAt: parseDate(j.first_published) || parseDate(j.updated_at),
                isStartup: board.startup === true,
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── Lever ─────────────────────────────────────────────────────────────────

async function fetchLever(board: AtsBoard): Promise<RawJob[]> {
    const rows = await fetchJson<unknown>(
        `https://api.lever.co/v0/postings/${encodeURIComponent(board.token)}?mode=json`
    );
    return asArray(rows)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = asString(j.id);
            const title = asString(j.text);
            const url = asString(j.hostedUrl) || asString(j.applyUrl);
            if (!id || !title || !url) return null;
            const categories = (j.categories || {}) as Record<string, unknown>;
            const workplace = asString(j.workplaceType);
            return {
                externalId: `${board.token}-${id}`,
                title,
                company: board.name,
                applyUrl: url,
                location: asString(categories.location),
                isRemote: workplace ? workplace.toLowerCase() === 'remote' : undefined,
                employmentType: asString(categories.commitment),
                description: asString(j.descriptionPlain) || stripHtml(asString(j.description)),
                tags: [asString(categories.team), asString(categories.department)].filter(Boolean),
                postedAt: parseDate(j.createdAt),
                isStartup: board.startup === true,
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── Ashby ─────────────────────────────────────────────────────────────────

async function fetchAshby(board: AtsBoard): Promise<RawJob[]> {
    const data = await fetchJson<{ jobs?: unknown }>(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.token)}`
    );
    return asArray(data.jobs)
        .map((row): RawJob | null => {
            const j = row as Record<string, unknown>;
            const id = asString(j.id);
            const title = asString(j.title);
            const url = asString(j.jobUrl) || asString(j.applyUrl);
            if (!id || !title || !url) return null;
            // `isListed: false` means the posting exists but is not public.
            if (j.isListed === false) return null;
            return {
                externalId: `${board.token}-${id}`,
                title,
                company: board.name,
                applyUrl: url,
                location: asString(j.location),
                isRemote: typeof j.isRemote === 'boolean' ? j.isRemote : undefined,
                employmentType: asString(j.employmentType),
                description: asString(j.descriptionPlain) || stripHtml(asString(j.descriptionHtml)),
                tags: [asString(j.department), asString(j.team)].filter(Boolean),
                postedAt: parseDate(j.publishedAt) || parseDate(j.updatedAt),
                isStartup: board.startup === true,
            };
        })
        .filter((j): j is RawJob => j !== null);
}

// ── SmartRecruiters ───────────────────────────────────────────────────────

/**
 * SmartRecruiters is the ATS a large share of Indian employers use — Paytm,
 * Freshworks, Swiggy, ServiceNow, HackerRank and Mindtickle among the boards
 * seeded below — which is why it is here despite being the most awkward feed.
 *
 * Awkward because the listing endpoint returns NO description; getting one
 * means a second HTTP call per posting, and a 237-job board would be 237 extra
 * requests inside an already-wide fan-out. We take the listing as-is and leave
 * `description` empty: the card, the filters and the apply link all work, and
 * the drawer says to open the employer's page for the full brief. Correct and
 * cheap beats complete and unshippable.
 */
async function fetchSmartRecruiters(board: AtsBoard): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const PAGE = 100;
    // Two pages max. The biggest seeded board is ~430 postings and the point of
    // this source is breadth of employers, not exhausting any one of them.
    for (let offset = 0; offset < 200; offset += PAGE) {
        const data = await fetchJson<{ content?: unknown; totalFound?: number }>(
            `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(board.token)}/postings?limit=${PAGE}&offset=${offset}`
        );
        const content = asArray(data.content);
        for (const row of content) {
            const j = row as Record<string, unknown>;
            const id = String(j.id ?? '');
            const title = asString(j.name);
            if (!id || !title) continue;
            const company = (j.company || {}) as Record<string, unknown>;
            const location = (j.location || {}) as Record<string, unknown>;
            const employment = (j.typeOfEmployment || {}) as Record<string, unknown>;
            const department = (j.department || {}) as Record<string, unknown>;
            const fn = (j.function || {}) as Record<string, unknown>;
            jobs.push({
                externalId: `${board.token}-${id}`,
                title,
                company: asString(company.name) || board.name,
                // The public posting URL. Verified against both the
                // capitalised identifier the API returns and our lowercase
                // token — SmartRecruiters accepts either.
                applyUrl: `https://jobs.smartrecruiters.com/${encodeURIComponent(board.token)}/${id}`,
                location:
                    asString(location.fullLocation) ||
                    [asString(location.city), asString(location.region), asString(location.country)]
                        .filter(Boolean)
                        .join(', '),
                isRemote: location.remote === true,
                employmentType: asString(employment.label),
                // Deliberately empty — see the note above.
                description: '',
                tags: [asString(department.label), asString(fn.label)].filter(Boolean),
                postedAt: parseDate(j.releasedDate),
                isStartup: board.startup === true,
            });
        }
        if (content.length < PAGE) break;
    }
    return jobs;
}

export function fetchAtsBoard(board: AtsBoard): Promise<RawJob[]> {
    if (board.ats === 'greenhouse') return fetchGreenhouse(board);
    if (board.ats === 'lever') return fetchLever(board);
    if (board.ats === 'smartrecruiters') return fetchSmartRecruiters(board);
    return fetchAshby(board);
}
