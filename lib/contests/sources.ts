// lib/contests/sources.ts
//
// One adapter per platform. Each returns RawContest[] and may throw — the
// ingest wraps every call, so a dead upstream costs that platform's rows and
// nothing else.
//
// ⚠️  SOURCES WERE CHOSEN BY MEASURED UPCOMING-CONTEST COUNT, not by whether
// the URL returns 200. That distinction is written into CLAUDE.md for the job
// board and it decided this list too:
//
//   codeforces  api/contest.list           6 upcoming   ✓ official JSON
//   codechef    api/list/contests/all      3 upcoming   ✓ unofficial but public JSON
//   leetcode    graphql upcomingContests   1 upcoming   ✓ official-ish GraphQL
//   atcoder     contests page (HTML)       5 upcoming   ✓ only option — see below
//
// REJECTED, with the reason, so nobody re-adds them:
//
//   kontests.net/api/v1/all — the obvious aggregator, and it is DEAD. curl
//     returns 000 (no response at all), not a 4xx. It would have replaced all
//     four adapters, which is exactly why it is worth recording that it does
//     not work rather than leaving it as a tempting TODO.
//
//   kenkoooo.com/atcoder/resources/contests.json — the well-known AtCoder
//     dataset. It returns 200 and 6,275 contests, of which ZERO are upcoming:
//     it is a historical archive for rating analysis. A "does it respond?"
//     check would have shipped it and produced a permanently empty AtCoder tab.

import type { ContestAdapter, RawContest } from './types';

/** Shared fetch: a timeout and a UA, because two of these are unofficial
 *  endpoints that will reject an anonymous client. */
async function getJson(url: string, init?: RequestInit): Promise<any> {
    const res = await fetch(url, {
        ...init,
        headers: {
            'User-Agent': 'GeekyFrontend-Contests/1.0',
            Accept: 'application/json',
            ...(init?.headers || {}),
        },
        signal: AbortSignal.timeout(20_000),
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/* ── Codeforces ───────────────────────────────────────────────────────────── */

/**
 * Official public API, no key. `phase: 'BEFORE'` is the upcoming set.
 *
 * `gym=false` excludes gym/training contests, which number in the thousands and
 * are not the scheduled competitions anyone is tracking.
 */
const codeforces: ContestAdapter = {
    platform: 'codeforces',
    fetch: async () => {
        const json = await getJson('https://codeforces.com/api/contest.list?gym=false');
        if (json?.status !== 'OK' || !Array.isArray(json.result)) {
            throw new Error('unexpected payload');
        }
        return json.result
            .filter((c: any) => c.phase === 'BEFORE' && c.startTimeSeconds)
            .map(
                (c: any): RawContest => ({
                    platform: 'codeforces',
                    platformId: String(c.id),
                    name: String(c.name),
                    url: `https://codeforces.com/contest/${c.id}`,
                    startsAt: new Date(c.startTimeSeconds * 1000),
                    durationSeconds: Number(c.durationSeconds) || 0,
                })
            );
    },
};

/* ── CodeChef ─────────────────────────────────────────────────────────────── */

/**
 * Unofficial but public and stable. `contest_start_date_iso` carries an IST
 * offset (+05:30), so it parses directly — do NOT use the non-ISO
 * `contest_start_date`, which is offset-less and would be read as UTC and land
 * every CodeChef contest five and a half hours early.
 */
const codechef: ContestAdapter = {
    platform: 'codechef',
    fetch: async () => {
        const json = await getJson('https://www.codechef.com/api/list/contests/all');
        const future = Array.isArray(json?.future_contests) ? json.future_contests : [];

        return future
            .map((c: any): RawContest | null => {
                const startsAt = new Date(c.contest_start_date_iso);
                const endsAt = new Date(c.contest_end_date_iso);
                if (Number.isNaN(startsAt.getTime())) return null;

                const durationSeconds = Number.isNaN(endsAt.getTime())
                    ? 0
                    : Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 1000));

                return {
                    platform: 'codechef',
                    platformId: String(c.contest_code),
                    name: String(c.contest_name),
                    url: `https://www.codechef.com/${c.contest_code}`,
                    startsAt,
                    durationSeconds,
                };
            })
            .filter(Boolean) as RawContest[];
    },
};

/* ── LeetCode ─────────────────────────────────────────────────────────────── */

/**
 * LeetCode's GraphQL endpoint. Only ever returns the next one or two contests,
 * which is correct rather than broken — they schedule weekly and biweekly a
 * short way ahead.
 */
const leetcode: ContestAdapter = {
    platform: 'leetcode',
    fetch: async () => {
        const json = await getJson('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: '{ upcomingContests { title titleSlug startTime duration } }',
            }),
        });
        const list = json?.data?.upcomingContests;
        if (!Array.isArray(list)) throw new Error('unexpected payload');

        return list.map(
            (c: any): RawContest => ({
                platform: 'leetcode',
                platformId: String(c.titleSlug),
                name: String(c.title),
                url: `https://leetcode.com/contest/${c.titleSlug}`,
                startsAt: new Date(c.startTime * 1000),
                durationSeconds: Number(c.duration) || 0,
            })
        );
    },
};

