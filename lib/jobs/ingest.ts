/**
 * One refresh run: fan out to every source, normalize, dedupe, upsert.
 *
 * Three rules this file exists to enforce:
 *
 *  1. **A source can fail without failing the run.** Every adapter is wrapped;
 *     a 404 from a stale ATS slug, a rate-limit from RemoteOK or a schema
 *     change at Jobicy costs us that source's rows and nothing else. The run
 *     reports what broke (`SourceResult[]`) instead of throwing — otherwise one
 *     dead upstream empties the whole board on the next cron.
 *
 *  2. **Dedupe happens before the DB, then again in it.** Within a run we
 *     collapse by fingerprint in memory (cheap); across runs the unique index
 *     on `fingerprint` does it. Both are needed: the in-memory pass is what
 *     stops one bulk write containing two upserts for the same key, which Mongo
 *     would otherwise apply in an arbitrary order.
 *
 *  3. **Jobs are never deleted for being absent from a run.** They leave by TTL
 *     expiry — a source being down for one cron must not wipe every job it was
 *     the only provider of. The ONE exception is the non-India purge below,
 *     which deletes on a property of the row itself rather than on a source's
 *     silence, and so carries none of that risk.
 */

import connectToDatabase from '@/lib/db';
import Job, { JOB_TTL_DAYS } from '@/lib/models/Job';
import { normalizeJob } from './normalize';
import type { JobSource, NormalizedJob, RawJob, SourceResult } from './types';
import { fetchHimalayas } from './sources/aggregators';
import { fetchHnHiring } from './sources/hn-hiring';
import { ATS_SOURCE, fetchAtsBoard, getAtsBoards } from './sources/ats';
import {
    KEYED_QUERIES,
    fetchAdzuna,
    fetchJSearch,
    hasAdzunaKeys,
    hasJSearchKey,
} from './sources/keyed';

interface Adapter {
    source: JobSource;
    /** Which feed/board/query — distinguishes the 20 `greenhouse` adapters. */
    label: string;
    run: () => Promise<RawJob[]>;
}

/**
 * The full adapter list for a run.
 *
 * Adzuna and JSearch are absent unless their keys are set, so the board works
 * out of the box and gets better when someone adds credentials.
 */
export function buildAdapters(): Adapter[] {
    /**
     * Four of the original six remote aggregators are gone, each on a measured
     * zero-India yield rather than a hunch:
     *
     *   RemoteOK   — free feed is mostly non-engineering filler; 0 Indian jobs
     *   Arbeitnow  — a German general-jobs board; 0
     *   Remotive   — US/EU remote; 0
     *   Jobicy     — has no India geo at all. Its widest Asian filter
     *                (`geo=apac`, the only value of several that isn't a 400)
     *                returned 50 roles, 0 of them mentioning India.
     *
     * On an India-only board those are pure latency. The two that stay were
     * each measured carrying live India-open roles, and HN Who-is-hiring is the
     * only startup channel here that no ATS covers.
     */
    const adapters: Adapter[] = [
        { source: 'himalayas', label: 'Himalayas', run: fetchHimalayas },
        { source: 'hnhiring', label: 'HN Who is hiring', run: fetchHnHiring },
    ];

    for (const board of getAtsBoards()) {
        adapters.push({
            source: ATS_SOURCE[board.ats],
            label: `${board.name} (${board.ats})`,
            run: () => fetchAtsBoard(board),
        });
    }

    if (hasAdzunaKeys()) {
        // India is the point of this source; gb/us are a cheap bonus. Kept to
        // one query each outside India to stay well inside the free tier.
        for (const what of KEYED_QUERIES) {
            adapters.push({
                source: 'adzuna',
                label: `Adzuna IN — ${what}`,
                run: () => fetchAdzuna('in', what),
            });
        }
        adapters.push({
            source: 'adzuna',
            label: 'Adzuna GB — frontend developer',
            run: () => fetchAdzuna('gb', 'frontend developer'),
        });
    }

    if (hasJSearchKey()) {
        for (const query of KEYED_QUERIES.slice(0, 3)) {
            adapters.push({
                source: 'jsearch',
                label: `JSearch IN — ${query}`,
                run: () => fetchJSearch(query, 'in'),
            });
        }
    }

    return adapters;
}

/**
 * Runs `tasks` with at most `limit` in flight.
 *
 * Unbounded `Promise.all` over ~30 adapters opens 30 sockets at once, which
 * gets us rate-limited by the hosts we hit repeatedly (all the Greenhouse
 * boards share one). A small pool is both politer and, in a serverless
 * function, less likely to hit the memory ceiling.
 */
