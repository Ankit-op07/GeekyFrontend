import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { requireAdmin } from '@/lib/admin-auth';
import { escapeRegex } from '@/lib/escape-regex';

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
// Branded onboarding email template
// ─────────────────────────────────────────────
function buildKitOnboardingEmail({
  recipientEmail,
  recipientName,
  kitName,
  setPasswordLink,
  personalNote,
}: {
  recipientEmail: string;
  recipientName: string;
  kitName: string;
  setPasswordLink: string;
  personalNote?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://geekyfrontend.com';

  const kitEmoji = kitName.toLowerCase().includes('react') ? '⚛️'
    : kitName.toLowerCase().includes('js') || kitName.toLowerCase().includes('javascript') ? '🟨'
      : kitName.toLowerCase().includes('node') ? '🟢'
        : kitName.toLowerCase().includes('dsa') || kitName.toLowerCase().includes('company') ? '🧮'
          : kitName.toLowerCase().includes('placement') ? '🎓'
            : kitName.toLowerCase().includes('complete') ? '🏆'
              : '📚';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Geeky Frontend — Your Kit Access is Ready!</title>
</head>
<body style="margin:0;padding:0;background:#f0f2ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;">

    <!-- ══════════ HERO ══════════ -->
    <tr>
      <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:52px 36px 48px;text-align:center;border-radius:0 0 0 0;">
        <div style="font-size:64px;line-height:1;margin-bottom:20px;">${kitEmoji}</div>
        <h1 style="color:#fff;font-size:30px;font-weight:800;margin:0 0 14px;line-height:1.3;letter-spacing:-0.5px;">
          Welcome to Geeky Frontend!<br>
          <span style="font-size:22px;font-weight:600;opacity:0.9;">Your access is ready 🎉</span>
        </h1>
        <p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.6;">
          Hey <strong style="color:#fff;">${recipientName}</strong>, we've set up your account<br>and granted access to your interview kit.
        </p>
      </td>
    </tr>

    <!-- ══════════ BODY ══════════ -->
    <tr>
      <td style="background:#fff;padding:44px 36px 36px;">

        <!-- Greeting -->
        <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">
          We're super excited to have you on board! 🙌 You're about to dive into one of the most comprehensive interview prep kits out there.
        </p>

        ${personalNote ? `
        <!-- Personal note -->
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 22px;margin-bottom:28px;">
          <p style="color:#92400e;font-size:11px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">💬 Message from the team</p>
          <p style="color:#78350f;font-size:15px;line-height:1.75;margin:0;">${personalNote}</p>
        </div>
        ` : ''}

        <!-- Kit card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:14px;padding:28px 28px 24px;">
              <p style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">📦 Your Kit</p>
              <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 10px;line-height:1.3;">${kitEmoji} ${kitName}</h2>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.65;margin:0 0 20px;">
                Lifetime access · All topics included · Regular updates · Interview-ready content
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#fff;">
                    <a href="${baseUrl}/dashboard" target="_blank"
                       style="display:inline-block;padding:13px 28px;color:#667eea;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">
                      Go to My Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 1: Set Password -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#f0f4ff;border:2px solid #667eea;border-radius:14px;padding:28px;">
              <p style="color:#4338ca;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">Step 1 of 2</p>
              <h3 style="color:#1e1b4b;font-size:20px;font-weight:700;margin:0 0 12px;">🔐 Set Your Account Password</h3>
              <p style="color:#555;font-size:14px;line-height:1.75;margin:0 0 22px;">
                Your account has been created with your email. Click the button below to set a password — it only takes 30 seconds!
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:9px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                    <a href="${setPasswordLink}" target="_blank"
                       style="display:inline-block;padding:14px 34px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;border-radius:9px;letter-spacing:0.2px;">
                      Set My Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;margin:14px 0 0;">
                ⏰ Link valid for <strong>7 days</strong> · Having trouble?
                <a href="mailto:geekyfrontend@gmail.com" style="color:#667eea;text-decoration:none;">geekyfrontend@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Step 2: Access content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="background:#f8fffe;border:2px solid #10b981;border-radius:14px;padding:24px 28px;">
              <p style="color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">Step 2 of 2</p>
              <h3 style="color:#064e3b;font-size:20px;font-weight:700;margin:0 0 10px;">🚀 Start Learning</h3>
              <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">
                After setting your password, log in and head to your dashboard. Your entire ${kitEmoji} <strong>${kitName}</strong> content is already there, organised by topic and ready to access.
              </p>
            </td>
          </tr>
        </table>

        <!-- What's inside -->
        <div style="background:#f9fafb;border-radius:12px;padding:22px 26px;margin-bottom:32px;">
          <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 14px;">✨ What's inside the platform</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">📖 <strong>In-depth articles</strong> on every interview topic</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">💡 <strong>Real interview questions</strong> with scripted answers</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">🔁 <strong>Progress tracking</strong> — mark what you've completed</p>
          <p style="color:#6b7280;font-size:14px;margin:0;line-height:1.55;">🔄 <strong>Lifetime updates</strong> — fresh content added regularly</p>
        </div>

        <!-- Account info -->
        <div style="background:#f0f4ff;border-radius:10px;padding:18px 22px;margin-bottom:32px;">
          <p style="color:#4338ca;font-size:13px;font-weight:600;margin:0 0 10px;">📋 Your Account Details</p>
          <p style="color:#555;font-size:14px;margin:0 0 6px;">
            📧 Email: <strong>${recipientEmail}</strong>
          </p>
          <p style="color:#555;font-size:14px;margin:0;">
            🔗 Login at:
            <a href="${baseUrl}/login" style="color:#667eea;text-decoration:none;font-weight:600;">${baseUrl.replace('https://', '')}/login</a>
          </p>
        </div>

        <!-- Sign off -->
        <p style="color:#555;font-size:15px;line-height:1.85;margin:0 0 8px;">
          We've put a lot of love into this platform and we can't wait to hear about your success story. If you have any questions, just reply to this email. 💜
        </p>
        <p style="color:#777;font-size:14px;margin:0;">
          Happy learning,<br>
          <strong style="color:#333;font-size:15px;">The Geeky Frontend Team</strong>
        </p>

      </td>
    </tr>

    <!-- ══════════ FOOTER ══════════ -->
    <tr>
      <td style="background:#f8f9fa;padding:22px 36px;text-align:center;border-radius:0 0 12px 12px;">
        <p style="color:#bbb;font-size:12px;margin:0;line-height:1.7;">
          © 2025 Geeky Frontend · All rights reserved.<br>
          Questions? <a href="mailto:geekyfrontend@gmail.com" style="color:#667eea;text-decoration:none;">geekyfrontend@gmail.com</a>
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}

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

    // 3️⃣ Send personalised onboarding email
    const html = buildKitOnboardingEmail({
      recipientEmail: cleanEmail,
      recipientName: user.name || nameFromEmail,
      kitName,
      setPasswordLink,
      personalNote,
    });

    const prefix = subjectPrefix ? `${subjectPrefix} ` : '';
    await transporter.sendMail({
      from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: `${prefix}🎉 Welcome to Geeky Frontend — Your ${kitName} Access is Ready!`,
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
