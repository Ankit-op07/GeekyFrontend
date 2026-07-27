import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { requireAdmin } from '@/lib/admin-auth';
import { escapeRegex } from '@/lib/escape-regex';
import { getPlanDisplayName } from '@/lib/appConstants';
// Shared with the campaign sender (app/api/admin/email-campaigns) — one template,
// so the two surfaces can't drift apart.
import { buildKitOnboardingEmail } from '@/lib/email/kit-emails';

// ─────────────────────────────────────────────
// Email transporter
// ─────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
    },
  });

// ─────────────────────────────────────────────
// Helper: process a single email (upsert user + grant access + send email)
// Returns { success, email, error? }
// ─────────────────────────────────────────────
async function processOneEmail({
  email,
  kitName,
  personalNote,
  jwtSecret,
  baseUrl,
  transporter,
  subjectPrefix,
}: {
  email: string;
  kitName: string;
  personalNote?: string;
  jwtSecret: string;
  baseUrl: string;
  transporter: any;
  subjectPrefix?: string;
}): Promise<{ success: boolean; email: string; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, email, error: 'Invalid email address' };
    }

    console.log(`[kit-onboarding] Processing: ${cleanEmail}`);

    // 1️⃣ Grant access — upsert CompanyKitUser
    const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const user = await CompanyKitUser.findOneAndUpdate(
      { email: cleanEmail },
      {
        $setOnInsert: {
          name: nameFromEmail,
          email: cleanEmail,
          emailVerified: true,
          mustChangePassword: true,
        },
        $set: { subscriptionStatus: 'active' },
        $addToSet: { purchasedKits: kitName },
      },
      { upsert: true, new: true }
    );
    console.log(`[kit-onboarding]   ✅ Access granted | userId: ${user._id} | kits: [${(user.purchasedKits || []).join(', ')}]`);

    // 2️⃣ Generate set-password JWT (7-day expiry)
    const token = jwt.sign(
      { id: user._id.toString(), type: 'set-password' },
      jwtSecret,
      { expiresIn: '7d' }
    );
    const setPasswordLink = `${baseUrl}/reset-password?token=${token}`;

    // 3️⃣ Send personalised onboarding email — kitName is the stored access key;
    //     show the current display name to the user.
    const displayKitName = getPlanDisplayName(kitName);
    const html = buildKitOnboardingEmail({
      recipientEmail: cleanEmail,
      recipientName: user.name || nameFromEmail,
      kitName: displayKitName,
      setPasswordLink,
      personalNote,
    });

    const prefix = subjectPrefix ? `${subjectPrefix} ` : '';
    await transporter.sendMail({
      from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: `${prefix}🎉 Welcome to Geeky Frontend — Your ${displayKitName} Access is Ready!`,
      html,
    });

    // 4️⃣ Stamp lastOnboardingEmailSentAt
    await CompanyKitUser.updateOne(
      { email: cleanEmail },
      { $set: { lastOnboardingEmailSentAt: new Date() } }
    );

    console.log(`[kit-onboarding]   ✅ Email sent to: ${cleanEmail}`);
    return { success: true, email: cleanEmail };
  } catch (err: any) {
    console.error(`[kit-onboarding]   ❌ Failed for ${email}:`, err.message);
    return { success: false, email, error: err.message };
  }
}

