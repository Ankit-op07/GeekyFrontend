import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { buildMembershipRenewalEmail } from '@/lib/email/membership-emails';

/**
 * The membership renewal sweep — "your membership ends in N days".
 *
 * WHY THIS EXISTS: without it memberships lapse SILENTLY. The member simply
 * finds the job board locked one morning with no warning, which reads as the
 * product breaking rather than as a subscription ending, and it is the single
 * easiest renewal to lose.
 *
 * ⚠️ NO NEW CRON. Vercel's Hobby plan allows a maximum of TWO cron jobs and both
 * are already spent (jobs 02:30 UTC, contests 03:00 UTC) — adding a third does
 * not fail at runtime, it REJECTS THE DEPLOYMENT at validation, taking the whole
 * site's next deploy with it. So this piggybacks on the contests cron, which
 * already runs daily and already sends email.
 */

/**
 * Days before expiry that earn a warning.
 *
 * Two, not one: seven days is enough notice to decide, and one day is the nudge
 * that actually converts the people who meant to and forgot. Sending on more
 * days than this turns a useful reminder into nagging, which trains people to
 * filter us.
 *
 * Each threshold is sent AT MOST ONCE per membership term — see the claim below.
 */
const REMINDER_DAYS = [7, 1] as const;

/** Gmail sends slowly and a serverless invocation has a hard ceiling. */
const MAX_EMAILS_PER_RUN = 80;

export interface RenewalReport {
    considered: number;
    sent: number;
    failed: number;
    skipped: number;
}

/**
 * Email members whose access ends within one of the reminder windows.
 *
 * ⚠️ THE CLAIM IS ATOMIC AND KEYED TO THE EXPIRY, NOT THE DATE.
 *
 * `membershipRemindersSent` stores strings like "<expiryMs>:7". Keying on the
 * expiry timestamp is what makes this correct across renewals: when someone
 * renews, their expiry moves, every key changes, and the next term's reminders
 * are eligible again — without any cleanup job, and without a "have they renewed
 * since?" query that would be wrong the moment two renewals landed in one term.
 *
 * The `$ne` in the filter plus `$addToSet` means two overlapping cron runs cannot
 * both claim the same (member, threshold): the loser matches no document. And
 * the claim happens BEFORE the send, so a crash loses a reminder rather than
 * sending it twice — the same trade-off as the contest reminders and
 * recordRedemption, and the right way round for anything touching an inbox.
 */
export async function sendMembershipRenewalReminders(): Promise<RenewalReport> {
    await connectToDatabase();

    const report: RenewalReport = { considered: 0, sent: 0, failed: 0, skipped: 0 };

    if (!process.env.EMAIL_USER || !(process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD)) {
        // Do nothing rather than claim reminders we cannot deliver — a claimed
        // and unsent reminder is silently burned for the whole term.
        return report;
    }

    const now = new Date();
    const maxDays = Math.max(...REMINDER_DAYS);
    const horizon = new Date(now.getTime() + maxDays * 86_400_000);

    // Only ACTIVE memberships inside the widest window. An already-expired
    // membership is not chased here: that is a win-back email, a different
    // message on a different schedule, and sending "ends in 0 days" to someone
    // already locked out is worse than saying nothing.
    const candidates = (await CompanyKitUser.find({
        membershipExpiresAt: { $gt: now, $lte: horizon },
    })
        .select('email name membershipExpiresAt membershipRemindersSent')
        .limit(MAX_EMAILS_PER_RUN * 3)
        .lean()) as {
        _id: unknown;
        email: string;
        name?: string;
        membershipExpiresAt: Date;
        membershipRemindersSent?: string[];
    }[];

    report.considered = candidates.length;
    if (!candidates.length) return report;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
        },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://geekyfrontend.com';
    let sent = 0;

    for (const user of candidates) {
        if (sent >= MAX_EMAILS_PER_RUN) {
            report.skipped += 1;
            continue;
        }
        if (!user.email) {
            report.skipped += 1;
            continue;
        }

        const expiresAt = new Date(user.membershipExpiresAt);
        const msLeft = expiresAt.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / 86_400_000);

        /* Pick the SMALLEST threshold this membership has reached — at 1 day
         * left both 7 and 1 qualify, and the 1-day copy is the correct one. The
         * 7-day key will already have been claimed on an earlier run; if it was
         * not (a missed cron), it simply never sends, which is right: a "7 days
         * left" email that arrives with 1 day left is worse than none. */
        const threshold = [...REMINDER_DAYS].sort((a, b) => a - b).find((d) => daysLeft <= d);
        if (threshold === undefined) {
            report.skipped += 1;
            continue;
        }

        // Keyed to the expiry, so renewing resets eligibility automatically.
        const key = `${expiresAt.getTime()}:${threshold}`;
        if ((user.membershipRemindersSent || []).includes(key)) {
            report.skipped += 1;
            continue;
        }

        // CLAIM FIRST — atomically, and only if nobody else has.
        const won = await CompanyKitUser.updateOne(
            { _id: user._id, membershipRemindersSent: { $ne: key } },
            { $addToSet: { membershipRemindersSent: key } }
        );
        if (!won.modifiedCount) {
            report.skipped += 1;
            continue;
        }

        const { subject, html, text } = buildMembershipRenewalEmail({
            userName: user.name || 'there',
            daysLeft,
            expiresAt,
            membershipUrl: `${baseUrl}/membership`,
        });

        try {
            await transporter.sendMail({
                from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject,
                html,
                text,
            });
            report.sent += 1;
            sent += 1;
        } catch (err: any) {
            report.failed += 1;
            /* The claim is NOT released. A bounce is usually permanent, and
             * releasing it would retry every day until expiry. One lost reminder
             * beats mailing a dead address daily; the failure count surfaces it
             * in the cron response. */
            console.error(`Membership renewal reminder failed for ${user.email}:`, err?.message);
        }
    }

    return report;
}
