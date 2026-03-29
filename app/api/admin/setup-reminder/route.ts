import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Find users who have NO password and NO googleId OR have never logged in (no lastActiveDate)
    const usersToRemind = await CompanyKitUser.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { lastActiveDate: { $exists: false } },
        { lastActiveDate: null }
      ],
      googleId: { $in: [null, undefined] } // Ensure no googleId for the missing password check
    }).lean();

    // Refined filter in JS just to be absolutely sure we only hit the right people
    const targetUsers = usersToRemind.filter((u: any) => {
      const hasAuth = !!u.password || !!u.googleId;
      const hasLoggedIn = !!u.lastActiveDate;
      return !hasAuth || !hasLoggedIn;
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found that require a reminder.', count: 0 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    // Process sequentially to respect Gmail limits
    for (const user of targetUsers as any[]) {
      try {
        const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                      <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Action Required: Setup Your Account</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; background-color: white; border-radius: 0 0 8px 8px;">
                        <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hello ${user.name},</p>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          We noticed that you haven't fully set up your account or logged into your dashboard yet!
                        </p>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          To seamlessly access your purchased materials, please log into your account on our learning platform using this exact email address (<strong>${user.email}</strong>).
                        </p>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="https://geekyfrontend.com/login" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: white; background: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Login to your Account
                              </a>
                            </td>
                            
                          </tr>
                        </table>
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                          If you have already signed up with Google or another email, please ensure you use <strong>${user.email}</strong> to access your current purchases.
                        </p>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                `;

        await transporter.sendMail({
          from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Action Required: Set up your Geeky Frontend Account',
          html: emailHtml,
        });
        sentCount++;

        // Add a small delay between emails to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to send remainder to ->', user.email, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder sent successfully to ${sentCount} users. ${failedCount > 0 ? `(${failedCount} failed)` : ''}`,
      count: sentCount
    });

  } catch (error: any) {
    console.error('Failed to send setup reminders:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
