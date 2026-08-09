// scripts/validate-dsa.ts
//
//   npm run test:dsa
//
// The DSA catalogue is authored TypeScript with no build-time schema, so the
// failures it can ship are silent ones: a duplicate id that makes two problems
// share a learner's tick, a `.` in an id that turns a Mongo update path into a
// nested write, an approach keyed to a problem that no longer exists, a
// LeetCode URL with a typo that 404s for every visitor. None of those break the
// build; all of them break a learner. This script is that check.
//
// It verifies, with NO network and NO database:
//   1. problem ids are globally unique and safe as a Mongo sub-document key
//      (DsaProgress stores them as `problems.<id>` — a dot or $ would be read
//      as a path or an operator)
//   2. section ids are unique and URL-safe
//   3. every external URL is a well-formed https link on a known platform host
//   4. every approach is keyed to a real problem, and no problem has two
//   5. every approach has all three languages (cpp, java, javascript), a
//      non-empty body and complexity strings
//   6. every section module is registered in lib/dsa/index.ts
//
// Read-only. Exits non-zero on any failure.

import { readFileSync } from 'node:fs';
import type { DsaSection, DsaApproach } from '../lib/dsa/types.ts';

/* ⚠️  Imported file-by-file rather than through lib/dsa/index.ts, for the same
 * reason validate-roadmaps.ts does it: `node --experimental-strip-types` is a
 * plain ESM loader and cannot resolve the extensionless imports Next uses. The
 * section modules only `import type`, and type-stripping erases that, so
 * importing them directly works. `checkRegistry()` below guards the drift this
 * introduces. */
import {
    arraysHashingSection,
    twoPointersSection,
    slidingWindowSection,
    stackSection,
    binarySearchSection,
} from '../lib/dsa/sections/foundations.ts';
import {
    linkedListSection,
    treesSection,
    triesSection,
    heapSection,
} from '../lib/dsa/sections/structures.ts';
import { backtrackingSection, graphsSection } from '../lib/dsa/sections/search.ts';
import { dp1dSection, dp2dSection } from '../lib/dsa/sections/dp.ts';
import {
    greedySection,
    intervalsSection,
    bitManipulationSection,
    mathGeometrySection,
} from '../lib/dsa/sections/techniques.ts';
import { arraysHashingApproaches } from '../lib/dsa/approaches/arrays-hashing.ts';
import { twoPointersApproaches } from '../lib/dsa/approaches/two-pointers.ts';
import { slidingWindowApproaches } from '../lib/dsa/approaches/sliding-window.ts';
import { stackApproaches } from '../lib/dsa/approaches/stack.ts';
import { binarySearchApproaches } from '../lib/dsa/approaches/binary-search.ts';
import { linkedListApproaches } from '../lib/dsa/approaches/linked-list.ts';
import { treesApproaches } from '../lib/dsa/approaches/trees.ts';
import { triesApproaches } from '../lib/dsa/approaches/tries.ts';
import { heapApproaches } from '../lib/dsa/approaches/heap.ts';
import { backtrackingApproaches } from '../lib/dsa/approaches/backtracking.ts';
import { graphsApproaches } from '../lib/dsa/approaches/graphs.ts';
import { dp1dApproaches } from '../lib/dsa/approaches/dp-1d.ts';
import { dp2dApproaches } from '../lib/dsa/approaches/dp-2d.ts';
import { greedyApproaches } from '../lib/dsa/approaches/greedy.ts';
import { intervalsApproaches } from '../lib/dsa/approaches/intervals.ts';
import { bitManipulationApproaches } from '../lib/dsa/approaches/bit-manipulation.ts';
import { mathGeometryApproaches } from '../lib/dsa/approaches/math-geometry.ts';

const MODULES: { exportName: string; section: DsaSection }[] = [
    { exportName: 'arraysHashingSection', section: arraysHashingSection },
    { exportName: 'twoPointersSection', section: twoPointersSection },
    { exportName: 'slidingWindowSection', section: slidingWindowSection },
    { exportName: 'stackSection', section: stackSection },
    { exportName: 'binarySearchSection', section: binarySearchSection },
    { exportName: 'linkedListSection', section: linkedListSection },
    { exportName: 'treesSection', section: treesSection },
    { exportName: 'triesSection', section: triesSection },
    { exportName: 'heapSection', section: heapSection },
    { exportName: 'backtrackingSection', section: backtrackingSection },
    { exportName: 'graphsSection', section: graphsSection },
    { exportName: 'dp1dSection', section: dp1dSection },
    { exportName: 'dp2dSection', section: dp2dSection },
    { exportName: 'greedySection', section: greedySection },
    { exportName: 'intervalsSection', section: intervalsSection },
    { exportName: 'bitManipulationSection', section: bitManipulationSection },
    { exportName: 'mathGeometrySection', section: mathGeometrySection },
];

