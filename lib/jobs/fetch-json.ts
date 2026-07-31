/**
 * The one HTTP call every source adapter makes.
 *
 * Two things it exists for:
 *  • a hard timeout. Ingest fans out to a dozen upstreams inside a serverless
 *    function with a wall-clock limit; one hung feed must not eat the budget
 *    for the other eleven.
 *  • a real User-Agent. RemoteOK (and a few ATS boards) return 403 to the
 *    default `node`/`undici` agent, which reads as "source is dead" when it is
 *    actually "you didn't introduce yourself".
 */

/**
 * 30s. Set from measurement, twice over — 12s then 20s were both too low.
 *
 * The binding case is Paytm's Lever board: 239 postings with full descriptions
 * is a 3.7 MB response, timed at 9.9s / 13.5s / 18.4s on three consecutive
 * standalone fetches. Under any concurrency that comfortably clears 20s, and
 * Paytm is the largest single source of Indian jobs on this board — losing it
 * to an impatient timeout is losing ~200 openings, silently.
 *
 * A high ceiling is safe here because it is a ceiling, not a delay: fast hosts
 * still return in under a second, and MAX_PER_HOST stops a slow host from
 * occupying the whole pool while it thinks.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

const USER_AGENT =
    'GeekyFrontendJobBoard/1.0 (+https://geekyfrontend.com; jobs aggregator; contact geekyfrontend@gmail.com)';

export class HttpError extends Error {
    // Declared and assigned separately, not as a constructor parameter
    // property — this repo runs its scripts under `node
    // --experimental-strip-types`, which cannot compile that syntax.
    status: number;

    constructor(status: number, url: string) {
        super(`HTTP ${status} from ${new URL(url).host}`);
        this.name = 'HttpError';
        this.status = status;
    }
}

/**
 * At most this many requests in flight to any ONE host.
 *
 * The ingest pool is sized for total throughput (10 adapters at once), but the
 * boards are not evenly spread across hosts — eight of them live on
 * api.lever.co and fourteen on boards-api.greenhouse.io. Firing eight
 * simultaneous requests at Lever made it stall: Paytm, Meesho and Hevo Data —
 * three of the largest Indian employers on the board, ~270 jobs between them —
 * all aborted on the same run, having answered comfortably when the pool
 * happened to spread them out.
 *
 * Capping per host makes the slow-host case queue instead of fail. It costs a
 * little wall clock and buys the difference between "Paytm is on the board" and
 * "Paytm silently isn't".
 */
const MAX_PER_HOST = 3;

const hostQueues = new Map<string, { active: number; waiting: (() => void)[] }>();

async function acquireHost(host: string): Promise<() => void> {
    let slot = hostQueues.get(host);
    if (!slot) {
        slot = { active: 0, waiting: [] };
        hostQueues.set(host, slot);
    }
    const current = slot;

    if (current.active >= MAX_PER_HOST) {
        /**
         * Wait for a slot to be HANDED OVER, and do not re-increment on wake.
         *
         * The obvious version — `active--` on release, then `active++` after the
         * waiter wakes — lets the counter dip between those two steps. A fresh
         * caller arriving in that window sees room that is already spoken for
         * and proceeds, so the cap is quietly exceeded by however many arrive.
         * Handing the slot over without ever releasing the count closes the gap.
         */
        await new Promise<void>((resolve) => current.waiting.push(resolve));
    } else {
        current.active++;
    }

    let released = false;
    return () => {
        // Guard against a double release leaking capacity out of the counter.
        if (released) return;
        released = true;
        const next = current.waiting.shift();
        if (next) next();
        else current.active--;
    };
}

export async function fetchJson<T>(
    url: string,
    options: { headers?: Record<string, string>; timeoutMs?: number; method?: string; body?: string } = {}
): Promise<T> {
    // Queue BEFORE starting the timeout clock — otherwise a request could spend
    // its whole budget waiting for a slot and abort without ever being sent.
    const release = await acquireHost(new URL(url).host);
    try {
        return await requestJson<T>(url, options);
    } finally {
        release();
    }
}

async function requestJson<T>(
    url: string,
    options: { headers?: Record<string, string>; timeoutMs?: number; method?: string; body?: string }
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: options.method || 'GET',
            body: options.body,
            signal: controller.signal,
            headers: {
                'User-Agent': USER_AGENT,
                Accept: 'application/json',
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers,
            },
            // These feeds change hourly at most and we persist the result, so
            // Next's default fetch caching would only serve us stale data.
            cache: 'no-store',
        });
        if (!res.ok) throw new HttpError(res.status, url);
        return (await res.json()) as T;
    } finally {
        clearTimeout(timer);
    }
}

/** Coerce whatever shape a feed uses for dates into a Date, or undefined. */
export function parseDate(value: unknown): Date | undefined {
    if (value == null) return undefined;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
    if (typeof value === 'number') {
        // Feeds are split between seconds and milliseconds. Anything below
        // 10^11 is seconds (that boundary is the year 5138 in seconds and 1973
        // in ms, so there is no ambiguous range in practice).
        const ms = value < 1e11 ? value * 1000 : value;
        const d = new Date(ms);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }
    if (typeof value === 'string') {
        const numeric = Number(value);
        if (Number.isFinite(numeric) && value.trim() !== '') return parseDate(numeric);
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
}
