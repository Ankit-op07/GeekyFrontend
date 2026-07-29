// lib/roadmaps/types.ts
//
// Shapes for the hand-authored interview roadmaps rendered at
// /dashboard?tab=roadmap. See lib/roadmaps/index.ts for the registry and
// lib/roadmaps/<id>.ts for the authored content.
//
// WHY HAND-AUTHORED (and not generated from chapters)
// ---------------------------------------------------
// A roadmap is not a table of contents. The kit's chapter order is the order we
// chose to *write* the lessons in; a roadmap is the order a learner should
// *study* them in, and it has to include things the kit deliberately does not
// cover (git, DSA fundamentals, "learn HTTP before you learn fetch"). A node
// therefore points AT kit topics rather than being one, and a node with no kit
// topics at all is legitimate — it sends the learner to a free external source.
//
// The rule for authoring: every slug in `topics` MUST exist in the roadmap's
// kit. `npm run test:roadmaps` checks this against the database — a typo'd slug
// would otherwise render as a dead link in the drawer.

/** How hard the node is, which drives its colour band and the "start here" tier filter. */
export type RoadmapTier = 'beginner' | 'intermediate' | 'advanced';

/**
 * What kind of work the node is.
 *  - `core`     — you cannot skip it and claim to know the subject.
 *  - `optional` — good to know; rendered with a dashed border so a learner in a
 *                 hurry can visibly skip it. Never gate a `core` node behind one.
 *  - `practice` — build/solve something rather than read something.
 */
export type RoadmapNodeKind = 'core' | 'optional' | 'practice';

/** A learner-set marker. `pending` is the absence of a row, never stored. */
export type RoadmapNodeStatus = 'pending' | 'learning' | 'done' | 'skipped';

/** An off-platform link (docs, spec, article, video). */
export interface RoadmapRef {
    title: string;
    url: string;
    /** Display source, e.g. "react.dev". Derived from the hostname when omitted. */
    source?: string;
}

/** Lessons in a kit OTHER than the roadmap's own kit (e.g. React → the JS kit). */
export interface RoadmapCrossKit {
    kitSlug: string;
    topics: string[];
}

export interface RoadmapNode {
    /**
     * Stable id, unique within the roadmap. This is the key progress is stored
     * under, so renaming one silently resets every learner's tick for that node
     * — change the `title` instead.
     *
     * Must be [a-z0-9-] only: it is used as a MongoDB sub-document key
     * (`nodes.<id>`), and dots or `$` would be interpreted as a path.
     */
    id: string;
    title: string;
    /** One or two sentences: what it is and why an interviewer cares. */
    summary: string;
    tier: RoadmapTier;
    kind?: RoadmapNodeKind;
    /** Rough focused study time, e.g. "2h". Displayed, never summed into a promise. */
    est?: string;
    /** Topic slugs in THIS roadmap's kit. Validated against the DB by the test. */
    topics?: string[];
    /** Lessons from another kit, shown with that kit's own lock state. */
    crossKit?: RoadmapCrossKit[];
    /**
     * Extra free sources. Curated references already attached to a node's
     * `topics` come from lib/topic-references.ts automatically — only add links
     * here that those don't already cover (or for a node with no kit topics).
     */
    external?: RoadmapRef[];
    /** Questions the learner should be able to answer before ticking this off. */
    interview?: string[];
    /** A concrete thing to build/do. The honest version of "practice". */
    build?: string;
}

export interface RoadmapStage {
    id: string;
    title: string;
    /** What the learner can DO once the stage is finished — not a topic list. */
    goal: string;
    nodes: RoadmapNode[];
}

export interface Roadmap {
    /** URL id, e.g. "react" → /dashboard?tab=roadmap&r=react */
    id: string;
    /** DB Kit.slug this roadmap's `topics` resolve against. */
    kitSlug: string;
    title: string;
    /** One line under the title. */
    tagline: string;
    /** Who it is for — shown on the picker card. */
    audience: string;
    /** Honest plan length at ~1-2 focused hours a day. */
    weeks: number;
    /** Tailwind gradient stops for the picker card + canvas accents. */
    accent: { from: string; to: string };
    stages: RoadmapStage[];
}

/* ── Derived helpers (pure, used by both the API and the client) ───────────── */

/** Every node in stage order. */
export function allNodes(roadmap: Roadmap): RoadmapNode[] {
    return roadmap.stages.flatMap((s) => s.nodes);
}

/** Every topic slug the roadmap points at in its OWN kit, de-duplicated. */
export function ownKitTopicSlugs(roadmap: Roadmap): string[] {
    const set = new Set<string>();
    for (const node of allNodes(roadmap)) for (const slug of node.topics ?? []) set.add(slug);
    return [...set];
}

/** Topic slugs the roadmap points at in other kits, grouped by kit slug. */
export function crossKitTopicSlugs(roadmap: Roadmap): Map<string, Set<string>> {
    const byKit = new Map<string, Set<string>>();
    for (const node of allNodes(roadmap)) {
        for (const ref of node.crossKit ?? []) {
            const set = byKit.get(ref.kitSlug) ?? new Set<string>();
            for (const slug of ref.topics) set.add(slug);
            byKit.set(ref.kitSlug, set);
        }
    }
    return byKit;
}
