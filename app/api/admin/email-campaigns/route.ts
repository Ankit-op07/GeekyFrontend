import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import Kit from '@/lib/models/Kit';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import EmailCampaign from '@/lib/models/EmailCampaign';
import CampaignRecipient from '@/lib/models/CampaignRecipient';
import { requireAdmin } from '@/lib/admin-auth';
import { escapeRegex } from '@/lib/escape-regex';
import { getPlanDisplayName, getAllowedSlugs, PLAN_TO_SLUGS } from '@/lib/appConstants';
import { buildKitOnboardingEmail, buildKitLiveEmail, kitEmojiFor } from '@/lib/email/kit-emails';

/**
 * ─── Multi-day email campaign sender ───────────────────────────────────────
 *
 *  Grants a kit to every past buyer of it and emails them about it, in daily
 *  batches that fit under the Gmail sending cap.
 *
 *  THE GUARANTEE
 *  -------------
 *  Every recipient is a row in CampaignRecipient. "Send the next 400" claims
 *  rows whose status is `pending`, flipping each to `sending` in one atomic
 *  findOneAndUpdate before the mail goes out. So:
 *    · a row can only ever be claimed by one batch (no duplicate emails, even
 *      if you double-click Send or two tabs run at once);
 *    · tomorrow's run continues from where today's stopped, because "done" is
 *      recorded per person rather than inferred from a counter or a date;
 *    · re-building the audience later adds only genuinely new buyers — the
 *      unique (campaignId, email) index absorbs everyone already in the list.
 *
 *  WHY BATCHES ARE SMALL
 *  ---------------------
 *  One SMTP send is ~0.5-1s, so 400 in a single request would run for minutes
 *  and be killed by the platform mid-flight. The client calls send-batch
 *  repeatedly (default 25 per call) and the ledger makes that loop safe to
 *  interrupt at any point — closing the tab loses nothing but the remainder of
 *  the current batch.
 * ──────────────────────────────────────────────────────────────────────────
 */

// A batch is sized to finish comfortably inside this.
export const maxDuration = 60;

/** Rows stuck in `sending` this long are assumed to be from a killed request. */
const STALE_CLAIM_MINUTES = 30;
const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 50;
/** Pause between sends so Gmail doesn't rate-limit the burst. */
const INTER_SEND_DELAY_MS = 150;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Start of the current day in IST, as a UTC Date. The Gmail quota resets on a
 * daily boundary and the admin sending these lives in IST, so "sent today" has
 * to mean the IST day — not the server's UTC day, which would roll over at
 * 5:30am local and silently hand back a fresh 400-message allowance mid-run.
 */
function startOfIstDay(now: Date = new Date()): Date {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    ist.setUTCHours(0, 0, 0, 0);
    return new Date(ist.getTime() - IST_OFFSET_MS);
}

const createTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
        },
    });

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || 'https://geekyfrontend.com';

interface CampaignStats {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    skipped: number;
    total: number;
    /** Messages sent today across ALL campaigns — the Gmail cap is per account. */
    sentToday: number;
}

