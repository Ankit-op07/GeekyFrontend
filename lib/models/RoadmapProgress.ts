import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * RoadmapProgress — a learner's ticks on one roadmap.
 *
 * SHAPE: one document per (user, roadmap), holding a nodeId → status map,
 * rather than one row per node. A roadmap has 30-50 nodes and the canvas needs
 * all of them on every open, so the map is one read and one `$set` per tick
 * instead of a fan-out.
 *
 * ⚠️  `nodes` keys are written into a Mongo update path (`nodes.<id>`). A key
 * containing a dot or `$` would be interpreted as a path or an operator, so the
 * API only ever writes a nodeId it has first matched against the authored
 * roadmap — never a raw value from the request body. `RoadmapNode.id` is
 * additionally constrained to [a-z0-9-] and that is enforced by
 * `npm run test:roadmaps`.
 *
 * `pending` is the absence of a key, never a stored value: un-ticking a node
 * unsets it, so an untouched roadmap costs no storage.
 */

export type RoadmapProgressStatus = 'learning' | 'done' | 'skipped';

export interface IRoadmapProgress extends Document {
    userId: Types.ObjectId;
    roadmapId: string;
    nodes: Record<string, RoadmapProgressStatus>;
    createdAt: Date;
    updatedAt: Date;
}

const RoadmapProgressSchema = new Schema<IRoadmapProgress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'CompanyKitUser', required: true },
        roadmapId: { type: String, required: true },
        // Mixed, not a Map: it is read far more often than written and this
        // serialises straight to JSON for the client.
        nodes: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// One document per user per roadmap. This is also what makes the upsert in
// PUT /api/roadmap/progress safe against two tabs racing.
RoadmapProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export default mongoose.models.RoadmapProgress ||
    mongoose.model<IRoadmapProgress>('RoadmapProgress', RoadmapProgressSchema);
