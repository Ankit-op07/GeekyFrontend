// components/roadmap/types.ts
//
// The shapes the roadmap APIs actually return, which are NOT the authored
// shapes in lib/roadmaps/types.ts: the server resolves `topics` (slugs) into
// `lessons` (title + lock state) and folds in this user's progress. The client
// never sees a bare slug.

export type NodeStatus = 'pending' | 'learning' | 'done' | 'skipped';
export type NodeTier = 'beginner' | 'intermediate' | 'advanced';
export type NodeKind = 'core' | 'optional' | 'practice';

export interface ApiLesson {
    slug: string;
    title: string;
    /** False → behind the paywall for this user; render a lock, not a link. */
    canRead: boolean;
    kitSlug: string;
    kitName: string;
}

export interface ApiRef {
    title: string;
    url: string;
    source?: string;
    videoId?: string;
    channel?: string;
}

export interface ApiNode {
    id: string;
    title: string;
    summary: string;
    tier: NodeTier;
    kind: NodeKind;
    est: string | null;
    external: ApiRef[];
    interview: string[];
    build: string | null;
    lessons: ApiLesson[];
    hasLockedLesson: boolean;
    status: NodeStatus;
}

export interface ApiStage {
    id: string;
    title: string;
    goal: string;
    nodes: ApiNode[];
}

export interface ApiRoadmap {
    id: string;
    kitSlug: string;
    kitName: string;
    title: string;
    tagline: string;
    audience: string;
    weeks: number;
    accent: { from: string; to: string };
    /** Has this user bought the roadmap's own kit? */
    hasAccess: boolean;
    stages: ApiStage[];
}

export interface ApiRoadmapSummary {
    id: string;
    kitSlug: string;
    title: string;
    tagline: string;
    audience: string;
    weeks: number;
    accent: { from: string; to: string };
    stageCount: number;
    nodeCount: number;
    hasAccess: boolean;
    doneCount: number;
}
