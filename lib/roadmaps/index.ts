// lib/roadmaps/index.ts
//
// The roadmap registry. Adding a roadmap = write lib/roadmaps/<id>.ts and add
// it to ROADMAPS below; the picker, the API and the slug test all read from
// here, so there is no second place to register it.

import type { Roadmap } from './types';
import { javascriptRoadmap } from './javascript';
import { reactRoadmap } from './react';
import { frontendSystemDesignRoadmap } from './frontend-system-design';
import { angularRoadmap } from './angular';
import { nodejsRoadmap } from './nodejs';
import { javaRoadmap } from './java';
import { devopsRoadmap } from './devops';

/**
 * Display order on the picker. Roughly "most people start here" first — it is
 * not a difficulty ranking and nothing depends on it beyond the grid order.
 */
export const ROADMAPS: Roadmap[] = [
    javascriptRoadmap,
    reactRoadmap,
    frontendSystemDesignRoadmap,
    angularRoadmap,
    nodejsRoadmap,
    javaRoadmap,
    devopsRoadmap,
];

const BY_ID = new Map(ROADMAPS.map((r) => [r.id, r]));

export function getRoadmap(id: string): Roadmap | null {
    return BY_ID.get(id) ?? null;
}

export * from './types';
