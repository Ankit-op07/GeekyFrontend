// lib/contests/reminders.ts
//
// The morning-of reminder sweep, run from the contests cron.

import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import ContestPlan from '@/lib/models/ContestPlan';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { buildContestReminderEmail, type ContestReminderItem } from '@/lib/email/contest-emails';
import { isMembershipActive } from '@/lib/membership';

/**
 * How far ahead a contest counts as "today" for the reminder.
 *
 * The cron runs once daily, so the window must be at least 24 hours or a
 * contest scheduled between two runs would never be mailed at all. 30 gives a
 * safety margin for a late or skipped invocation — better a reminder that
 * arrives a few hours early than one that never arrives.
 */
const WINDOW_HOURS = 30;

/** Gmail sends slowly and a serverless invocation has a hard ceiling. Cap the
 *  batch so the run always finishes; the rest are picked up next time, because
 *  an unsent plan keeps matching the query. */
const MAX_EMAILS_PER_RUN = 60;

export interface ReminderReport {
    considered: number;
    sent: number;
    failed: number;
    skipped: number;
}

function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
        },
    });
}

/**
 * Email everyone whose planned contest starts within the window.
 *
 * ⚠️  EXACTLY ONE WRITER, AND THE CLAIM IS ATOMIC. Each plan is claimed with a
 * findOneAndUpdate matching `reminderSentAt: { $exists: false }` and setting it
 * BEFORE the mail is attempted. Two overlapping cron invocations therefore
 * cannot both claim the same plan — the loser matches nothing.
 *
 * That ordering means a crash between the claim and the send loses a reminder
 * rather than sending it twice, and that is the right way round: a missed
 * reminder is a disappointment, a duplicate is us spamming someone who trusted
 * us with their inbox. The same reasoning governs `recordRedemption` and the
 * campaign recipient ledger.
 *
 * Plans are grouped per user so someone with three contests on one day gets ONE
 * email, not three.
 */
export async function sendContestReminders(): Promise<ReminderReport> {
    await connectToDatabase();

    const report: ReminderReport = { considered: 0, sent: 0, failed: 0, skipped: 0 };

    if (!process.env.EMAIL_USER || !(process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD)) {
        // No mail credentials configured — do nothing rather than claim plans we
        // cannot deliver, which would silently burn the one reminder each gets.
        return report;
    }

    const now = new Date();
    const until = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000);

    const due = (await ContestPlan.find({
        startsAt: { $gte: now, $lte: until },
        reminderSentAt: { $exists: false },
    })
        .select('userId fingerprint platform name url startsAt')
        .sort({ startsAt: 1 })
        .limit(MAX_EMAILS_PER_RUN * 4) // several plans can belong to one user
        .lean()) as any[];

    report.considered = due.length;
    if (!due.length) return report;

    // Group by user: one email per person per run.
    const byUser = new Map<string, any[]>();
    for (const plan of due) {
        const key = String(plan.userId);
        if (!byUser.has(key)) byUser.set(key, []);
        byUser.get(key)!.push(plan);
    }

    const transporter = createTransporter();
    let sentCount = 0;

    for (const [userId, plans] of byUser) {
        if (sentCount >= MAX_EMAILS_PER_RUN) {
            report.skipped += plans.length;
            continue;
        }

        const user = (await CompanyKitUser.findById(userId)
            .select('email name membershipExpiresAt')
            .lean()) as any;
        if (!user?.email) {
            report.skipped += plans.length;
            continue;
        }

        /* Reminders are a membership feature, so a lapsed member stops getting
         * them. Checked at SEND time rather than filtered into the query above,
         * because membership can lapse between planning a contest and the
         * morning it runs — the plan row itself carries no entitlement.
         *
         * The plans are left untouched (not claimed, not deleted): renewing
         * before the contest restores the reminder, and the row is still there
         * to show on the calendar the moment they come back. */
        if (!isMembershipActive(user.membershipExpiresAt)) {
            report.skipped += plans.length;
            continue;
        }

        // CLAIM FIRST. Only the plans this invocation successfully claimed are
        // included in the email — anything another run already took is dropped
        // here rather than mailed twice.
        const claimed: any[] = [];
        for (const plan of plans) {
            const won = await ContestPlan.findOneAndUpdate(
                { _id: plan._id, reminderSentAt: { $exists: false } },
                { $set: { reminderSentAt: new Date() } }
            ).lean();
            if (won) claimed.push(plan);
        }
        if (!claimed.length) continue;

        const items: ContestReminderItem[] = claimed.map((p) => ({
            name: p.name,
            url: p.url,
            platform: p.platform,
            startsAt: new Date(p.startsAt),
        }));

        const { subject, html, text } = buildContestReminderEmail({
            name: user.name,
            contests: items,
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
            sentCount += 1;
        } catch (err: any) {
            report.failed += 1;
            /**
             * The claim is NOT rolled back on a send failure.
             *
             * A bounce is usually permanent (bad address, blocked sender), so
             * releasing the claim would retry it every day until the contest
             * passed. Losing one reminder to a transient failure is the cheaper
             * mistake, and the failure count surfaces it in the cron report.
             */
            console.error(`Contest reminder failed for ${user.email}:`, err?.message);
        }
    }

    return report;
}
