import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

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
// Generic email templates
// ─────────────────────────────────────────────
const EMAIL_TEMPLATES = {
    new_offer: {
        subject: '🎉 Special Offer for You - Geeky Frontend',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 20px;">🎉 Special Offer Just for You!</h1>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        {{MESSAGE}}
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
                        <a href="https://geekyfrontend.com" style="color: white; text-decoration: none; font-weight: bold; font-size: 18px;">
                            🚀 Check It Out Now
                        </a>
                    </div>
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    new_content: {
        subject: '📚 New Content Added - Geeky Frontend',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 20px;">📚 Fresh Content Just Added!</h1>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        {{MESSAGE}}
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                        <p style="color: #333; margin: 0; font-weight: 500;">
                            Your access is still active - dive in and explore!
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://geekyfrontend.com" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Access Your Kit
                        </a>
                    </div>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    announcement: {
        subject: '📢 Important Announcement - Geeky Frontend',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 20px;">📢 Announcement</h1>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        {{MESSAGE}}
                    </p>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    custom: {
        subject: '{{SUBJECT}}',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
                <div style="background: #ffffff; border-radius: 10px; padding: 40px;">
                    {{MESSAGE}}
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Geeky Frontend Team</strong>
                    </p>
                </div>
            </div>
        `,
    },
    // platform_onboarding is built dynamically — no static html here
    platform_onboarding: {
        subject: '🎉 Congratulations — You Now Have Access to the New Geeky Frontend Platform!',
        html: '',
    },
};

// ─────────────────────────────────────────────
// Platform onboarding email builder
// ─────────────────────────────────────────────
function buildPlatformOnboardingEmail(
    email: string,
    kitName: string,
    setPasswordLink: string,
    personalNote?: string
): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://geekyfrontend.com';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the New Geeky Frontend Learning Platform!</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f0f2ff;">
  <table align="center" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;">

    <!-- ═══ HERO ═══ -->
    <tr>
      <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:52px 32px 44px;text-align:center;">
        <div style="font-size:60px;line-height:1;margin-bottom:18px;">🎉</div>
        <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 12px;line-height:1.3;letter-spacing:-0.5px;">
          Congratulations! We've Upgraded<br>to Something Way More Exciting!
        </h1>
        <p style="color:rgba(255,255,255,0.88);font-size:17px;margin:0;font-weight:400;line-height:1.5;">
          The all-new Geeky Frontend Learning Platform is live 🚀
        </p>
      </td>
    </tr>

    <!-- ═══ BODY ═══ -->
    <tr>
      <td style="background:#fff;padding:40px 32px;">

        <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Hey Developer! 👋
        </p>

        <p style="color:#555;font-size:16px;line-height:1.9;margin:0 0 28px;">
          We have some <strong style="color:#667eea;">really exciting news!</strong>
          We've completely rebuilt and migrated to an all-new dedicated learning platform
          with a <strong>brand-new content structure</strong> — everything is more
          organised, more powerful, and way more fun to learn on. 🙌
        </p>

        ${personalNote ? `
        <!-- Personal note from admin -->
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
          <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Message from us</p>
          <p style="color:#78350f;font-size:15px;line-height:1.7;margin:0;">${personalNote}</p>
        </div>
        ` : ''}

        <!-- What's new -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:linear-gradient(135deg,#f0f4ff 0%,#f5f0ff 100%);border-radius:12px;padding:26px;border-left:4px solid #667eea;">
              <h3 style="color:#667eea;margin:0 0 16px;font-size:17px;font-weight:700;">✨ What's New on the Platform</h3>
              <p style="color:#555;margin:0 0 10px;font-size:15px;line-height:1.55;">🗂️ <strong>All-new content structure</strong> — Better organised, easier to navigate</p>
              <p style="color:#555;margin:0 0 10px;font-size:15px;line-height:1.55;">⚡ <strong>Fresh, up-to-date material</strong> — Rebuilt from scratch for 2025</p>
              <p style="color:#555;margin:0 0 10px;font-size:15px;line-height:1.55;">🔒 <strong>Your own account & dashboard</strong> — Track progress, streaks & more</p>
              <p style="color:#555;margin:0;font-size:15px;line-height:1.55;">🚀 <strong>Faster, smoother experience</strong> — Purpose-built learning platform</p>
            </td>
          </tr>
        </table>

        <!-- ── STEP 1: Set Password ── -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td style="background:#f0f4ff;border:2px solid #667eea;border-radius:12px;padding:28px;">
              <p style="color:#4338ca;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">Step 1</p>
              <h3 style="color:#333;font-size:19px;font-weight:700;margin:0 0 12px;">🔐 Create Your Account Password</h3>
              <p style="color:#555;font-size:14px;line-height:1.75;margin:0 0 20px;">
                Set up a password for your Geeky Frontend account so you can log in anytime
                and access your personalised dashboard. Takes less than a minute!
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                    <a href="${setPasswordLink}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;">
                      Set My Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#aaa;font-size:12px;margin:14px 0 0;">
                ⏰ Link valid for <strong>7 days</strong>.
                Need help? <a href="mailto:support@geekyfrontend.com" style="color:#667eea;text-decoration:none;">support@geekyfrontend.com</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- ── STEP 2: Access Kit ── -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:28px;">
              <p style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">Step 2 · Your Kit</p>
              <h3 style="color:#fff;font-size:19px;font-weight:700;margin:0 0 10px;">${kitName}</h3>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.7;margin:0 0 20px;">
                After setting your password, head to your dashboard to access all your
                course materials — fully restructured and ready for you!
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#fff;">
                    <a href="${baseUrl}/dashboard" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#667eea;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;">
                      Go to My Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Quick info -->
        <div style="background:#f8f9fa;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
          <p style="color:#555;font-size:14px;font-weight:600;margin:0 0 10px;">💡 Quick Info</p>
          <p style="color:#666;font-size:14px;margin:0 0 6px;line-height:1.5;">
            📧 Your account email: <strong>${email}</strong>
          </p>
          <p style="color:#666;font-size:14px;margin:0;line-height:1.5;">
            🔗 Login anytime at:
            <a href="${baseUrl}/login" style="color:#667eea;text-decoration:none;font-weight:600;">${baseUrl.replace('https://', '')}/login</a>
          </p>
        </div>

        <p style="color:#555;font-size:15px;line-height:1.85;margin:0 0 32px;">
          We are so thrilled to have you on this new journey. This platform has been built
          with passion to give you the absolute best frontend interview prep experience. 💜
        </p>

        <p style="color:#777;font-size:14px;line-height:1.6;margin:0;">
          Cheers &amp; Happy Learning,<br>
          <strong style="color:#333;font-size:15px;">The Geeky Frontend Team</strong>
        </p>
      </td>
    </tr>

    <!-- ═══ FOOTER ═══ -->
    <tr>
      <td style="background:#f8f9fa;padding:24px 32px;text-align:center;">
        <p style="color:#bbb;font-size:12px;margin:0;line-height:1.7;">
          © 2025 Geeky Frontend. All rights reserved.<br>
          Questions? <a href="mailto:support@geekyfrontend.com" style="color:#667eea;text-decoration:none;">support@geekyfrontend.com</a>
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// POST — Send emails
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            templateType,
            customSubject,
            message,
            filterByKit,
            sendToAll,
            testEmail,
        } = body;

        if (!templateType) {
            return NextResponse.json({ error: 'templateType is required' }, { status: 400 });
        }

        // ════════════════════════════════════════
        // PLATFORM ONBOARDING — personalised per user
        // ════════════════════════════════════════
        if (templateType === 'platform_onboarding') {
            const subject = EMAIL_TEMPLATES.platform_onboarding.subject;
            const transporter = createTransporter();
            const jwtSecret = process.env.JWT_SECRET || 'secret_key';
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://geekyfrontend.com';

            // ── Test email (demo data, no DB writes) ──
            if (testEmail) {
                const demoToken = jwt.sign(
                    { id: 'test_user_id', type: 'set-password' },
                    jwtSecret,
                    { expiresIn: '7d' }
                );
                const demoLink = `${baseUrl}/reset-password?token=${demoToken}`;
                const html = buildPlatformOnboardingEmail(
                    testEmail,
                    'Complete Frontend Interview Preparation Kit',
                    demoLink,
                    message || undefined
                );
                await transporter.sendMail({
                    from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                    to: testEmail,
                    subject: `[TEST] ${subject}`,
                    html,
                });
                return NextResponse.json({
                    success: true,
                    message: `Test onboarding email sent to ${testEmail}`,
                    sentCount: 1,
                });
            }

            // ── Bulk personalised send ──
            await connectToDatabase();

            const query: Record<string, any> = { status: 'email_sent' };
            if (!sendToAll && filterByKit) {
                query.planName = { $regex: filterByKit, $options: 'i' };
            }

            // Deduplicate by email — keep latest order per email
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .select('email planName')
                .lean() as Array<{ email: string; planName: string }>;

            const emailToKit = new Map<string, string>();
            for (const o of orders) {
                if (!emailToKit.has(o.email)) {
                    emailToKit.set(o.email, o.planName);
                }
            }

            if (emailToKit.size === 0) {
                return NextResponse.json(
                    { error: 'No recipients found matching the criteria' },
                    { status: 400 }
                );
            }

            let successCount = 0;
            const failedEmails: string[] = [];

            for (const [email, kitName] of emailToKit.entries()) {
                try {
                    // Upsert CompanyKitUser — creates account if it doesn't exist yet
                    const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
                    const user = await CompanyKitUser.findOneAndUpdate(
                        { email: email.toLowerCase() },
                        {
                            $setOnInsert: { name: nameFromEmail, email: email.toLowerCase() },
                            $set: { mustChangePassword: true },
                            $addToSet: { purchasedKits: kitName },
                        },
                        { upsert: true, new: true }
                    );

                    // Generate set-password JWT (7-day expiry for onboarding)
                    const token = jwt.sign(
                        { id: user._id.toString(), type: 'set-password' },
                        jwtSecret,
                        { expiresIn: '7d' }
                    );
                    const setPasswordLink = `${baseUrl}/reset-password?token=${token}`;

                    const html = buildPlatformOnboardingEmail(
                        email,
                        kitName,
                        setPasswordLink,
                        message || undefined
                    );

                    await transporter.sendMail({
                        from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject,
                        html,
                    });

                    successCount++;
                    // Small delay to avoid Gmail rate limiting
                    await new Promise((r) => setTimeout(r, 120));
                } catch (err: any) {
                    console.error(`[Onboarding] Failed for ${email}:`, err.message);
                    failedEmails.push(email);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Platform onboarding emails sent',
                sentCount: successCount,
                failedCount: failedEmails.length,
                failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
                totalRecipients: emailToKit.size,
            });
        }

        // ════════════════════════════════════════
        // ALL OTHER TEMPLATES
        // ════════════════════════════════════════

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const template =
            EMAIL_TEMPLATES[templateType as keyof typeof EMAIL_TEMPLATES] || EMAIL_TEMPLATES.custom;

        const subject = template.subject.replace(
            '{{SUBJECT}}',
            customSubject || 'Update from Geeky Frontend'
        );
        const htmlContent = template.html.replace('{{MESSAGE}}', message);

        // Test email
        if (testEmail) {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                to: testEmail,
                subject: `[TEST] ${subject}`,
                html: htmlContent,
            });
            return NextResponse.json({
                success: true,
                message: `Test email sent to ${testEmail}`,
                sentCount: 1,
            });
        }

        await connectToDatabase();

        const query: Record<string, any> = { status: 'email_sent' };
        if (!sendToAll && filterByKit) {
            query.planName = { $regex: filterByKit, $options: 'i' };
        }

        const orders = await Order.find(query).select('email').lean();
        const uniqueEmails = [...new Set(orders.map((o: any) => o.email as string))];

        if (uniqueEmails.length === 0) {
            return NextResponse.json(
                { error: 'No recipients found matching the criteria' },
                { status: 400 }
            );
        }

        const transporter = createTransporter();
        let successCount = 0;
        const failedEmails: string[] = [];

        for (const email of uniqueEmails) {
            try {
                await transporter.sendMail({
                    from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject,
                    html: htmlContent,
                });
                successCount++;
                await new Promise((r) => setTimeout(r, 100));
            } catch (error: any) {
                console.error(`Failed to send to ${email}:`, error.message);
                failedEmails.push(email);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Emails sent successfully',
            sentCount: successCount,
            failedCount: failedEmails.length,
            failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
            totalRecipients: uniqueEmails.length,
        });
    } catch (error: any) {
        console.error('Error sending bulk emails:', error);
        return NextResponse.json(
            { error: 'Failed to send emails', details: error.message },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────
// GET — Template list + recipient counts
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const filterByKit = searchParams.get('filterByKit');

        const kitCounts = await Order.aggregate([
            { $match: { status: 'email_sent' } },
            {
                $group: {
                    _id: '$planName',
                    count: { $sum: 1 },
                    emails: { $addToSet: '$email' },
                },
            },
            {
                $project: {
                    planName: '$_id',
                    orderCount: '$count',
                    uniqueEmails: { $size: '$emails' },
                    _id: 0,
                },
            },
        ]);

        const allEmails = await Order.distinct('email', { status: 'email_sent' });

        let filteredCount = 0;
        if (filterByKit) {
            const filtered = await Order.distinct('email', {
                status: 'email_sent',
                planName: { $regex: filterByKit, $options: 'i' },
            });
            filteredCount = filtered.length;
        }

        return NextResponse.json({
            templates: Object.keys(EMAIL_TEMPLATES).map((key) => ({
                id: key,
                name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                subject: EMAIL_TEMPLATES[key as keyof typeof EMAIL_TEMPLATES].subject,
            })),
            kitCounts,
            totalUniqueEmails: allEmails.length,
            filteredCount,
        });
    } catch (error: any) {
        console.error('Error fetching email data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', details: error.message },
            { status: 500 }
        );
    }
}