const SECTIONS = MODULES.map((m) => m.section);

/** All authored approach records, merged the same way lib/dsa/approaches does. */
const APPROACH_SOURCES: { file: string; records: Record<string, DsaApproach> }[] = [
    { file: 'arrays-hashing', records: arraysHashingApproaches },
    { file: 'two-pointers', records: twoPointersApproaches },
    { file: 'sliding-window', records: slidingWindowApproaches },
    { file: 'stack', records: stackApproaches },
    { file: 'binary-search', records: binarySearchApproaches },
    { file: 'linked-list', records: linkedListApproaches },
    { file: 'trees', records: treesApproaches },
    { file: 'tries', records: triesApproaches },
    { file: 'heap', records: heapApproaches },
    { file: 'backtracking', records: backtrackingApproaches },
    { file: 'graphs', records: graphsApproaches },
    { file: 'dp-1d', records: dp1dApproaches },
    { file: 'dp-2d', records: dp2dApproaches },
    { file: 'greedy', records: greedyApproaches },
    { file: 'intervals', records: intervalsApproaches },
    { file: 'bit-manipulation', records: bitManipulationApproaches },
    { file: 'math-geometry', records: mathGeometryApproaches },
];

/** Mongo sub-document key AND URL segment. Deliberately strict. */
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

const REQUIRED_LANGS = ['cpp', 'java', 'javascript'] as const;

const PLATFORM_HOSTS: Record<string, string[]> = {
    leetcode: ['leetcode.com'],
    gfg: ['geeksforgeeks.org', 'practice.geeksforgeeks.org'],
};

/** Fail if a section module exists but was never added to the registry. */
function checkRegistry(): string[] {
    const errors: string[] = [];
    let source: string;
    try {
        source = readFileSync(new URL('../lib/dsa/index.ts', import.meta.url), 'utf8');
    } catch {
        return ['could not read lib/dsa/index.ts to verify the registry'];
    }
    // The SECTIONS array body — everything between `SECTIONS: DsaSection[] = [`
    // and the closing bracket. Checking the whole file would pass on the import
    // line alone, which is exactly the drift we are trying to catch.
    const block = source.match(/SECTIONS:\s*DsaSection\[\]\s*=\s*\[([\s\S]*?)\]/);
    if (!block) return ['could not find the SECTIONS array in lib/dsa/index.ts'];

    for (const { exportName } of MODULES) {
        if (!new RegExp(`\\b${exportName}\\b`).test(block[1])) {
            errors.push(`section "${exportName}" is not registered in lib/dsa/index.ts SECTIONS`);
        }
    }
    return errors;
}

function checkSections(): string[] {
    const errors: string[] = [];
    const sectionIds = new Set<string>();
    const problemIds = new Map<string, string>(); // id -> section id

    for (const section of SECTIONS) {
        if (!ID_RE.test(section.id)) {
            errors.push(`section id "${section.id}" must match ${ID_RE}`);
        }
        if (sectionIds.has(section.id)) {
            errors.push(`duplicate section id "${section.id}"`);
        }
        sectionIds.add(section.id);

        if (!section.problems.length) {
            errors.push(`section "${section.id}" has no problems`);
        }

        for (const problem of section.problems) {
            const where = `${section.id}/${problem.id}`;

            if (!ID_RE.test(problem.id)) {
                errors.push(
                    `problem id "${problem.id}" (${section.id}) must match ${ID_RE} — it is a Mongo update path segment and a URL segment`
                );
            }

            const seenIn = problemIds.get(problem.id);
            if (seenIn) {
                errors.push(
                    `duplicate problem id "${problem.id}" in "${section.id}" and "${seenIn}" — ids are GLOBAL, because progress is keyed by problem, not by (sheet, problem)`
                );
            }
            problemIds.set(problem.id, section.id);

            if (!problem.title.trim()) errors.push(`${where}: empty title`);
            if (!problem.tags.length) errors.push(`${where}: no tags (the filter chips need them)`);

            // URL shape. We cannot check that the slug RESOLVES without network
            // access, but a malformed or off-platform URL is catchable here.
            let url: URL | null = null;
            try {
                url = new URL(problem.externalUrl);
            } catch {
                errors.push(`${where}: externalUrl is not a valid URL`);
            }
            if (url) {
                if (url.protocol !== 'https:') {
                    errors.push(`${where}: externalUrl must be https`);
                }
                const allowed = PLATFORM_HOSTS[problem.platform];
                if (!allowed) {
                    errors.push(`${where}: unknown platform "${problem.platform}"`);
                } else if (!allowed.some((h) => url!.hostname === h || url!.hostname === `www.${h}`)) {
                    errors.push(
                        `${where}: platform is "${problem.platform}" but host is "${url.hostname}"`
                    );
                }
            }

            if (problem.youtubeVideoId !== undefined) {
                // YouTube ids are exactly 11 chars of [A-Za-z0-9_-]. A value that
                // is not that shape is certainly wrong, and a wrong id embeds a
                // confident video about a different problem.
                if (!/^[A-Za-z0-9_-]{11}$/.test(problem.youtubeVideoId)) {
                    errors.push(
                        `${where}: youtubeVideoId "${problem.youtubeVideoId}" is not an 11-character YouTube id`
                    );
                }
            }
        }
    }

    return errors;
}

