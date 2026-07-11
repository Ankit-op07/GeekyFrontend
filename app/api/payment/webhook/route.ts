import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import { recordPurchase } from '@/lib/purchase';

// ============================================================
// CONFIGURATION
// ============================================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

/* ── Onboarding Email — same template used across the app ─────── */
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
          Questions? Email us at geekyfrontend@gmail.com<br>
          © ${new Date().getFullYear()} Geeky Frontend
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmailWithRetry(to: string, subject: string, html: string, text: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail({
        from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
        headers: { 'X-Priority': '1', 'X-MSMail-Priority': 'High', Importance: 'high' },
      });
      console.log(`✅ Email sent to ${to} (attempt ${attempt})`);
      return true;
    } catch (error: any) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

// ============================================================
// DATABASE HELPERS
// ============================================================

async function connectDB(): Promise<boolean> {
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ MONGODB_URI not configured - skipping database operations');
    return false;
  }
  try {
    await connectToDatabase();
    console.log('✅ Database connected');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkExistingOrder(orderId: string, dbConnected: boolean) {
  if (!dbConnected) return null;
  try {
    return await Order.findOne({ orderId });
  } catch (error: any) {
    console.error('⚠️ Order lookup failed:', error.message);
    return null;
  }
}

async function createOrder(data: any, dbConnected: boolean) {
  if (!dbConnected) return;
  try {
    await Order.create(data);
    console.log(`📦 Order ${data.orderId} saved to DB`);
  } catch (error: any) {
    console.error('⚠️ Failed to create order:', error.message);
  }
}

async function updateOrderStatus(orderId: string, status: string, dbConnected: boolean, errorMessage?: string) {
  if (!dbConnected) return;
  try {
    await Order.findOneAndUpdate({ orderId }, { status, ...(errorMessage && { errorMessage }) });
    console.log(`📦 Order ${orderId} updated to '${status}'`);
  } catch (error: any) {
    console.error('⚠️ Failed to update order:', error.message);
  }
}

// ============================================================
// MAIN WEBHOOK HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = request.headers.get('x-razorpay-signature');
    const body = await request.text();

    // Verify signature
    if (!signature || !verifySignature(body, signature, webhookSecret)) {
      console.error('❌ Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    console.log('✅ Signature verified');

    // Connect to database
    const dbConnected = await connectDB();

    // Parse event
    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Idempotency check
      const existingOrder = await checkExistingOrder(orderId, dbConnected);
      if (existingOrder?.status === 'email_sent') {
        console.log(`⏭️ Order ${orderId} already processed - skipping`);
        return NextResponse.json({ message: 'Already processed' });
      }

      // Get user email
      const userEmail = payment.email || payment.notes?.userEmail;
      if (!userEmail) {
        console.error('❌ No email in payment');
        return NextResponse.json({ message: 'Email missing' });
      }

      // Get plan name + user name (payment.notes, falling back to the order's notes)
      let orderNotes: Record<string, any> = payment.notes || {};
      if ((!orderNotes.planName || !orderNotes.userName) && orderId) {
        try {
          const order = await razorpay.orders.fetch(orderId);
          orderNotes = { ...order.notes, ...orderNotes };
        } catch { }
      }
      const planName = orderNotes.planName || 'Complete Frontend Interview Preparation Kit';
      const userName: string | undefined = orderNotes.userName || undefined;
      console.log(`📋 Processing: ${userEmail} - ${planName}`);

      // Save order to DB
      if (!existingOrder) {
        await createOrder({
          orderId,
          paymentId,
          email: userEmail,
          planName,
          amount: payment.amount,
          status: 'processing',
        }, dbConnected);
      }

      if (!dbConnected) {
        console.error('❌ Database not connected - cannot record purchase or send email');
        // Non-2xx so Razorpay retries this webhook later instead of treating
        // it as delivered — a transient DB outage must not permanently drop
        // the purchase/email for a user who already closed their browser.
        return NextResponse.json({ message: 'Database unavailable' }, { status: 500 });
      }

      // Create/update the user record and assign the purchased kit
      const { user } = await recordPurchase({
        email: userEmail,
        name: userName,
        planName,
        paymentId,
        orderId,
      });
      console.log(`✅ Purchase recorded for ${userEmail}: ${planName}`);

      // Build the onboarding email (Set Password step only for brand-new users)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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

      const emailHtml = buildOnboardingEmail({
        userName: userName || user.name || 'there',
        kitName: planName,
        email: userEmail,
        setPasswordUrl,
        dashboardUrl,
        loginUrl,
        hasPassword: userHasPassword,
      });

      // Send email
      const emailSent = await sendEmailWithRetry(
        userEmail,
        userHasPassword
          ? `✅ Kit added — ${planName}`
          : `🎉 Welcome to Geeky Frontend — Your ${planName} Access is Ready!`,
        emailHtml,
        `Access your course at: ${dashboardUrl}`
      );

      // Update order + user status
      if (emailSent) {
        user.lastOnboardingEmailSentAt = new Date();
        await user.save();
        await updateOrderStatus(orderId, 'email_sent', dbConnected);
      } else {
        await updateOrderStatus(orderId, 'failed', dbConnected, 'Email sending failed');
        // Non-2xx so Razorpay retries the webhook (with backoff, over the
        // next several hours) instead of accepting this as delivered — the
        // 3 in-process retries above can still lose to a transient outage,
        // and the user has no other path to get this email.
        return NextResponse.json({ message: 'Email sending failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
