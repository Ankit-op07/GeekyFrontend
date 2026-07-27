import mongoose, { Schema, Document } from 'mongoose';

/**
 * ─── Campaign recipient ────────────────────────────────────────────────────
 *
 * One row per (campaign, email). This is the ledger that makes a multi-day
 * send safe: "send the next 400" claims the next 400 rows whose status is
 * still `pending`, so nobody is ever emailed twice and nobody is skipped.
 *
 * STATUS LIFECYCLE
 *   pending  → nobody has emailed this person yet (the queue)
 *   sending  → claimed by an in-flight batch; see the stale-claim note below
 *   sent     → the SMTP send resolved. Terminal. Never re-sent.
 *   failed   → the send threw. Stays out of the queue until explicitly requeued
 *              from the admin UI, so one bad address can't stall the run.
 *   skipped  → deliberately excluded (invalid address).
 *
 * The `sending` state is what protects against a double-click on "Send next
 * 400" or two admins sending at once: claiming flips pending→sending in a
 * single atomic findOneAndUpdate, so a row can only ever be claimed once.
 *
 * A row can get stranded in `sending` if the serverless function is killed
 * mid-batch. Those are auto-requeued after STALE_CLAIM_MINUTES (see the route),
 * which is a deliberate trade: re-sending one duplicate is better than silently
 * dropping someone from the campaign forever.
 *
 * The unique (campaignId, email) index is the real guarantee — rebuilding the
 * audience later can never duplicate a person who was already emailed.
 * ──────────────────────────────────────────────────────────────────────────
 */
export type CampaignRecipientStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

export interface ICampaignRecipient extends Document {
    campaignId: mongoose.Types.ObjectId;
    /** Always lowercased+trimmed — it is half of the uniqueness guarantee. */
    email: string;
    /** Order.planName this address was found under, for audit. */
    sourcePlanName?: string;
    status: CampaignRecipientStatus;
    /**
     * Which email body was used. Decided at send time, not build time, because
     * a user may create their account between the build and the send.
     *   set-password → account is new or has never set a password
     *   login        → account already has a password; no set-password step
     */
    variant?: 'set-password' | 'login';
    /** True once the kit was added to purchasedKits (independent of email success). */
    accessGranted: boolean;
    attempts: number;
    lastError?: string;
    claimedAt?: Date;
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignRecipientSchema = new Schema<ICampaignRecipient>({
    campaignId: { type: Schema.Types.ObjectId, ref: 'EmailCampaign', required: true, index: true },
    email: { type: String, required: true },
    sourcePlanName: { type: String },
    status: {
        type: String,
        enum: ['pending', 'sending', 'sent', 'failed', 'skipped'],
        default: 'pending',
    },
    variant: { type: String, enum: ['set-password', 'login'] },
    accessGranted: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    claimedAt: { type: Date },
    sentAt: { type: Date },
}, { timestamps: true });

// The no-duplicates guarantee. Rebuilding the audience upserts against this.
CampaignRecipientSchema.index({ campaignId: 1, email: 1 }, { unique: true });
// Claiming the next pending row, in a stable order.
CampaignRecipientSchema.index({ campaignId: 1, status: 1, createdAt: 1 });
// Counting today's sends across every campaign (the Gmail daily cap).
CampaignRecipientSchema.index({ sentAt: 1 });

export default mongoose.models.CampaignRecipient
    || mongoose.model<ICampaignRecipient>('CampaignRecipient', CampaignRecipientSchema);
