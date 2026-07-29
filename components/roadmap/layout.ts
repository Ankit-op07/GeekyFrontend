// components/roadmap/layout.ts
//
// Turns a roadmap into absolute coordinates. Pure, deterministic and free of
// React or the DOM, so the canvas can render it and a test could assert it.
//
// THE SHAPE
// ---------
// A vertical spine down the middle carries the stages. Each stage's nodes hang
// off a trunk to one side, alternating side per stage so the eye zigzags rather
// than reading one long column:
//
//        ┌───────────┐
//        │  Stage 1  ├──────┬── [node] ── outer column
//        └─────┬─────┘  [node]           ── inner column
//              │            ├── [node]
//              │        [node]
//        ┌─────┴─────┐
//   [node] ──┬───────┤  Stage 2  │
//        [node]      └───────────┘
//
// Two columns only once a stage has more than four nodes — below that the
// single column reads better and keeps the canvas narrow.
//
// Coordinates are normalised at the end so the top-left of the content is
// (PADDING, PADDING) and nothing is negative; the canvas can then treat
// width/height as the scrollable extent.

import type { ApiNode, ApiRoadmap, ApiStage } from './types';

export const NODE_W = 248;
/** Tall enough for a two-line title — the map is usually viewed zoomed out to
 *  fit, where a single truncated line loses too many titles. */
export const NODE_H = 74;
export const STAGE_W = 300;
export const STAGE_H = 78;

const ROW_GAP = 14;
const STAGE_GAP = 72;
/** Distance from the spine (x=0) to the trunk the nodes hang off. */
const TRUNK_1COL = 250;
const TRUNK_2COL = 520;
/** Gap between the trunk and a node's nearest edge — the length of the stub. */
const STUB = 44;
/** Corner radius on the stage → trunk elbow. */
const ELBOW_R = 16;
const PADDING = 48;
/** Above four nodes a stage splits into two columns. */
const TWO_COL_THRESHOLD = 4;

export interface PositionedNode {
    node: ApiNode;
    stageId: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface PositionedStage {
    stage: ApiStage;
    index: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface RoadmapLayout {
    stages: PositionedStage[];
    nodes: PositionedNode[];
    /** SVG path strings for the connectors, in paint order. */
    spine: string[];
    branches: string[];
    stubs: string[];
    width: number;
    height: number;
}

export function layoutRoadmap(roadmap: ApiRoadmap): RoadmapLayout {
    const stages: PositionedStage[] = [];
    const nodes: PositionedNode[] = [];
    const spine: string[] = [];
    const branches: string[] = [];
    const stubs: string[] = [];

    let y = 0;

    roadmap.stages.forEach((stage, index) => {
        const side: 1 | -1 = index % 2 === 0 ? 1 : -1;
        const count = stage.nodes.length;
        const twoCol = count > TWO_COL_THRESHOLD;
        const trunkX = side * (twoCol ? TRUNK_2COL : TRUNK_1COL);

        const stageX = -STAGE_W / 2;
        const stageCy = y + STAGE_H / 2;
        stages.push({ stage, index, x: stageX, y, w: STAGE_W, h: STAGE_H });

        // Row 0 is vertically centred on the stage capsule, so the elbow into
        // the first node is a straight horizontal line.
        const rowTop = y + (STAGE_H - NODE_H) / 2;
        const rows = twoCol ? Math.ceil(count / 2) : count;

        stage.nodes.forEach((node, k) => {
            const isOuter = !twoCol || k % 2 === 0;
            const row = twoCol ? Math.floor(k / 2) : k;
            // Outer = further from the spine; inner sits between trunk and spine.
            const x = isOuter
                ? side > 0
                    ? trunkX + STUB
                    : trunkX - STUB - NODE_W
                : side > 0
                  ? trunkX - STUB - NODE_W
                  : trunkX + STUB;
            const ny = rowTop + row * (NODE_H + ROW_GAP);

            nodes.push({ node, stageId: stage.id, x, y: ny, w: NODE_W, h: NODE_H });

            // Stub: trunk → the node's nearest edge, at the node's mid-height.
            const cy = ny + NODE_H / 2;
            const edgeX = isOuter ? trunkX + side * STUB : trunkX - side * STUB;
            stubs.push(`M ${trunkX} ${cy} L ${edgeX} ${cy}`);
        });

        if (count > 0) {
            const lastRowCy = rowTop + (rows - 1) * (NODE_H + ROW_GAP) + NODE_H / 2;
            const capsuleEdge = side > 0 ? STAGE_W / 2 : -STAGE_W / 2;
            // Out of the capsule, round the corner onto the trunk, then down.
            // When there is only one row the vertical part is zero-length and
            // the quad still renders as a clean horizontal.
            branches.push(
                `M ${capsuleEdge} ${stageCy} ` +
                    `L ${trunkX - side * ELBOW_R} ${stageCy} ` +
                    `Q ${trunkX} ${stageCy} ${trunkX} ${stageCy + ELBOW_R} ` +
                    `L ${trunkX} ${lastRowCy}`
            );
        }

        const blockH = Math.max(STAGE_H, rows * (NODE_H + ROW_GAP) - ROW_GAP);
        const nextY = y + blockH + STAGE_GAP;

        if (index < roadmap.stages.length - 1) {
            spine.push(`M 0 ${y + STAGE_H} L 0 ${nextY}`);
        }

        y = nextY;
    });

    // Normalise: shift everything so the leftmost/topmost content sits at PADDING.
    const xs = [
        ...nodes.map((n) => n.x),
        ...nodes.map((n) => n.x + n.w),
        ...stages.map((s) => s.x),
        ...stages.map((s) => s.x + s.w),
    ];
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 0;
    const dx = PADDING - minX;
    const dy = PADDING;

    const shiftPath = (d: string) =>
        d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a: string, b: string) =>
            `${Number(a) + dx} ${Number(b) + dy}`
        );

    return {
        stages: stages.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy })),
        nodes: nodes.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy })),
        spine: spine.map(shiftPath),
        branches: branches.map(shiftPath),
        stubs: stubs.map(shiftPath),
        width: maxX - minX + PADDING * 2,
        // `y` is already past the final stage's STAGE_GAP, so it doubles as the
        // bottom padding.
        height: y + dy,
    };
}
