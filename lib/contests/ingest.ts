// lib/contests/ingest.ts
//
// Fetch every platform, normalise, and upsert into the Contest cache.

import connectToDatabase from '@/lib/db';
import Contest from '@/lib/models/Contest';
import { buildAdapters } from './sources';
import type { ContestRecord, ContestSourceResult, RawContest } from './types';

/**
 * How far ahead we keep contests.
 *
 * Codeforces in particular announces things like the ICPC Online Challenge
 * months out. Those are real, but a board whose first screen is a contest in
 * November is not a board anyone checks weekly — the near-term rounds are the
 * point. Anything further out is dropped rather than shown and scrolled past.
 */
const HORIZON_DAYS = 60;

/** Derive everything the store needs from what an adapter reported. Doing this
 *  in ONE place is what stops two adapters computing `endsAt` differently. */
function normalize(raw: RawContest): ContestRecord | null {
    if (!raw.name?.trim() || !raw.url || Number.isNaN(raw.startsAt.getTime())) return null;

    const duration = Number.isFinite(raw.durationSeconds)
        ? Math.max(0, Math.round(raw.durationSeconds))
        : 0;

    return {
        ...raw,
        name: raw.name.trim(),
        durationSeconds: duration,
        endsAt: new Date(raw.startsAt.getTime() + duration * 1000),
        fingerprint: `${raw.platform}:${raw.platformId}`,
    };
}

export interface ContestIngestReport {
    sources: ContestSourceResult[];
    upserted: number;
    removed: number;
}

/**
 * Run every adapter and refresh the cache.
 *
 * ⚠️  A SOURCE FAILING MUST NOT FAIL THE RUN. Each adapter is wrapped
 * individually and its outcome recorded; three good platforms still refresh
 * when the fourth is down. The `sources` report is the only place a broken
 * upstream becomes visible — AtCoder is parsed from HTML and WILL eventually
 * break, and a silent zero would otherwise look like "no contests scheduled".
 */
export async function ingestContests(): Promise<ContestIngestReport> {
    await connectToDatabase();

    const now = Date.now();
    const horizon = now + HORIZON_DAYS * 24 * 60 * 60 * 1000;

    const sources: ContestSourceResult[] = [];
    const records: ContestRecord[] = [];

    for (const adapter of buildAdapters()) {
        try {
            const raw = await adapter.fetch();
            const usable = raw
                .map(normalize)
                .filter((c): c is ContestRecord => c !== null)
                // Drop anything already finished or beyond the horizon. An
                // adapter returning a stale contest is normal, not a bug.
                .filter((c) => c.endsAt.getTime() > now && c.startsAt.getTime() < horizon);

            records.push(...usable);
            sources.push({ platform: adapter.platform, ok: true, count: usable.length });
        } catch (err: any) {
            sources.push({
                platform: adapter.platform,
                ok: false,
                count: 0,
                error: err?.message || 'failed',
            });
        }
    }

    let upserted = 0;
    if (records.length) {
        const ops = records.map((c) => ({
            updateOne: {
                filter: { fingerprint: c.fingerprint },
                update: {
                    $set: {
                        platform: c.platform,
                        platformId: c.platformId,
                        name: c.name,
                        url: c.url,
                        startsAt: c.startsAt,
                        endsAt: c.endsAt,
                        durationSeconds: c.durationSeconds,
                        lastSeenAt: new Date(),
                    },
                },
                upsert: true,
            },
        }));
        const res = await Contest.bulkWrite(ops, { ordered: false });
        upserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    /**
     * Purge contests that are over.
     *
     * The TTL index already does this, but Mongo runs the TTL monitor about
     * once a minute and only on a live server — it does nothing on a cold
     * database, and nothing at all on a shared tier that has been idle. The
     * explicit delete makes the board correct immediately after a refresh
     * rather than eventually.
     *
     * This is the same lesson as the job board's India purge: a rule enforced
     * only on the write path leaves whatever is already stored untouched.
     */
    const purge = await Contest.deleteMany({ endsAt: { $lt: new Date(now) } });

    return { sources, upserted, removed: purge.deletedCount || 0 };
}