/* ── AtCoder ──────────────────────────────────────────────────────────────── */

/**
 * ⚠️  THE FRAGILE ONE. AtCoder publishes no upcoming-contest API, and the
 * community dataset everyone reaches for (kenkoooo) is history-only — measured
 * at 0 upcoming. So this parses the public contests page.
 *
 * It is deliberately written to fail LOUDLY rather than silently: if the table
 * or the row shape changes, the parse yields nothing and the ingest records
 * atcoder with count 0, which is visible in the refresh report. A parser that
 * "helpfully" fell back to a looser match would hide the breakage and serve a
 * half-wrong board — the same mistake as the job board's description-based
 * category detection.
 *
 * The times are the reason to parse the <time> element rather than the
 * timeanddate.com link: the element carries a full offset ("2026-08-08
 * 21:00:00+0900") while the link's `iso=` param does not. AtCoder is JST, so an
 * offset-less parse would be nine hours wrong for every contest.
 */
const atcoder: ContestAdapter = {
    platform: 'atcoder',
    fetch: async () => {
        const res = await fetch('https://atcoder.jp/contests/?lang=en', {
            headers: { 'User-Agent': 'GeekyFrontend-Contests/1.0' },
            signal: AbortSignal.timeout(20_000),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        // Scope to the upcoming table — the same page also lists recent and
        // permanent contests, and matching the whole document would mix them in.
        const marker = html.indexOf('contest-table-upcoming');
        if (marker < 0) throw new Error('upcoming table not found — page shape changed');
        const section = html.slice(marker);
        const tbodyStart = section.indexOf('<tbody>');
        const tbodyEnd = section.indexOf('</tbody>');
        if (tbodyStart < 0 || tbodyEnd < 0) throw new Error('upcoming tbody not found');
        const tbody = section.slice(tbodyStart, tbodyEnd);

        const out: RawContest[] = [];
        for (const row of tbody.split('<tr>')) {
            // "2026-08-08 21:00:00+0900" — space separator and a compact offset,
            // neither of which Date parses reliably, so both are normalised.
            const time = row.match(
                /<time[^>]*>(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})([+-]\d{4})<\/time>/
            );
            const link = row.match(/href="\/contests\/([A-Za-z0-9_\-]+)"[^>]*>([\s\S]*?)<\/a>/);
            const duration = row.match(/<td class="text-center">(\d{1,3}):(\d{2})<\/td>/);
            if (!time || !link) continue;

            const offset = `${time[3].slice(0, 3)}:${time[3].slice(3)}`; // +0900 -> +09:00
            const startsAt = new Date(`${time[1]}T${time[2]}${offset}`);
            if (Number.isNaN(startsAt.getTime())) continue;

            const name = link[2]
                .replace(/<[^>]*>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .trim();
            if (!name) continue;

            out.push({
                platform: 'atcoder',
                platformId: link[1],
                name,
                url: `https://atcoder.jp/contests/${link[1]}`,
                // Duration is HH:MM on this page, so hours can exceed 24.
                durationSeconds: duration
                    ? Number(duration[1]) * 3600 + Number(duration[2]) * 60
                    : 0,
                startsAt,
            });
        }
        return out;
    },
};

/**
 * The registry. Adding a platform = write an adapter above and add it here;
 * there is no second place to register it.
 */
export function buildAdapters(): ContestAdapter[] {
    return [codeforces, atcoder, codechef, leetcode];
}
