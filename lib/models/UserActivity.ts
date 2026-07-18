import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * UserActivity — a lightweight behaviour log for the admin "Live Users" view.
 *
 * One row per meaningful action by a logged-in user: a page view (written by
 * POST /api/presence) or a key server event (quiz_attempt / purchase, written
 * via lib/activity.ts). Heartbeats do NOT write here — they only bump
 * CompanyKitUser.lastSeenAt.
 *
 * The collection self-prunes: a TTL index expires rows 30 days after createdAt,
 * so the behaviour log can never grow unbounded.
 */

export type ActivityEvent = 'pageview' | 'quiz_attempt' | 'purchase';

export interface IUserActivity extends Document {
    userId: Types.ObjectId;
    email: string;
    name: string;
    path: string;
    event: ActivityEvent;
    meta?: Record<string, unknown>;
    createdAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
    userId: { type: Schema.Types.ObjectId, ref: 'CompanyKitUser', required: true },
    email: { type: String, required: true },
    name: { type: String, default: '' },
    path: { type: String, default: '' },
    event: {
        type: String,
        enum: ['pageview', 'quiz_attempt', 'purchase'],
        default: 'pageview',
    },
    meta: { type: Schema.Types.Mixed },
    // Not using { timestamps: true } — we only need createdAt, and it also
    // carries the TTL index below.
    createdAt: { type: Date, default: Date.now },
});

// Per-user timeline query (newest first) for the behaviour drawer.
UserActivitySchema.index({ userId: 1, createdAt: -1 });
// TTL: expire rows 30 days after they are written.
UserActivitySchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.models.UserActivity ||
    mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
