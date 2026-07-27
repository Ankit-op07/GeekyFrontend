import mongoose, { Schema, Document } from 'mongoose';

/**
 * ─── Email campaign ────────────────────────────────────────────────────────
 *
 * A campaign is a one-off "grant access to a kit + tell everyone about it"
 * broadcast that is too big to send in one day. Gmail caps us at ~400-500
 * messages/day, so the send is spread over several days.
 *
 * The campaign row holds only the SETTINGS. Who has and hasn't been emailed
 * lives in CampaignRecipient — one row per person, so resuming is a fact
 * ("this row's status is pending"), not a guess.
 *
 * WHY NOT REUSE /api/admin/kit-onboarding
 * ---------------------------------------
 * That route decides who still needs an email by asking "has this user set a
 * password yet, and were they emailed in the last 2 days?". Both are proxies,
 * and both break on a multi-day send: a buyer who never clicks the link is
 * re-emailed every third day forever, and a `limit` without a ledger just
 * re-slices the SAME first N buyers on every run. This model exists so
 * "send the next 400" means the next 400 who have never been sent to.
 * ──────────────────────────────────────────────────────────────────────────
 */
export interface IEmailCampaign extends Document {
    /** Stable human key, e.g. "nodejs-kit-access". Unique — one campaign per key. */
    key: string;
    name: string;
    /**
     * The plan name written into CompanyKitUser.purchasedKits when access is
     * granted. MUST be a key of PLAN_TO_SLUGS in lib/appConstants, or the grant
     * resolves to no kit slugs and the user still sees a locked kit.
     */
    grantPlanName: string;
    /**
     * Case-insensitive fragments matched against Order.planName to build the
     * audience, e.g. ["Node.js Interview Preparation Kit", "Node.js Backend"].
     * Legacy and current SKU names both belong here.
     */
    audiencePlanPatterns: string[];
    /** Optional note rendered in a callout inside the email. */
    personalNote?: string;
    /** Max messages per calendar day (IST) across ALL campaigns — the Gmail cap. */
    dailyLimit: number;
    status: 'draft' | 'active' | 'paused' | 'completed';
    /** Set the first time a recipient list is built, for the admin UI. */
    lastBuiltAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const EmailCampaignSchema = new Schema<IEmailCampaign>({
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    grantPlanName: { type: String, required: true },
    audiencePlanPatterns: [{ type: String }],
    personalNote: { type: String },
    dailyLimit: { type: Number, default: 400 },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed'],
        default: 'draft',
    },
    lastBuiltAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.EmailCampaign
    || mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);
