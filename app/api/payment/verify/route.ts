import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import Kit from '@/lib/models/Kit';
import { createSessionToken, getSessionCookieString } from '@/lib/session';
import { getAllowedSlugs } from '@/lib/appConstants';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ── Onboarding Email — matches admin grant-access style ─────── */
function buildOnboardingEmail(opts: {
  userName: string;
  kitName: string;
  email: string;
  setPasswordUrl?: string;
  dashboardUrl: string;
  loginUrl: string;
  hasPassword?: boolean;
}): string {
  const showPasswordStep = !opts.hasPassword && opts.setPasswordUrl;
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
          Hi <strong>${opts.userName}</strong>! 👋
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Thank you for your purchase! You now have full access to the <strong>${opts.kitName}</strong>.${!opts.hasPassword ? ' An account has been created for you on Geeky Frontend.' : ''}
        </p>

        ${showPasswordStep ? `
        <!-- Step 1: Set Password -->
        <div style="background: #f0f4ff; border: 2px solid #667eea; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h2 style="color: #4338ca; font-size: 18px; margin: 0 0 10px 0;">🔐 Step 1: Set Your Password</h2>
          <p style="color: #555; font-size: 14px; margin: 0 0 15px 0;">
            First, set up a password for your account so you can log in anytime.
          </p>
          <table cellspacing="0" cellpadding="0">
            <tr>
              <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <a href="${opts.setPasswordUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: white; text-decoration: none; font-weight: bold;">
                  Set Your Password →
                </a>
              </td>
            </tr>
          </table>
          <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">⏰ This link expires in 24 hours</p>
        </div>
        ` : ''}

        <!-- ${showPasswordStep ? 'Step 2' : ''}: Access Course on Platform -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h2 style="color: white; font-size: 18px; margin: 0 0 10px 0;">📚 ${showPasswordStep ? 'Step 2: ' : ''}Access Your Course</h2>
          <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 15px 0;">
            ${showPasswordStep ? 'After setting your password, access' : 'Access'} your course materials directly on your dashboard.
          </p>
          <a href="${opts.dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: #667eea; background-color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go To Dashboard
          </a>
        </div>

        <!-- Quick Tips -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
            <strong>💡 Quick Tips:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
            <li>Your account email: <strong>${opts.email}</strong></li>
            <li>Login anytime at: <a href="${opts.loginUrl}" style="color: #667eea;">geekyfrontend.in/login</a></li>
          </ul>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 25px; background-color: #f8f9fa; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Questions? Email us at support@geekyfrontend.com<br>
          © ${new Date().getFullYear()} Geeky Frontend
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * POST /api/payment/verify
 * Verifies Razorpay signature, creates/updates user, assigns kit,
 * sets session cookie, sends appropriate email.
 *
 * New users: created WITHOUT a password. A secure "Set Password" JWT
 * token (24h expiry) is emailed instead of a temp password.
 */
export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      userName,
      planName,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment parameters' },
        { status: 400 }
      );
    }

    // --- Verify Razorpay signature ---
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig.length !== razorpay_signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpay_signature))) {
      console.error('❌ Payment signature mismatch');
      return NextResponse.json(
        { error: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    // --- Create/Update user record ---
    if (!userEmail) {
      return NextResponse.json({ success: true, message: 'Payment verified.' });
    }

    await connectToDatabase();
    let user = await CompanyKitUser.findOne({ email: userEmail.toLowerCase() });
    let isNewUser = false;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!user) {
      isNewUser = true;
      user = new CompanyKitUser({
        email: userEmail.toLowerCase(),
        name: userName || userEmail.split('@')[0],
        // No password — user will set one via the set-password link
        emailVerified: true,
        subscriptionStatus: 'active',
        purchasedKits: planName ? [planName] : [],
      });
    }

    // Add kit (avoid duplicates)
    if (planName && !user.purchasedKits?.includes(planName)) {
      if (!user.purchasedKits) user.purchasedKits = [];
      user.purchasedKits.push(planName);

      // Increment purchasesCount on corresponding Kits in the DB
      try {
        const allowedSlugs = getAllowedSlugs([planName]);
        if (allowedSlugs.size > 0) {
          const orConditions = Array.from(allowedSlugs).map(s => ({ slug: { $regex: s, $options: 'i' } }));
          await Kit.updateMany({ $or: orConditions }, { $inc: { purchasesCount: 1 } });
        }
      } catch (kitErr) {
        console.error('Failed to increment kit purchases:', kitErr);
      }
    }
    user.paymentId = razorpay_payment_id;
    user.orderId = razorpay_order_id;
    user.subscriptionStatus = 'active';
    await user.save();
    console.log(`✅ Purchase recorded for ${userEmail}: ${planName}`);

    // --- Create session cookie ---
    const sessionToken = createSessionToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    const cookieString = getSessionCookieString(sessionToken);

    // --- Send email ---
    try {
      const dashboardUrl = `${baseUrl}/dashboard`;
      const loginUrl = `${baseUrl}/login`;
      const userHasPassword = !!user.password;

      let setPasswordUrl: string | undefined;
      if (!userHasPassword) {
        const jwtSecret = process.env.JWT_SECRET || 'secret_key';
        const setPasswordToken = jwt.sign(
          { id: user._id.toString(), type: 'set-password' },
          jwtSecret,
          { expiresIn: '24h' }
        );
        setPasswordUrl = `${baseUrl}/reset-password?token=${setPasswordToken}`;
      }

      await transporter.sendMail({
        from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: userHasPassword
          ? `✅ Kit added — ${planName || 'Your Kit'}`
          : `🎉 Welcome to Geeky Frontend — Your ${planName || 'Kit'} Access is Ready!`,
        html: buildOnboardingEmail({
          userName: userName || user.name || 'there',
          kitName: planName || 'Interview Kit',
          email: userEmail,
          setPasswordUrl,
          dashboardUrl,
          loginUrl,
          hasPassword: userHasPassword,
        }),
      });
      console.log(`✉️ Email sent to ${userEmail}`);
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
    }

    // --- Return response with session cookie ---
    const response = NextResponse.json({
      success: true,
      message: isNewUser
        ? 'Payment verified, account created, and kit assigned.'
        : 'Payment verified and kit assigned.',
    });

    response.headers.set('Set-Cookie', cookieString);
    return response;

  } catch (error: any) {
    console.error('Payment verify error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}