// lib/dsa/nav.ts
//
// A lightweight, SERIALISABLE view of the catalogue for the reader sidebar.
//
// WHY THIS EXISTS RATHER THAN IMPORTING lib/dsa DIRECTLY IN THE SIDEBAR
// ---------------------------------------------------------------------
// The sidebar is a client component (it has a mobile drawer and collapsible
// sections, so it needs state). Importing `lib/dsa` from client code would pull
// `lib/dsa/approaches` into the browser bundle — and that module holds the FULL
// markdown body and three code solutions for every written problem. Today that
// is 12 editorials; at 155 it is several hundred kilobytes of prose shipped to
// draw a list of links, on every page.
//
// So the server builds this instead: ids, titles, and a boolean. `written` is
// computed here, where `hasApproach` is cheap, and crosses to the client as a
// flag rather than as the content it was derived from.

import { SECTIONS } from './index';
import { hasApproach } from './approaches';

export interface DsaNavProblem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    /** Whether /dsa/<section>/<id> exists. An unwritten row must not be a link. */
    written: boolean;
}

export interface DsaNavSection {
    id: string;
    title: string;
    problems: DsaNavProblem[];
    /** How many of this section's problems have an approach page. */
    writtenCount: number;
}

/**
 * The whole sheet, flattened for navigation.
 *
 * Every section is included even when none of its problems are written yet.
 * Hiding empty sections would make the sidebar shrink and grow as the editorial
 * corpus fills in, so a learner could never build a mental map of the sheet —
 * and it would hide the fact that 17 topics exist, which is the main thing the
 * sidebar is there to communicate.
 */
export function buildDsaNav(): DsaNavSection[] {
    return SECTIONS.map((section) => {
        const problems = section.problems.map((p) => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            written: hasApproach(p.id),
        }));
        return {
            id: section.id,
            title: section.title,
            problems,
            writtenCount: problems.filter((p) => p.written).length,
        };
    });
}