async function pooled<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
        while (cursor < tasks.length) {
            const index = cursor++;
            results[index] = await tasks[index]();
        }
    });
    await Promise.all(workers);
    return results;
}

interface RunOutcome {
    result: SourceResult;
    jobs: NormalizedJob[];
}

/**
 * The India gate.
 *
 * This board is India-only, and the rule is deliberately the strict one: the
 * posting's own location has to resolve to India. Two alternatives were
 * rejected —
 *
 *  • "keep everything from an Indian employer" would keep Freshworks' San
 *    Mateo and London reqs (24 of their 49 openings are not in India);
 *  • "keep generic Remote too" would re-admit ~590 location-less remote roles
 *    that are overwhelmingly US-only in practice, which is exactly the noise
 *    an India-only board exists to remove. "Remote — India" and "Remote, APAC"
 *    still pass, because those say India.
 *
 * A job we cannot place is dropped. On a board this size a missed real job
 * costs far less than a US listing shown to someone who cannot take it.
 */
function isIndianJob(job: NormalizedJob): boolean {
    return job.countryCode === 'IN';
}

async function runAdapter(adapter: Adapter): Promise<RunOutcome> {
    const startedAt = Date.now();
    try {
        const raw = await adapter.run();
        const jobs = raw
            .map((job) => normalizeJob(adapter.source, job))
            .filter((job): job is NormalizedJob => job !== null)
            .filter(isIndianJob);
        return {
            jobs,
            result: {
                source: adapter.source,
                label: adapter.label,
                ok: true,
                // The count AFTER normalization — a source returning 500 rows
                // of which 3 are engineering jobs is worth knowing about.
                fetched: jobs.length,
                ms: Date.now() - startedAt,
            },
        };
    } catch (error: any) {
        return {
            jobs: [],
            result: {
                source: adapter.source,
                label: adapter.label,
                ok: false,
                fetched: 0,
                error: error?.message || 'unknown error',
                ms: Date.now() - startedAt,
            },
        };
    }
}

export interface IngestSummary {
    sources: SourceResult[];
    /** Rows deleted for not being Indian jobs — see the purge in ingestJobs. */
    purgedNonIndian: number;
    /** Jobs returned by all sources, after normalization, before dedupe. */
    fetched: number;
    /** Distinct openings after fingerprint dedupe. */
    unique: number;
    inserted: number;
    updated: number;
    totalInDb: number;
    ms: number;
}

