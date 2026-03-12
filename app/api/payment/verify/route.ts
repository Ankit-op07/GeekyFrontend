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

/* ── Beautiful New-User Welcome Email (no passwords!) ─────────── */
function buildNewUserEmail(opts: {
  userName: string;
  kitName: string;
  dashboardUrl: string;
  setPasswordUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Kit is Ready</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:32px 24px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:28px;">🚀</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 4px;">Your Kit is Ready!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Payment successful — let's get started</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px;">
      <p style="color:#1a1a2e;font-size:15px;margin:0 0 16px;">Hi <strong>${opts.userName}</strong>,</p>
      <p style="color:#44475a;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Thank you for your purchase! You now have full access to:
      </p>

      <!-- Kit Card -->
      <div style="background:#f8f7ff;border:1px solid #e8e5ff;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="color:#7c3aed;font-size:18px;font-weight:700;margin:0;">${opts.kitName}</p>
      </div>

      <!-- CTA: Start Learning -->
      <div style="text-align:center;margin:0 0 16px;">
        <a href="${opts.dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">
          Start Learning →
        </a>
      </div>

      <!-- CTA: Set Password -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${opts.setPasswordUrl}" style="display:inline-block;padding:10px 24px;background:#ffffff;color:#7c3aed;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:2px solid #7c3aed;">
          Set Your Password
        </a>
      </div>

      <!-- Info -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
        <p style="color:#166534;font-size:13px;line-height:1.5;margin:0;">
          <strong>🔑 Secure your account:</strong> Click "Set Your Password" above to create a password. This link expires in 24 hours.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;line-height:1.5;">
        If you didn't make this purchase, please contact us at support@geekyfrontend.com<br />
        © ${new Date().getFullYear()} Geeky Frontend. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/* ── Kit Added Email (returning user) ─────────────────────────── */
function buildKitAddedEmail(opts: {
  userName: string;
  kitName: string;
  dashboardUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kit Added</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:32px 24px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 4px;">Kit Added!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Your new kit is ready to use</p>
    </div>

    <div style="padding:28px 24px;">
      <p style="color:#1a1a2e;font-size:15px;margin:0 0 16px;">Hi <strong>${opts.userName}</strong>,</p>
      <p style="color:#44475a;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Your purchase was successful! We've added the following to your account:
      </p>

      <div style="background:#f8f7ff;border:1px solid #e8e5ff;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="color:#7c3aed;font-size:18px;font-weight:700;margin:0;">${opts.kitName}</p>
      </div>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="${opts.dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">
          Go to Dashboard →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;line-height:1.5;">
        © ${new Date().getFullYear()} Geeky Frontend. All rights reserved.
      </p>
    </div>
  </div>
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
        if (allowedSlugs === 'all') {
          await Kit.updateMany({}, { $inc: { purchasesCount: 1 } });
        } else if (allowedSlugs.size > 0) {
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

      if (isNewUser) {
        // Generate a secure set-password token (24h expiry)
        const jwtSecret = process.env.JWT_SECRET || 'secret_key';
        const setPasswordToken = jwt.sign(
          { id: user._id.toString(), type: 'set-password' },
          jwtSecret,
          { expiresIn: '24h' }
        );
        const setPasswordUrl = `${baseUrl}/reset-password?token=${setPasswordToken}`;

        await transporter.sendMail({
          from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
          to: userEmail,
          subject: `Your GeekyFrontend Kit is Ready 🚀`,
          html: buildNewUserEmail({
            userName: userName || user.name || 'there',
            kitName: planName || 'Interview Kit',
            dashboardUrl,
            setPasswordUrl,
          }),
        });
      } else {
        await transporter.sendMail({
          from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
          to: userEmail,
          subject: `✅ Kit added — ${planName || 'Your Kit'}`,
          html: buildKitAddedEmail({
            userName: user.name || 'there',
            kitName: planName || 'Interview Kit',
            dashboardUrl,
          }),
        });
      }
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