/** Per-status counts for one campaign, plus today's global send total. */
async function getCampaignStats(campaignId: unknown): Promise<CampaignStats> {
    const [byStatus, sentToday] = await Promise.all([
        CampaignRecipient.aggregate([
            { $match: { campaignId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Counted across ALL campaigns: the daily cap belongs to the Gmail
        // account, not to one campaign.
        CampaignRecipient.countDocuments({ sentAt: { $gte: startOfIstDay() } }),
    ]);

    const counts = { pending: 0, sending: 0, sent: 0, failed: 0, skipped: 0 };
    for (const row of byStatus) {
        if (row._id in counts) counts[row._id as keyof typeof counts] = row.count;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return { ...counts, total, sentToday };
}

/**
 * The DB kit slug this plan unlocks, for deep-linking the email.
 * Returns null if nothing matches — the caller falls back to /dashboard.
 */
async function resolveKitSlug(grantPlanName: string): Promise<string | null> {
    const fragments = [...getAllowedSlugs([grantPlanName])];
    if (fragments.length === 0) return null;

    const kit = await Kit.findOne({
        slug: { $regex: fragments.map(escapeRegex).join('|'), $options: 'i' },
    }).select('slug').lean() as { slug: string } | null;

    return kit?.slug || null;
}

// ─────────────────────────────────────────────────────────────
// GET — campaign list, or one campaign with stats + recipients
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const statusFilter = searchParams.get('recipientStatus');

        if (!id) {
            const campaigns = await EmailCampaign.find().sort({ createdAt: -1 }).lean();
            const withStats = await Promise.all(
                campaigns.map(async (c: any) => ({ ...c, stats: await getCampaignStats(c._id) }))
            );
            return NextResponse.json({ campaigns: withStats });
        }

        const campaign = await EmailCampaign.findById(id).lean() as any;
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const stats = await getCampaignStats(campaign._id);
        // Only ever a sample — a campaign can hold thousands of rows and the
        // admin screen shows counts, not the whole list.
        const recipients = await CampaignRecipient.find({
            campaignId: campaign._id,
            ...(statusFilter ? { status: statusFilter } : {}),
        })
            .sort({ updatedAt: -1 })
            .limit(100)
            .select('email status variant attempts lastError sentAt sourcePlanName')
            .lean();

        return NextResponse.json({ campaign, stats, recipients });
    } catch (error: any) {
        console.error('[email-campaigns GET] ❌', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────
// POST — create / build / send-batch / requeue-failed / update / test
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'create': return createCampaign(body);
            case 'update': return updateCampaign(body);
            case 'build': return buildAudience(body);
            case 'send-batch': return sendBatch(body);
            case 'requeue-failed': return requeueFailed(body);
            case 'send-test': return sendTest(body);
            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[email-campaigns POST] ❌', error.message, error.stack);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── create ───────────────────────────────────────────────────
async function createCampaign(body: any) {
    const { key, name, grantPlanName, audiencePlanPatterns, personalNote, dailyLimit } = body;

    if (!key || !name || !grantPlanName) {
        return NextResponse.json({ error: 'key, name and grantPlanName are required' }, { status: 400 });
    }

    // A grant plan name that isn't in PLAN_TO_SLUGS writes a string into
    // purchasedKits that getAllowedSlugs() will never map to a kit — access
    // that looks granted in the DB but leaves the learner locked out.
    if (!PLAN_TO_SLUGS[grantPlanName]) {
        return NextResponse.json({
            error: `"${grantPlanName}" is not a key of PLAN_TO_SLUGS, so granting it would unlock nothing. Valid: ${Object.keys(PLAN_TO_SLUGS).join(' | ')}`,
        }, { status: 400 });
    }

    const existing = await EmailCampaign.findOne({ key });
    if (existing) {
        return NextResponse.json({ error: `Campaign "${key}" already exists`, campaign: existing }, { status: 409 });
    }

    const campaign = await EmailCampaign.create({
        key,
        name,
        grantPlanName,
        audiencePlanPatterns: Array.isArray(audiencePlanPatterns) ? audiencePlanPatterns : [],
        personalNote,
        dailyLimit: Number(dailyLimit) > 0 ? Number(dailyLimit) : 400,
        status: 'draft',
    });

    return NextResponse.json({ success: true, campaign });
}

// ── update settings ──────────────────────────────────────────
async function updateCampaign(body: any) {
    const { campaignId, personalNote, dailyLimit, status, audiencePlanPatterns } = body;
    if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (personalNote !== undefined) update.personalNote = personalNote;
    if (dailyLimit !== undefined && Number(dailyLimit) > 0) update.dailyLimit = Number(dailyLimit);
    if (status && ['draft', 'active', 'paused', 'completed'].includes(status)) update.status = status;
    if (Array.isArray(audiencePlanPatterns)) update.audiencePlanPatterns = audiencePlanPatterns;

    const campaign = await EmailCampaign.findByIdAndUpdate(campaignId, { $set: update }, { new: true });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    return NextResponse.json({ success: true, campaign });
}

// ── build audience from Orders ───────────────────────────────
/**
 * Idempotent. Uses $setOnInsert only, so re-running after a partial send never
 * resets anyone's status — it just appends buyers who appeared since.
 * `dryRun` returns what WOULD be added without writing.
 */
async function buildAudience(body: any) {
    const { campaignId, dryRun } = body;
    if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const patterns: string[] = campaign.audiencePlanPatterns || [];
    if (patterns.length === 0) {
        return NextResponse.json({ error: 'Campaign has no audiencePlanPatterns to match against Order.planName' }, { status: 400 });
    }

    const orders = await Order.find({
        status: 'email_sent',
        planName: { $regex: patterns.map(escapeRegex).join('|'), $options: 'i' },
    })
        .sort({ createdAt: 1 })
        .select('email planName')
        .lean() as Array<{ email: string; planName: string }>;

    // Dedupe by address — one person, one email, however many times they bought.
    const unique = new Map<string, string>();
    for (const o of orders) {
        const email = (o.email || '').trim().toLowerCase();
        if (!email || !isValidEmail(email)) continue;
        if (!unique.has(email)) unique.set(email, o.planName);
    }

    const existing = await CampaignRecipient.find({ campaignId: campaign._id })
        .select('email').lean() as Array<{ email: string }>;
    const existingSet = new Set(existing.map(r => r.email));
    const toAdd = [...unique.entries()].filter(([email]) => !existingSet.has(email));

    if (dryRun) {
        return NextResponse.json({
            success: true,
            dryRun: true,
            ordersMatched: orders.length,
            uniqueBuyers: unique.size,
            alreadyInCampaign: existingSet.size,
            wouldAdd: toAdd.length,
            sample: toAdd.slice(0, 20).map(([email]) => email),
        });
    }

    if (toAdd.length > 0) {
        await CampaignRecipient.bulkWrite(
            toAdd.map(([email, planName]) => ({
                updateOne: {
                    filter: { campaignId: campaign._id, email },
                    update: { $setOnInsert: { campaignId: campaign._id, email, sourcePlanName: planName, status: 'pending' } },
                    upsert: true,
                },
            })),
            { ordered: false }
        );
    }

    campaign.lastBuiltAt = new Date();
    if (campaign.status === 'draft') campaign.status = 'active';
    await campaign.save();

    const stats = await getCampaignStats(campaign._id);
    return NextResponse.json({
        success: true,
        ordersMatched: orders.length,
        uniqueBuyers: unique.size,
        added: toAdd.length,
        alreadyInCampaign: existingSet.size,
        stats,
    });
}

// ── send one batch ───────────────────────────────────────────
async function sendBatch(body: any) {
    const { campaignId, batchSize: rawBatchSize } = body;
    if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.status === 'paused') {
        return NextResponse.json({ error: 'Campaign is paused. Resume it before sending.' }, { status: 400 });
    }

    // Recover rows abandoned by a request that was killed mid-batch. The
    // trade-off is deliberate: a tiny risk of one duplicate beats stranding
    // someone in `sending` forever.
    const staleCutoff = new Date(Date.now() - STALE_CLAIM_MINUTES * 60 * 1000);
    const recovered = await CampaignRecipient.updateMany(
        { campaignId: campaign._id, status: 'sending', claimedAt: { $lt: staleCutoff } },
        { $set: { status: 'pending' } }
    );
    if (recovered.modifiedCount > 0) {
        console.warn(`[email-campaigns] Requeued ${recovered.modifiedCount} stale claim(s)`);
    }

    // Daily budget — counted across every campaign, since the cap is the
    // sending account's, and clamped so a big batchSize can't overshoot it.
    const sentToday = await CampaignRecipient.countDocuments({ sentAt: { $gte: startOfIstDay() } });
    const allowance = Math.max(0, campaign.dailyLimit - sentToday);

    if (allowance === 0) {
        const stats = await getCampaignStats(campaign._id);
        return NextResponse.json({
            success: true,
            dailyCapReached: true,
            message: `Daily cap of ${campaign.dailyLimit} reached (${sentToday} sent today). Continue tomorrow — the remaining ${stats.pending} recipients stay queued.`,
            processed: 0, sent: 0, failed: 0, skipped: 0,
            stats,
        });
    }

    const requested = Number(rawBatchSize) > 0 ? Number(rawBatchSize) : DEFAULT_BATCH_SIZE;
    const batchSize = Math.min(requested, MAX_BATCH_SIZE, allowance);

    const transporter = createTransporter();
    const jwtSecret = process.env.JWT_SECRET || 'secret_key';
    const url = baseUrl();
    const displayKitName = getPlanDisplayName(campaign.grantPlanName);
    const kitSlug = await resolveKitSlug(campaign.grantPlanName);
    const kitUrl = kitSlug ? `${url}/learn/${kitSlug}` : `${url}/dashboard`;

    let sent = 0, failed = 0, skipped = 0, processed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (let i = 0; i < batchSize; i++) {
        // Atomic claim: pending → sending. Two concurrent batches can never
        // pick up the same row, so nobody gets two emails.
        const recipient = await CampaignRecipient.findOneAndUpdate(
            { campaignId: campaign._id, status: 'pending' },
            { $set: { status: 'sending', claimedAt: new Date() }, $inc: { attempts: 1 } },
            { sort: { createdAt: 1 }, new: true }
        );
        if (!recipient) break; // queue empty

        processed++;
        const email = recipient.email;

        if (!isValidEmail(email)) {
            recipient.status = 'skipped';
            recipient.lastError = 'Invalid email address';
            await recipient.save();
            skipped++;
            continue;
        }

        try {
            // 1️⃣ Grant access first. If the email later fails, the buyer still
            //    has what they paid for and the retry only re-sends the mail.
            const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
            const user = await CompanyKitUser.findOneAndUpdate(
                { email },
                {
                    $setOnInsert: {
                        name: nameFromEmail,
                        email,
                        emailVerified: true,
                        mustChangePassword: true,
                    },
                    $set: { subscriptionStatus: 'active' },
                    $addToSet: { purchasedKits: campaign.grantPlanName },
                },
                { upsert: true, new: true }
            );
            recipient.accessGranted = true;

            // 2️⃣ Pick the body. Existing password → don't send a set-password
            //    link; that reads as an account-reset (or a phish) to someone
            //    who already logs in fine.
            const hasPassword = !!user.password && !user.mustChangePassword;
            const variant: 'set-password' | 'login' = hasPassword ? 'login' : 'set-password';
            recipient.variant = variant;

            let html: string;
            let subject: string;

            if (variant === 'login') {
                html = buildKitLiveEmail({
                    recipientEmail: email,
                    recipientName: user.name || nameFromEmail,
                    kitName: displayKitName,
                    kitUrl,
                    personalNote: campaign.personalNote || undefined,
                });
                subject = `${kitEmojiFor(displayKitName)} Your ${displayKitName} is now live on Geeky Frontend`;
            } else {
                const token = jwt.sign(
                    { id: user._id.toString(), type: 'set-password' },
                    jwtSecret,
                    { expiresIn: '7d' }
                );
                html = buildKitOnboardingEmail({
                    recipientEmail: email,
                    recipientName: user.name || nameFromEmail,
                    kitName: displayKitName,
                    setPasswordLink: `${url}/reset-password?token=${token}`,
                    personalNote: campaign.personalNote || undefined,
                });
                subject = `🎉 Welcome to Geeky Frontend — Your ${displayKitName} Access is Ready!`;
            }

            await transporter.sendMail({
                from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                html,
            });

            recipient.status = 'sent';
            recipient.sentAt = new Date();
            recipient.lastError = undefined;
            await recipient.save();

            // Keep the older kit-onboarding screen's "recently emailed" filter
            // honest about mail this campaign sent.
            await CompanyKitUser.updateOne({ email }, { $set: { lastOnboardingEmailSentAt: new Date() } });

            sent++;
        } catch (err: any) {
            recipient.status = 'failed';
            recipient.lastError = err?.message?.slice(0, 500) || 'Unknown error';
            await recipient.save();
            failed++;
            errors.push({ email, error: recipient.lastError as string });
            console.error(`[email-campaigns] ❌ ${email}: ${recipient.lastError}`);
        }

        if (i < batchSize - 1) await new Promise(r => setTimeout(r, INTER_SEND_DELAY_MS));
    }

    const stats = await getCampaignStats(campaign._id);

    // Nothing left anywhere → close the campaign out.
    if (stats.pending === 0 && stats.sending === 0 && stats.total > 0 && campaign.status === 'active') {
        campaign.status = 'completed';
        await campaign.save();
    }

    return NextResponse.json({
        success: true,
        processed, sent, failed, skipped,
        errors: errors.length > 0 ? errors : undefined,
        allowanceRemaining: Math.max(0, campaign.dailyLimit - stats.sentToday),
        dailyCapReached: stats.sentToday >= campaign.dailyLimit,
        queueEmpty: stats.pending === 0,
        campaignStatus: campaign.status,
        stats,
    });
}

// ── requeue failures ─────────────────────────────────────────
async function requeueFailed(body: any) {
    const { campaignId } = body;
    if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const result = await CampaignRecipient.updateMany(
        { campaignId: campaign._id, status: 'failed' },
        { $set: { status: 'pending' }, $unset: { lastError: '' } }
    );

    // Re-open a campaign that had been closed out, so the queue can drain again.
    if (campaign.status === 'completed' && result.modifiedCount > 0) {
        campaign.status = 'active';
        await campaign.save();
    }

    // NOTE: getCampaignStats aggregates, and $match does NOT cast strings to
    // ObjectId the way a query filter does — always pass campaign._id, never
    // the raw campaignId string from the request body.
    const stats = await getCampaignStats(campaign._id);
    return NextResponse.json({ success: true, requeued: result.modifiedCount, stats });
}

// ── test send ────────────────────────────────────────────────
/**
 * Renders and sends the real templates to the given addresses WITHOUT touching
 * the ledger, granting access, or consuming campaign progress. It does count
 * against the Gmail daily quota, which is why it isn't wired into the batch
 * counter — keep test sends to a handful.
 */
async function sendTest(body: any) {
    const { campaignId, emails } = body;
    if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });

    const list: string[] = (Array.isArray(emails) ? emails : [])
        .map((e: string) => e.trim().toLowerCase())
        .filter((e: string) => isValidEmail(e));
    if (list.length === 0) {
        return NextResponse.json({ error: 'Provide at least one valid test email' }, { status: 400 });
    }

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const transporter = createTransporter();
    const url = baseUrl();
    const displayKitName = getPlanDisplayName(campaign.grantPlanName);
    const kitSlug = await resolveKitSlug(campaign.grantPlanName);
    const kitUrl = kitSlug ? `${url}/learn/${kitSlug}` : `${url}/dashboard`;

    const results: Array<{ email: string; variant: string; success: boolean; error?: string }> = [];

    for (const email of list) {
        // Mirror the real variant choice so the test shows what that person
        // would actually receive.
        const user = await CompanyKitUser.findOne({ email }).select('name password mustChangePassword').lean() as any;
        const hasPassword = !!user?.password && !user?.mustChangePassword;
        const variant = hasPassword ? 'login' : 'set-password';
        const name = user?.name || email.split('@')[0].replace(/[._-]/g, ' ');

        try {
            const html = variant === 'login'
                ? buildKitLiveEmail({ recipientEmail: email, recipientName: name, kitName: displayKitName, kitUrl, personalNote: campaign.personalNote || undefined })
                : buildKitOnboardingEmail({
                    recipientEmail: email,
                    recipientName: name,
                    kitName: displayKitName,
                    // No account is created for a test, so there is no real
                    // token to sign — the link is inert on purpose.
                    setPasswordLink: `${url}/reset-password?token=TEST_PREVIEW_LINK`,
                    personalNote: campaign.personalNote || undefined,
                });

            await transporter.sendMail({
                from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `[TEST · ${variant}] ${displayKitName} — Geeky Frontend`,
                html,
            });
            results.push({ email, variant, success: true });
        } catch (err: any) {
            results.push({ email, variant, success: false, error: err.message });
        }
        await new Promise(r => setTimeout(r, INTER_SEND_DELAY_MS));
    }

    return NextResponse.json({
        success: true,
        message: 'Test emails sent. No access granted, no campaign progress consumed.',
        results,
    });
}