function checkApproaches(): string[] {
    const errors: string[] = [];
    const byProblem = new Map<string, string>(); // problem id -> approach file

    const known = new Set<string>();
    for (const section of SECTIONS) {
        for (const problem of section.problems) known.add(problem.id);
    }

    for (const { file, records } of APPROACH_SOURCES) {
        for (const [problemId, approach] of Object.entries(records)) {
            const where = `approaches/${file}: ${problemId}`;

            if (!known.has(problemId)) {
                errors.push(
                    `${where}: no problem with this id exists in the catalogue (renamed or removed?)`
                );
            }

            const seenIn = byProblem.get(problemId);
            if (seenIn) {
                errors.push(
                    `${where}: also defined in approaches/${seenIn} — the merged record would silently keep only one, publishing the wrong explanation`
                );
            }
            byProblem.set(problemId, file);

            if (!approach.restate.trim()) errors.push(`${where}: empty restate`);
            if (approach.body.trim().length < 200) {
                errors.push(`${where}: body is suspiciously short (<200 chars)`);
            }
            if (!approach.complexity.time.trim() || !approach.complexity.space.trim()) {
                errors.push(`${where}: complexity time/space must both be filled in`);
            }

            const langs = new Set(approach.code.map((c) => c.lang));
            for (const lang of REQUIRED_LANGS) {
                if (!langs.has(lang)) errors.push(`${where}: missing a ${lang} solution`);
            }
            if (langs.size !== approach.code.length) {
                errors.push(`${where}: two code blocks share a language`);
            }
            for (const block of approach.code) {
                if (!block.source.trim()) errors.push(`${where}: empty ${block.lang} source`);

                /**
                 * A backtick inside a solution is almost always a TERMINATED
                 * TEMPLATE LITERAL, not intentional content.
                 *
                 * Every `source` is authored as a template literal, so a stray
                 * backtick — typically someone quoting an identifier in a code
                 * comment out of markdown habit — closes the string early and
                 * turns the rest of the file into executable TypeScript. That
                 * already happened once, in the Add Two Numbers C++ comment.
                 *
                 * The dangerous part is that it did NOT fail this script: the
                 * type-stripping loader parsed the mangled file happily and
                 * reported the catalogue as OK. Only `tsc` caught it. None of
                 * C++, Java or the JavaScript we publish needs a backtick, so
                 * rejecting one costs nothing and closes the gap.
                 */
                if (block.source.includes('`')) {
                    errors.push(
                        `${where}: backtick in the ${block.lang} source — it almost certainly closed the template literal early. Use "quotes" in code comments.`
                    );
                }
            }
        }
    }

    return errors;
}

/* ── Run ──────────────────────────────────────────────────────────────────── */

const errors = [...checkRegistry(), ...checkSections(), ...checkApproaches()];

const totalProblems = SECTIONS.reduce((n, s) => n + s.problems.length, 0);
const totalApproaches = APPROACH_SOURCES.reduce(
    (n, s) => n + Object.keys(s.records).length,
    0
);

if (errors.length) {
    console.error(`\n✗ ${errors.length} problem(s) in the DSA catalogue:\n`);
    for (const e of errors) console.error(`  • ${e}`);
    console.error('');
    process.exit(1);
}

console.log(
    `\n✓ DSA catalogue OK — ${SECTIONS.length} sections, ${totalProblems} problems, ${totalApproaches} approaches written (${totalProblems - totalApproaches} still to write).\n`
);