// ─────────────────────────────────────────────
// GET — list kits with buyer counts from Orders
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const forbidden = requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    console.log('[kit-onboarding GET] Fetching kit stats…');
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const kitName = searchParams.get('kit');

    // Aggregate buyer counts per kit
    const kitStats = await Order.aggregate([
      { $match: { status: 'email_sent' } },
      { $group: { _id: '$planName', count: { $sum: 1 }, emails: { $addToSet: '$email' } } },
      { $project: { kitName: '$_id', orderCount: '$count', uniqueEmails: { $size: '$emails' }, _id: 0 } },
      { $sort: { uniqueEmails: -1 } },
    ]);
    console.log(`[kit-onboarding GET] Found ${kitStats.length} kits`);

    // If a specific kit is requested, return the actual email list with password status
    let buyers: { email: string; name: string; hasSetPassword: boolean }[] = [];
    let pendingCount = 0;
    let completedCount = 0;
    if (kitName) {
      console.log(`[kit-onboarding GET] Fetching buyers for kit: "${kitName}"`);
      const orders = await Order.find({
        status: 'email_sent',
        planName: { $regex: escapeRegex(kitName), $options: 'i' },
      }).select('email').lean() as Array<{ email: string }>;

      const uniqueEmails = [...new Set(orders.map((o) => o.email))];
      console.log(`[kit-onboarding GET] Found ${uniqueEmails.length} unique buyers`);

      // Enrich with names + password status from CompanyKitUser
      const users = await CompanyKitUser.find({
        email: { $in: uniqueEmails.map((e) => e.toLowerCase()) },
      }).select('email name mustChangePassword password').lean() as Array<{
        email: string; name: string; mustChangePassword?: boolean; password?: string;
      }>;

      const userMap = new Map(users.map((u) => [
        u.email.toLowerCase(),
        {
          name: u.name,
          // User has set password if: mustChangePassword is false AND password exists
          hasSetPassword: !u.mustChangePassword && !!u.password,
        },
      ]));

      buyers = uniqueEmails.map((email) => {
        const info = userMap.get(email.toLowerCase());
        const hasSetPassword = info?.hasSetPassword ?? false;
        if (hasSetPassword) completedCount++;
        else pendingCount++;
        return {
          email,
          name: info?.name || email.split('@')[0].replace(/[._-]/g, ' '),
          hasSetPassword,
        };
      });
    }

    return NextResponse.json({ kitStats, buyers, pendingCount, completedCount });
  } catch (error: any) {
    console.error('[kit-onboarding GET] ❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST — grant access + send onboarding emails
// Supports: testEmails (array), testEmail (single), or bulk
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const forbidden = requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const {
      kitName,       // required — the kit name to assign
      personalNote,  // optional personal note in emails
      testEmails,    // array of test emails (new — supports multiple)
      testEmail,     // single test email (backward-compat)
      pendingOnly,   // if true, only email users who haven't set their password yet
      limit: rawLimit, // optional number to restrict how many emails to process
      skipRecentDays, // optional: skip users emailed within N days (default 2)
    } = body;

    // Coerce limit to a proper number (frontend may send it as string)
    const limit = rawLimit ? Number(rawLimit) : undefined;

    console.log('[kit-onboarding POST] ── Request received ──');
    console.log(`[kit-onboarding POST] kitName: "${kitName}"`);
    console.log(`[kit-onboarding POST] testEmail: ${testEmail || 'none'} | testEmails: ${testEmails ? JSON.stringify(testEmails) : 'none'}`);

    if (!kitName) {
      console.warn('[kit-onboarding POST] ❌ Missing kitName');
      return NextResponse.json({ error: 'kitName is required' }, { status: 400 });
    }

    const transporter = createTransporter();
    const jwtSecret = process.env.JWT_SECRET || 'secret_key';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://geekyfrontend.com';

    console.log(`[kit-onboarding POST] JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
    console.log(`[kit-onboarding POST] EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`[kit-onboarding POST] baseUrl: ${baseUrl}`);

    await connectToDatabase();
    console.log('[kit-onboarding POST] DB connected');

    // ── TEST EMAILS (single or multiple) ──────────────────────────
    // Merge testEmail (string) and testEmails (string[]) into one list
    const testList: string[] = [];
    if (testEmails && Array.isArray(testEmails)) testList.push(...testEmails);
    if (testEmail && typeof testEmail === 'string') testList.push(testEmail);
    // Dedupe + clean
    const uniqueTestEmails = [...new Set(testList.map(e => e.trim().toLowerCase()).filter(Boolean))];

    if (uniqueTestEmails.length > 0) {
      console.log(`[kit-onboarding POST] 🧪 TEST mode — processing ${uniqueTestEmails.length} email(s):`, uniqueTestEmails);

      let sentCount = 0;
      let failedCount = 0;
      const results: { email: string; success: boolean; error?: string }[] = [];

      for (const email of uniqueTestEmails) {
        const result = await processOneEmail({
          email,
          kitName,
          personalNote: personalNote || undefined,
          jwtSecret,
          baseUrl,
          transporter,
          subjectPrefix: '[TEST]',
        });
        results.push(result);
        if (result.success) sentCount++;
        else failedCount++;

        // Small delay to avoid Gmail rate limiting
        if (uniqueTestEmails.length > 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      console.log(`[kit-onboarding POST] 🧪 TEST done — sent: ${sentCount}, failed: ${failedCount}`);
      return NextResponse.json({
        success: true,
        message: `Test emails processed: ${sentCount} sent${failedCount > 0 ? `, ${failedCount} failed` : ''}. Accounts created/updated and kit access granted.`,
        sentCount,
        failedCount,
        accessGrantedCount: sentCount,
        totalRecipients: uniqueTestEmails.length,
        results,
      });
    }

    // ── BULK SEND — all buyers of the kit ────────────────────────
    console.log(`[kit-onboarding POST] 📨 BULK mode — finding buyers for: "${kitName}" | pendingOnly: ${!!pendingOnly}`);

    // Find all unique buyers of this kit
    const orders = await Order.find({
      status: 'email_sent',
      planName: { $regex: escapeRegex(kitName), $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .select('email planName')
      .lean() as Array<{ email: string; planName: string }>;

    // Deduplicate — keep first occurrence = latest order per email
    const emailToKit = new Map<string, string>();
    for (const o of orders) {
      if (!emailToKit.has(o.email.toLowerCase())) {
        emailToKit.set(o.email.toLowerCase(), o.planName);
      }
    }

    console.log(`[kit-onboarding POST] Found ${orders.length} orders → ${emailToKit.size} unique buyers`);

    if (emailToKit.size === 0) {
      console.warn('[kit-onboarding POST] ❌ No buyers found');
      return NextResponse.json(
        { error: 'No buyers found for the selected kit. Make sure there are orders with status "email_sent".' },
        { status: 400 }
      );
    }

    // ── If pendingOnly, filter to users who haven't set their password ──
    // Also skip users who were emailed within the last N days (default 2)
    let targetEmails = emailToKit;
    let skippedCount = 0;
    let recentlyEmailedCount = 0;
    if (pendingOnly) {
      const recentDays = typeof skipRecentDays === 'number' && skipRecentDays > 0 ? skipRecentDays : 2;
      const recentCutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

      const allEmails = [...emailToKit.keys()];
      const existingUsers = await CompanyKitUser.find({
        email: { $in: allEmails },
      }).select('email mustChangePassword password lastOnboardingEmailSentAt').lean() as Array<{
        email: string; mustChangePassword?: boolean; password?: string; lastOnboardingEmailSentAt?: Date;
      }>;

      // Users who have set password: mustChangePassword is false AND password exists
      const completedEmails = new Set(
        existingUsers
          .filter(u => !u.mustChangePassword && !!u.password)
          .map(u => u.email.toLowerCase())
      );

      // Users who were emailed recently (within recentDays)
      const recentlyEmailed = new Set(
        existingUsers
          .filter(u => u.lastOnboardingEmailSentAt && new Date(u.lastOnboardingEmailSentAt) > recentCutoff)
          .map(u => u.email.toLowerCase())
      );

      targetEmails = new Map();
      for (const [email, kit] of emailToKit.entries()) {
        if (completedEmails.has(email)) {
          skippedCount++;
          console.log(`[kit-onboarding POST]   ⏭ Skipping ${email} — already set password`);
        } else if (recentlyEmailed.has(email)) {
          recentlyEmailedCount++;
          console.log(`[kit-onboarding POST]   ⏭ Skipping ${email} — emailed within last ${recentDays} day(s)`);
        } else {
          targetEmails.set(email, kit);
        }
      }

      console.log(`[kit-onboarding POST] pendingOnly filter: ${targetEmails.size} to send, ${skippedCount} already set password, ${recentlyEmailedCount} recently emailed (last ${recentDays}d)`);

      if (targetEmails.size === 0) {
        return NextResponse.json({
          success: true,
          message: `No emails to send! ${skippedCount} already set password${recentlyEmailedCount > 0 ? `, ${recentlyEmailedCount} emailed within last ${recentDays} day(s)` : ''}. 🎉`,
          sentCount: 0,
          accessGrantedCount: 0,
          failedCount: 0,
          skippedCount,
          recentlyEmailedCount,
          totalRecipients: 0,
        });
      }
    }

    // Apply limit if specified (already coerced to number above)
    if (limit && !isNaN(limit) && limit > 0) {
      if (limit < targetEmails.size) {
        const limitedEntries = Array.from(targetEmails.entries()).slice(0, limit);
        targetEmails = new Map(limitedEntries);
        console.log(`[kit-onboarding POST] Applying limit: restricting to ${limit} out of ${emailToKit.size} recipients`);
      }
    }

    let successCount = 0;
    let accessGrantedCount = 0;
    const failedEmails: string[] = [];

    let processed = 0;
    for (const [email, resolvedKitName] of targetEmails.entries()) {
      processed++;
      console.log(`[kit-onboarding POST] [${processed}/${targetEmails.size}] Processing: ${email}`);

      const result = await processOneEmail({
        email,
        kitName: resolvedKitName,
        personalNote: personalNote || undefined,
        jwtSecret,
        baseUrl,
        transporter,
      });

      if (result.success) {
        successCount++;
        accessGrantedCount++;
      } else {
        failedEmails.push(email);
      }

      // Small delay to avoid Gmail rate limiting
      await new Promise(r => setTimeout(r, 150));
    }

    console.log(`[kit-onboarding POST] ✅ BULK complete — sent: ${successCount}, failed: ${failedEmails.length}, total: ${emailToKit.size}`);

    return NextResponse.json({
      success: true,
      message: pendingOnly
        ? `Resend complete! Emailed ${successCount} pending user${successCount !== 1 ? 's' : ''}${skippedCount > 0 ? ` (${skippedCount} already set password)` : ''}${recentlyEmailedCount > 0 ? ` (${recentlyEmailedCount} recently emailed — skipped)` : ''}.`
        : 'Onboarding complete!',
      sentCount: successCount,
      accessGrantedCount,
      failedCount: failedEmails.length,
      skippedCount,
      recentlyEmailedCount,
      totalRecipients: targetEmails.size,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    });
  } catch (error: any) {
    console.error('[kit-onboarding POST] ❌ Unexpected error:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
