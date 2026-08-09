// lib/dsa/approaches/index.ts
//
// The "Our approach" registry: problem id → authored explanation.
//
// COVERAGE IS DELIBERATELY PARTIAL, AND THE UI KNOWS IT.
// ------------------------------------------------------
// The catalogue (~155 problems) shipped complete on day one; the editorials
// fill in behind it over time, because each one is 30-60 minutes of real
// writing and gating the whole feature on all 155 would mean shipping nothing
// for months. A problem with no entry here renders its row normally and shows
// "approach coming soon" instead of a dead link — see `hasApproach()`, which is
// what every caller must check before linking to /dsa/<section>/<problem>.
//
// This is also why approaches live in their own files keyed by id rather than
// inline on the problem: adding an editorial never touches the catalogue, so a
// content commit cannot accidentally change the sheet, reorder a section, or
// break a progress key.

import type { DsaApproach } from '../types';
import { arraysHashingApproaches } from './arrays-hashing';
import { twoPointersApproaches } from './two-pointers';
import { slidingWindowApproaches } from './sliding-window';
import { stackApproaches } from './stack';
import { binarySearchApproaches } from './binary-search';
import { linkedListApproaches } from './linked-list';
import { treesApproaches } from './trees';
import { triesApproaches } from './tries';
import { heapApproaches } from './heap';
import { backtrackingApproaches } from './backtracking';
import { graphsApproaches } from './graphs';
import { dp1dApproaches } from './dp-1d';
import { dp2dApproaches } from './dp-2d';
import { greedyApproaches } from './greedy';
import { intervalsApproaches } from './intervals';
import { bitManipulationApproaches } from './bit-manipulation';
import { mathGeometryApproaches } from './math-geometry';

/**
 * Merged lookup. Section files are spread in registration order; an id must
 * appear in exactly one of them (`npm run test:dsa` fails on a duplicate,
 * because a silent overwrite here would publish the wrong explanation).
 */
export const APPROACHES: Record<string, DsaApproach> = {
    ...arraysHashingApproaches,
    ...twoPointersApproaches,
    ...slidingWindowApproaches,
    ...stackApproaches,
    ...binarySearchApproaches,
    ...linkedListApproaches,
    ...treesApproaches,
    ...triesApproaches,
    ...heapApproaches,
    ...backtrackingApproaches,
    ...graphsApproaches,
    ...dp1dApproaches,
    ...dp2dApproaches,
    ...greedyApproaches,
    ...intervalsApproaches,
    ...bitManipulationApproaches,
    ...mathGeometryApproaches,
};

/** The authored explanation for a problem, or null if not written yet. */
export function getApproach(problemId: string): DsaApproach | null {
    return APPROACHES[problemId] ?? null;
}

/**
 * Whether an approach page exists for this problem.
 *
 * Callers MUST use this rather than optimistically linking: the public route
 * `/dsa/[sectionSlug]/[problemSlug]` 404s for an unauthored problem, and a row
 * that links into a 404 is worse than one that honestly says "coming soon".
 */
export function hasApproach(problemId: string): boolean {
    return problemId in APPROACHES;
}

/** How many editorials exist. Shown as "N of M explained" on the sheet header. */
export function approachCount(): number {
    return Object.keys(APPROACHES).length;
}
