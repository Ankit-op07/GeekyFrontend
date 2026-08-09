import mongoose, { Schema, Document } from 'mongoose';

/**
 * The job-application pipeline, in order. Stored on the row, so these strings
 * are data — rename one and every existing tracked application falls out of
 * the enum. Append instead.
 *
 * 'saved' is the zero state (bookmarked, not applied). Everything from
 * 'applied' onwards counts as an application in the tracker's summary.
 */
export const JOB_APPLICATION_STATUSES = [
    'saved',
    'applied',
    'interviewing',
    'offer',
    'rejected',
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export interface ICompanyKitUser extends Document {
    email: string;
    name: string;
    googleId?: string;
    profilePicture?: string;
    password?: string;
    mobile?: string;
    planId?: string;
    otp?: string;
    otpExpiry?: Date;
    emailVerified?: boolean;
    mustChangePassword?: boolean;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate?: Date;
    // Daily AI-interview usage counter (cost cap). `date` is an IST YYYY-MM-DD
    // string; `count` resets when the date rolls over. See app/api/interview/start.
    interviewUsage?: { date: string; count: number };
    // Separate daily counter for the (pricier) live voice interview.
    voiceUsage?: { date: string; count: number };
    // Real-time presence (admin Live Users view). Distinct from lastActiveDate,
    // which is a coarse once-per-day streak signal for buyers only. lastSeenAt
    // is bumped on every page view / heartbeat for any logged-in user.
    lastSeenAt?: Date;
    currentPath?: string;
    /**
     * ⚠️ NOT a membership flag, despite the name. recordPurchase() sets this to
     * 'active' on every kit purchase, and six other sites write it too, so
     * essentially every past buyer reads 'active' forever. `subscriptionEndDate`
     * is written and read nowhere at all. Gating anything on these would grant
     * the whole existing customer base free membership — use the membership*
     * fields below, which are the ones with a real expiry. See lib/membership.ts.
     */
    subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'none';
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;

    /* ── Membership (time-limited, whole-platform access) ──────────────────
     * Absent on everyone who has never bought a membership. `membershipExpiresAt`
     * is THE field — a membership is active iff it is set and in the future, so
     * lapsing needs no cron and no status column to drift out of sync.
     * Renewals extend it (computeMembershipExpiry), they do not reset it. */
    membershipExpiresAt?: Date;
    membershipStartedAt?: Date;
    /** The most recent plan bought. Display/support only — never an access key. */
    membershipPlanId?: string;
    /**
     * Renewal reminders already sent, as "<expiryMs>:<daysBefore>".
     *
     * Keyed to the EXPIRY rather than to a date, which is what makes it correct
     * across renewals: renewing moves the expiry, so every key changes and the
     * next term's reminders become eligible again with no cleanup job. See
     * lib/membership-reminders.ts.
     */
    membershipRemindersSent?: string[];

    paymentId?: string;
    orderId?: string;
    purchasedKits: string[];
    completedQuestions: string[];
    favoriteQuestions: string[];
    // Topics the user saved for later, keyed by (kitSlug, topicSlug) — the only
    // pair that uniquely identifies a topic (slugs are unique per kit, not
    // global). title/chapterTitle are denormalized so the dashboard renders the
    // Bookmarks list from a single fetch, without N topic lookups.
    bookmarkedTopics: {
        kitSlug: string;
        topicSlug: string;
        title: string;
        chapterTitle?: string;
        createdAt: Date;
    }[];
    // Jobs saved from the dashboard job board. title/company/applyUrl are
    // DENORMALIZED on purpose: Job rows are a cache of external feeds and expire
    // on a TTL (see lib/models/Job.ts), so a bare reference would leave the
    // user's saved list quietly emptying itself. A saved job stays readable
    // after the listing is gone — the apply link may 404, but that is the
    // employer closing the role, not us deleting someone's bookmark.
    // Doubles as the APPLICATION TRACKER: `status` is what turns a bookmark
    // into a pipeline stage. It lives on the same row rather than in a separate
    // collection because a tracked application is always a saved job — a user
    // never tracks something they haven't first seen on the board, and one
    // array keeps "is this saved?" and "have I applied?" a single read.
    savedJobs: {
        jobId: string;
        title: string;
        company: string;
        applyUrl: string;
        location?: string;
        status: JobApplicationStatus;
        /** Set the first time status becomes 'applied' or later; never cleared,
         *  so moving back to 'saved' by mistake doesn't lose the real date. */
        appliedAt?: Date;
        /** The user's own notes — recruiter name, round dates, comp discussed. */
        notes?: string;
        savedAt: Date;
        updatedAt?: Date;
    }[];
    kitProgress: {
        kitSlug: string;
        completedTopics: string[];
        lastTopicSlug?: string;
        completedCount: number;
        totalTopics: number;
        progressPercent: number;
        updatedAt: Date;
    }[];



    lastOnboardingEmailSentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CompanyKitUserSchema = new Schema<ICompanyKitUser>({
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    googleId: { type: String, index: true }, // NOT unique — multiple users can lack a Google ID
    profilePicture: { type: String },
    password: { type: String },
    mobile: { type: String },
    planId: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    emailVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    interviewUsage: {
        date: { type: String },
        count: { type: Number, default: 0 },
    },
    voiceUsage: {
        date: { type: String },
        count: { type: Number, default: 0 },
    },
    lastSeenAt: { type: Date, index: true },
    currentPath: { type: String },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'none'],
        default: 'none'
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },

    // Indexed: the admin membership view lists active members by expiry, and
    // renewal-reminder queries scan "expiring in the next N days".
    membershipExpiresAt: { type: Date, index: true },
    membershipStartedAt: { type: Date },
    membershipPlanId: { type: String },
    membershipRemindersSent: [{ type: String }],

    paymentId: { type: String },
    orderId: { type: String },
    purchasedKits: [{ type: String }],
    completedQuestions: [{ type: String }],
    favoriteQuestions: [{ type: String }],
    bookmarkedTopics: [{
        kitSlug: { type: String, required: true },
        topicSlug: { type: String, required: true },
        title: { type: String, default: '' },
        chapterTitle: { type: String },
        createdAt: { type: Date, default: Date.now },
    }],
    savedJobs: [{
        jobId: { type: String, required: true },
        title: { type: String, default: '' },
        company: { type: String, default: '' },
        applyUrl: { type: String, default: '' },
        location: { type: String },
        // Defaults to 'saved' so every row written before the tracker existed
        // reads back as a plain bookmark rather than as undefined.
        status: {
            type: String,
            enum: JOB_APPLICATION_STATUSES,
            default: 'saved',
        },
        appliedAt: { type: Date },
        notes: { type: String, default: '' },
        savedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
    }],
    kitProgress: [{
        kitSlug: { type: String, required: true, index: true },
        completedTopics: [{ type: String }],
        lastTopicSlug: { type: String },
        completedCount: { type: Number, default: 0 },
        totalTopics: { type: Number, default: 0 },
        progressPercent: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
    }],
    lastOnboardingEmailSentAt: { type: Date },
}, { timestamps: true });

// Check if subscription is valid
CompanyKitUserSchema.methods.hasActiveSubscription = function (): boolean {
    if (this.subscriptionStatus !== 'active') return false;
    if (!this.subscriptionEndDate) return false;
    return new Date() < this.subscriptionEndDate;
};

export default mongoose.models.CompanyKitUser || mongoose.model<ICompanyKitUser>('CompanyKitUser', CompanyKitUserSchema);
