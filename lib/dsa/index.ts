// lib/dsa/index.ts
//
// The DSA sheet registry. Adding a section = write it in lib/dsa/sections/ and
// add it to SECTIONS below; the tracker, the API, the public pages and the
// validator all read from here, so there is no second place to register it.
//
// Same contract as lib/roadmaps/index.ts, for the same reason: one list, and a
// script (`npm run test:dsa`) that fails if a module exists but was never added
// to it.

import type { DsaProblem, DsaSection, DsaSheet } from './types';
// Imported under an alias because this module re-exports `hasApproach` below;
// referring to the re-export from inside the module would be a circular read.
import { hasApproach as hasApproachFn } from './approaches';
import {
    arraysHashingSection,
    twoPointersSection,
    slidingWindowSection,
    stackSection,
    binarySearchSection,
} from './sections/foundations';
import {
    linkedListSection,
    treesSection,
    triesSection,
    heapSection,
} from './sections/structures';
import { backtrackingSection, graphsSection } from './sections/search';
import { dp1dSection, dp2dSection } from './sections/dp';
import {
    greedySection,
    intervalsSection,
    bitManipulationSection,
    mathGeometrySection,
} from './sections/techniques';

/**
 * STUDY ORDER, not difficulty order.
 *
 * Foundations first because every later section assumes hashing and two
 * pointers. Trees before graphs because a graph traversal is a tree traversal
 * that has to remember where it has been. DP late because it is the section
 * people quit on, and quitting in week two costs more than quitting in week
 * ten. The last four are short on purpose — they are what is left when the
 * interview is close and you want finishable wins.
 */
export const SECTIONS: DsaSection[] = [
    arraysHashingSection,
    twoPointersSection,
    slidingWindowSection,
    stackSection,
    binarySearchSection,
    linkedListSection,
    treesSection,
    triesSection,
    heapSection,
    backtrackingSection,
    graphsSection,
    dp1dSection,
    dp2dSection,
    greedySection,
    intervalsSection,
    bitManipulationSection,
    mathGeometrySection,
];

export const DSA_SHEET: DsaSheet = {
    id: 'gf-dsa-2026',
    title: 'The Geeky Frontend DSA Sheet',
    tagline:
        'The problems that actually come up in 2026 interviews — grouped by the idea they teach, in the order that makes each one easier than the last.',
    sections: SECTIONS,
};

/* ── Lookups ──────────────────────────────────────────────────────────────── */

const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

/**
 * Problem id → the problem AND its section.
 *
 * Built once at module load. Every route that takes a problem id from a request
 * resolves it through here and then uses the RETURNED object's id — never the
 * raw string from the body. Progress keys are Mongo update paths
 * (`problems.<id>`), so an unvalidated id is a path-injection; this map is what
 * makes "match, do not trust" a one-liner at every call site.
 */
const PROBLEM_BY_ID = new Map<string, { problem: DsaProblem; section: DsaSection }>();
for (const section of SECTIONS) {
    for (const problem of section.problems) {
        PROBLEM_BY_ID.set(problem.id, { problem, section });
    }
}

export function getSection(id: string): DsaSection | null {
    return SECTION_BY_ID.get(id) ?? null;
}

/** The problem plus the section it lives in, or null if the id is not ours. */
export function getProblem(
    id: string
): { problem: DsaProblem; section: DsaSection } | null {
    return PROBLEM_BY_ID.get(id) ?? null;
}

/** Every problem id in the sheet. Used by the validator and the sitemap. */
export function allProblemIds(): string[] {
    return [...PROBLEM_BY_ID.keys()];
}

/** One end of a prev/next pair, flattened for the footer nav to render. */
export interface DsaNeighbour {
    problemId: string;
    title: string;
    sectionId: string;
    sectionTitle: string;
}

/**
 * The previous and next READABLE approach pages, in sheet order.
 *
 * Deliberately spans sections rather than stopping at a section boundary. The
 * sheet's order is a study order — the last problem of Arrays & Hashing is
 * meant to be followed by the first of Two Pointers — so a "next" that dead-ends
 * at the end of each section would break the exact continuity the ordering
 * exists to create. The footer names the section when it changes, so crossing
 * one is visible rather than disorienting.
 *
 * Skips problems with no authored approach: `next` must never point at a 404,
 * and the gaps are large and scattered while the editorial corpus fills in.
 */
export function getApproachNeighbours(problemId: string): {
    prev: DsaNeighbour | null;
    next: DsaNeighbour | null;
} {
    const readable: DsaNeighbour[] = [];
    for (const section of SECTIONS) {
        for (const problem of section.problems) {
            if (!hasApproachFn(problem.id)) continue;
            readable.push({
                problemId: problem.id,
                title: problem.title,
                sectionId: section.id,
                sectionTitle: section.title,
            });
        }
    }

    const i = readable.findIndex((p) => p.problemId === problemId);
    if (i === -1) return { prev: null, next: null };
    return {
        prev: i > 0 ? readable[i - 1] : null,
        next: i < readable.length - 1 ? readable[i + 1] : null,
    };
}

/** Total problem count — shown on the dashboard card and the public landing. */
export const TOTAL_PROBLEMS = PROBLEM_BY_ID.size;

export * from './types';
export { getApproach, hasApproach, approachCount } from './approaches';
