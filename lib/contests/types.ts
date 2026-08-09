// lib/contests/types.ts
//
// Shapes for the competitive-programming contest board (/dashboard?tab=contests).
//
// This is the same architecture as lib/jobs/, for the same reasons, and the
// lessons recorded there apply verbatim:
//
//   • `Contest` is a CACHE, not authored data. It can always be rebuilt by
//     re-running an ingest, so nothing irreplaceable may live on it.
//   • A source failing must not fail the run. Every adapter is wrapped and
//     reports its own `SourceResult`; one dead upstream costs one platform's
//     rows, not the board.
//   • Rows EXPIRE. A contest that has finished stops being useful, and no feed
//     ever says "this is over" — it just stops appearing. A TTL index clears
//     them, so anything a learner wants to keep must be exported, not stored.
//
// WHERE IT DIFFERS FROM THE JOB BOARD, and it matters: a job can be carried by
// six aggregators and needs fuzzy fingerprinting to dedupe. A contest has
// exactly one authoritative source — its own platform — so identity is simply
// (platform, platformId) and there is no dedupe problem to solve. Do not import
// the job board's fingerprinting; it would only add failure modes.

/** Platforms we aggregate. Adding one is additive — write an adapter and
 *  register it in `buildAdapters()`. */
export type ContestPlatform = 'codeforces' | 'codechef' | 'leetcode' | 'atcoder';

export const CONTEST_PLATFORMS: {
    id: ContestPlatform;
    label: string;
    /** Tailwind classes for the platform chip. Literal strings, not built by
     *  template — see the note in components/dashboard/dsa-tab.tsx. */
    chip: string;
}[] = [
    {
        id: 'codeforces',
        label: 'Codeforces',
        chip: 'text-rose-700 dark:text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
    {
        id: 'atcoder',
        label: 'AtCoder',
        chip: 'text-sky-700 dark:text-sky-400 border-sky-500/30 bg-sky-500/10',
    },
    {
        id: 'codechef',
        label: 'CodeChef',
        chip: 'text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    {
        id: 'leetcode',
        label: 'LeetCode',
        chip: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
];

/** What an adapter returns. Deliberately minimal — everything derivable is
 *  derived in normalize.ts so two adapters cannot disagree about it. */
export interface RawContest {
    platform: ContestPlatform;
    /** The platform's own id for the contest. Stable, and the dedupe key. */
    platformId: string;
    name: string;
    url: string;
    startsAt: Date;
    /** Seconds. Some platforms report it directly; others give an end time. */
    durationSeconds: number;
}

/** A row as stored and served. */
export interface ContestRecord extends RawContest {
    endsAt: Date;
    /** `${platform}:${platformId}` — the unique key. */
    fingerprint: string;
}

/**
 * Per-source outcome for one ingest run.
 *
 * This report is the ONLY way to notice that an upstream has changed shape —
 * AtCoder is scraped from HTML and will eventually break silently otherwise.
 * Admin and cron see it in the refresh response; learners never do.
 */
export interface ContestSourceResult {
    platform: ContestPlatform;
    ok: boolean;
    count: number;
    error?: string;
}

/** An adapter: fetch and parse one platform. Throwing is fine — `ingestContests`
 *  catches per source and records the failure. */
export interface ContestAdapter {
    platform: ContestPlatform;
    fetch: () => Promise<RawContest[]>;
}