export async function ingestJobs(): Promise<IngestSummary> {
    const startedAt = Date.now();
    const adapters = buildAdapters();

    // 10 in flight. With ~90 adapters a pool of 6 measured ~35s of wall clock,
    // which is uncomfortably close to the 60s ceiling a Vercel Hobby function
    // gets; 10 brings it under 30s without hammering any single host (the
    // Greenhouse boards are the only ones sharing an origin, and they are the
    // fastest to answer).
    const outcomes = await pooled(
        adapters.map((adapter) => () => runAdapter(adapter)),
        10
    );

    const sources = outcomes.map((o) => o.result);
    const allJobs = outcomes.flatMap((o) => o.jobs);

    /**
     * In-run dedupe. When two sources describe the same opening we keep the
     * richer record — a Greenhouse posting has the full description, the
     * aggregator's copy is often a stub — but union their ids so the row still
     * records that both feeds carried it.
     */
    const byFingerprint = new Map<string, NormalizedJob & { sourceIds: string[]; sources: JobSource[] }>();
    for (const job of allJobs) {
        const existing = byFingerprint.get(job.fingerprint);
        if (!existing) {
            byFingerprint.set(job.fingerprint, {
                ...job,
                sourceIds: [job.sourceId],
                sources: [job.source],
            });
            continue;
        }
        if (!existing.sourceIds.includes(job.sourceId)) existing.sourceIds.push(job.sourceId);
        if (!existing.sources.includes(job.source)) existing.sources.push(job.source);
        // "Richer" = longer description. Crude, but it reliably picks the
        // company's own posting over a syndicated summary.
        if (job.description.length > existing.description.length) {
            existing.description = job.description;
            existing.companyLogo = existing.companyLogo || job.companyLogo;
            existing.salaryText = existing.salaryText || job.salaryText;
            existing.salaryMin = existing.salaryMin ?? job.salaryMin;
            existing.salaryMax = existing.salaryMax ?? job.salaryMax;
            existing.salaryCurrency = existing.salaryCurrency || job.salaryCurrency;
        }
        // A startup signal from ANY source sticks: the ATS/HN adapters know
        // this, the aggregators never do.
        existing.isStartup = existing.isStartup || job.isStartup;
        // Earliest known posting date is the true one; aggregators re-date
        // syndicated posts to the day they picked them up.
        if (job.postedAt < existing.postedAt) existing.postedAt = job.postedAt;
    }

    const unique = Array.from(byFingerprint.values());

    await connectToDatabase();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + JOB_TTL_DAYS * 24 * 60 * 60 * 1000);

    const operations = unique.map((job) => ({
        updateOne: {
            filter: { fingerprint: job.fingerprint },
            update: {
                $set: {
                    title: job.title,
                    company: job.company,
                    companyLogo: job.companyLogo,
                    applyUrl: job.applyUrl,
                    location: job.location,
                    isRemote: job.isRemote,
                    countryCode: job.countryCode,
                    city: job.city,
                    employmentType: job.employmentType,
                    category: job.category,
                    level: job.level,
                    tags: job.tags,
                    isStartup: job.isStartup,
                    description: job.description,
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    salaryCurrency: job.salaryCurrency,
                    salaryText: job.salaryText,
                    postedAt: job.postedAt,
                    sourceCount: job.sourceIds.length,
                    lastSeenAt: now,
                    // Pushed forward on every run that still sees the job; a job
                    // that drops out of all feeds stops being renewed and the
                    // TTL index removes it.
                    expiresAt,
                },
                $addToSet: {
                    sourceIds: { $each: job.sourceIds },
                    sources: { $each: job.sources },
                },
                $setOnInsert: { fingerprint: job.fingerprint, firstSeenAt: now },
            },
            upsert: true,
        },
    }));

    let inserted = 0;
    let updated = 0;
    // Chunked so a single write command stays well inside Mongo's 16MB limit —
    // descriptions are capped at 4KB, so ~500 ops is comfortably under it.
    for (let i = 0; i < operations.length; i += 500) {
        const chunk = operations.slice(i, i + 500);
        try {
            // `ordered: false` so one duplicate-key race doesn't abandon the
            // rest of the chunk.
            const res = await Job.bulkWrite(chunk, { ordered: false });
            inserted += res.upsertedCount || 0;
            updated += res.modifiedCount || 0;
        } catch (error: any) {
            /**
             * The in-flight guard in the refresh route is per-INSTANCE, so a
             * cron tick and a user-triggered seed running on two serverless
             * instances can upsert the same fingerprint at the same moment and
             * lose the race with E11000. `ordered: false` means the other
             * writes in the chunk still landed — but bulkWrite reports the
             * partial failure by THROWING, which would have thrown away a
             * complete, successful ingest over a couple of duplicate keys.
             *
             * The duplicate is not a problem: the row it collided with holds
             * the same job. Count what landed and carry on. Anything that is
             * not a duplicate-key error is a real failure and still propagates.
             */
            const result = error?.result;
            const onlyDuplicates =
                error?.code === 11000 ||
                (Array.isArray(error?.writeErrors) &&
                    error.writeErrors.length > 0 &&
                    error.writeErrors.every((e: any) => e?.err?.code === 11000 || e?.code === 11000));
            if (!onlyDuplicates) throw error;
            inserted += result?.upsertedCount ?? result?.nUpserted ?? 0;
            updated += result?.modifiedCount ?? result?.nModified ?? 0;
        }
    }

    /**
     * Purge anything that is not an Indian job.
     *
     * This exists because the India gate was added to a collection that already
     * held thousands of US and EU rows from before the board was India-only.
     * Those rows were still being served — the write-path gate could not touch
     * them, and TTL would have taken three weeks to finish the job.
     *
     * Safe to run every time, and worth it: it also catches rows whose country
     * detection has since improved, and any row written by an older deploy
     * during a rollout. `$ne` matches documents missing the field entirely,
     * which is what we want — a job we cannot place in India does not belong on
     * an India-only board.
     */
    /**
     * Guarded on `unique > 0`. If a run produced no Indian jobs at all, that is
     * a total upstream outage or a regression in country detection — never a
     * real state of the world. Deleting on the strength of that reading would
     * turn a bad run into an empty board. Skip, keep what we have, and let the
     * next run sort it out.
     */
    const purged =
        unique.length > 0
            ? await Job.deleteMany({ countryCode: { $ne: 'IN' } })
            : { deletedCount: 0 };

    return {
        sources,
        purgedNonIndian: purged.deletedCount || 0,
        fetched: allJobs.length,
        unique: unique.length,
        inserted,
        updated,
        totalInDb: await Job.countDocuments({}),
        ms: Date.now() - startedAt,
    };
}
