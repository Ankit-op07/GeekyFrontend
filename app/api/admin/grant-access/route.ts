import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function buildOnboardingEmail(course: string, email: string, setPasswordLink: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
    <tr>
      <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Geeky Frontend! 🎉</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your account is ready</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; background-color: white;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello! 👋
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Great news! You now have access to the <strong>${course}</strong>. An account has been created for you on Geeky Frontend.
        </p>

        <!-- Step 1: Set Password -->
        <div style="background: #f0f4ff; border: 2px solid #667eea; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h2 style="color: #4338ca; font-size: 18px; margin: 0 0 10px 0;">🔐 Step 1: Set Your Password</h2>
          <p style="color: #555; font-size: 14px; margin: 0 0 15px 0;">
            First, set up a password for your account so you can log in anytime.
          </p>
          <table cellspacing="0" cellpadding="0">
            <tr>
              <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <a href="${setPasswordLink}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: white; text-decoration: none; font-weight: bold;">
                  Set Your Password →
                </a>
              </td>
            </tr>
          </table>
          <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">⏰ This link expires in 24 hours</p>
        </div>

        <!-- Step 2: Access Course on Platform -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h2 style="color: white; font-size: 18px; margin: 0 0 10px 0;">📚 Step 2: Access Your Course</h2>
          <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 15px 0;">
            After logging in, you can access your course materials directly on your dashboard.
          </p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: #667eea; background-color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go To Dashboard
          </a>
        </div>

        <!-- Quick Tips -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
            <strong>💡 Quick Tips:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
            <li>Your account email: <strong>${email}</strong></li>
            <li>Login anytime at: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" style="color: #667eea;">geekyfrontend.com/login</a></li>
          </ul>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 25px; background-color: #f8f9fa; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Questions? Email us at support@geekyfrontend.com<br>
          © 2025 Geeky Frontend
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone, course, name } = await request.json();

    if (!email || !course) {
      return NextResponse.json({ error: 'Email and course are required' }, { status: 400 });
    }

    // 1. Create or update user account in the database
    await connectToDatabase();
    let user = await CompanyKitUser.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (user) {
      // User exists — add kit to purchasedKits if not already present
      if (!user.purchasedKits.includes(course)) {
        user.purchasedKits.push(course);
      }
      user.subscriptionStatus = 'active';
      await user.save();
    } else {
      // Create new user account
      isNewUser = true;
      user = await CompanyKitUser.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        mobile: phone || undefined,
        emailVerified: true,
        subscriptionStatus: 'active',
        purchasedKits: [course],
        completedQuestions: [],
        favoriteQuestions: [],
        mustChangePassword: true,
      });
    }

    // 2. Generate a set-password JWT token (24h expiry for admin-granted access)
    const jwtSecret = process.env.JWT_SECRET || 'secret_key';
    const setPasswordToken = jwt.sign(
      { id: user._id.toString(), type: 'set-password' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const setPasswordLink = `${baseUrl}/reset-password?token=${setPasswordToken}`;

    // 3. Send onboarding email
    const emailHtml = buildOnboardingEmail(course, email, setPasswordLink);

    await transporter.sendMail({
      from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Welcome to Geeky Frontend — Your ${course} Access is Ready!`,
      html: emailHtml,
      text: `Welcome to Geeky Frontend! Your account has been created. Set your password here: ${setPasswordLink} — Access your course dashboard at ${baseUrl}/dashboard`,
    });

    return NextResponse.json({
      success: true,
      message: `${isNewUser ? 'Account created' : 'Kit added'} and onboarding email sent to ${email}`,
    });

  } catch (error: any) {
    console.error('Admin grant access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
