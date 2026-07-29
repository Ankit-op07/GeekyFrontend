// scripts/validate-roadmaps.ts
//
//   npm run test:roadmaps
//
// A roadmap node points at lessons by SLUG. Nothing at build time checks that
// those slugs exist, so a typo ships as a node whose drawer shows "0 lessons"
// or a dead link — silently, and only on the one node nobody clicked in review.
// This script is that check.
//
// It verifies, against the live database:
//   1. every `topics` slug exists in the roadmap's own kit
//   2. every `crossKit` slug exists in the kit it names
//   3. node ids are unique per roadmap and safe as a Mongo sub-document key
//      (RoadmapProgress stores them as `nodes.<id>` — a dot or $ would be
//      interpreted as a path)
//
// Read-only. Exits non-zero on any failure.

import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { allNodes, ownKitTopicSlugs, crossKitTopicSlugs } from '../lib/roadmaps/types.ts';
import type { Roadmap } from '../lib/roadmaps/types.ts';

/* ⚠️  This list is imported file-by-file rather than through
 * lib/roadmaps/index.ts on purpose: `node --experimental-strip-types` is a
 * plain ESM loader and cannot resolve the extensionless imports the rest of the
 * repo (and Next) uses. The roadmap modules themselves only `import type`, and
 * type-stripping erases that, so importing them directly works.
 *
 * The trade-off is that this list could drift from the registry, so
 * `checkRegistry()` below re-reads index.ts and fails if any module here is not
 * registered there. */
import { javascriptRoadmap } from '../lib/roadmaps/javascript.ts';
import { reactRoadmap } from '../lib/roadmaps/react.ts';
import { frontendSystemDesignRoadmap } from '../lib/roadmaps/frontend-system-design.ts';
import { angularRoadmap } from '../lib/roadmaps/angular.ts';
import { nodejsRoadmap } from '../lib/roadmaps/nodejs.ts';
import { javaRoadmap } from '../lib/roadmaps/java.ts';
import { devopsRoadmap } from '../lib/roadmaps/devops.ts';

const MODULES: { file: string; exportName: string; roadmap: Roadmap }[] = [
    { file: 'javascript', exportName: 'javascriptRoadmap', roadmap: javascriptRoadmap },
    { file: 'react', exportName: 'reactRoadmap', roadmap: reactRoadmap },
    {
        file: 'frontend-system-design',
        exportName: 'frontendSystemDesignRoadmap',
        roadmap: frontendSystemDesignRoadmap,
    },
    { file: 'angular', exportName: 'angularRoadmap', roadmap: angularRoadmap },
    { file: 'nodejs', exportName: 'nodejsRoadmap', roadmap: nodejsRoadmap },
    { file: 'java', exportName: 'javaRoadmap', roadmap: javaRoadmap },
    { file: 'devops', exportName: 'devopsRoadmap', roadmap: devopsRoadmap },
];

const ROADMAPS = MODULES.map((m) => m.roadmap);

const NODE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;

/** Fail if a roadmap module exists but was never added to the registry. */
function checkRegistry(): string[] {
    const src = readFileSync(new URL('../lib/roadmaps/index.ts', import.meta.url), 'utf8');
    return MODULES.filter((m) => !src.includes(m.exportName)).map(
        (m) => `lib/roadmaps/${m.file}.ts is not registered in lib/roadmaps/index.ts`
    );
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set. Run with the project env loaded.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    const db = mongoose.connection.db!;
    const failures: string[] = checkRegistry();

    // slug -> Set of topic slugs, for every kit any roadmap references.
    const topicsByKit = new Map<string, Set<string>>();
    async function loadKit(kitSlug: string): Promise<Set<string> | null> {
        if (topicsByKit.has(kitSlug)) return topicsByKit.get(kitSlug)!;
        const kit = await db.collection('kits').findOne({ slug: kitSlug });
        if (!kit) return null;
        const topics = await db
            .collection('topics')
            .find({ kitId: kit._id }, { projection: { slug: 1 } })
            .toArray();
        const set = new Set(topics.map((t) => String(t.slug)));
        topicsByKit.set(kitSlug, set);
        return set;
    }

    for (const roadmap of ROADMAPS) {
        const nodes = allNodes(roadmap);
        console.log(
            `\n${roadmap.id.padEnd(24)} ${roadmap.stages.length} stages · ${nodes.length} nodes · kit ${roadmap.kitSlug}`
        );

        // 3. node ids
        const seen = new Set<string>();
        for (const node of nodes) {
            if (!NODE_ID_RE.test(node.id)) {
                failures.push(`${roadmap.id}: node id "${node.id}" is not [a-z0-9-]`);
            }
            if (seen.has(node.id)) {
                failures.push(`${roadmap.id}: duplicate node id "${node.id}"`);
            }
            seen.add(node.id);
        }
        const stageIds = new Set<string>();
        for (const stage of roadmap.stages) {
            if (stageIds.has(stage.id)) failures.push(`${roadmap.id}: duplicate stage id "${stage.id}"`);
            stageIds.add(stage.id);
        }

        // 1. own-kit topics
        const own = await loadKit(roadmap.kitSlug);
        if (!own) {
            failures.push(`${roadmap.id}: kit "${roadmap.kitSlug}" not found in the database`);
        } else {
            const referenced = ownKitTopicSlugs(roadmap);
            const missing = referenced.filter((s) => !own.has(s));
            for (const slug of missing) {
                failures.push(`${roadmap.id}: topic "${slug}" not found in ${roadmap.kitSlug}`);
            }
            const linked = referenced.length - missing.length;
            console.log(
                `  own kit: ${linked}/${referenced.length} slugs resolve · ${own.size} topics exist in the kit`
            );
        }

        // 2. cross-kit topics
        for (const [kitSlug, slugs] of crossKitTopicSlugs(roadmap)) {
            const set = await loadKit(kitSlug);
            if (!set) {
                failures.push(`${roadmap.id}: crossKit kit "${kitSlug}" not found`);
                continue;
            }
            for (const slug of slugs) {
                if (!set.has(slug)) {
                    failures.push(`${roadmap.id}: crossKit topic "${slug}" not found in ${kitSlug}`);
                }
            }
            console.log(`  crossKit ${kitSlug}: ${slugs.size} slugs`);
        }
    }

    await mongoose.disconnect();

    if (failures.length) {
        console.error(`\n✗ ${failures.length} problem(s):`);
        for (const f of failures) console.error(`  - ${f}`);
        process.exit(1);
    }
    console.log('\n✓ every roadmap slug resolves to a real topic.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
