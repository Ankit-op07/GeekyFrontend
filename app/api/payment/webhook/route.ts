import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';

// ============================================================
// CONFIGURATION
// ============================================================

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

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

const FOLDER_IDS: Record<string, string> = {
  'JS Interview Preparation Kit': process.env.JS_KIT_FOLDER_ID!,
  'Complete Frontend Interview Preparation Kit': process.env.COMPLETE_KIT_FOLDER_ID!,
  'Frontend Interview Experiences Kit': process.env.EXPERIENCES_KIT_FOLDER_ID!,
  'Reactjs Interview Preparation Kit': process.env.REACT_KIT_FOLDER_ID!,
  'Node.js Interview Preparation Kit': process.env.NODEJS_KIT_FOLDER_ID!,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

async function grantFolderAccess(folderId: string, userEmail: string) {
  try {
    // Public link access
    await drive.permissions.create({
      fileId: folderId,
      requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: false },
    });

    // User-specific access (may fail for non-Gmail users)
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: { role: 'reader', type: 'user', emailAddress: userEmail },
        sendNotificationEmail: false,
      });
    } catch {
      // Ignore - user might already have access or non-Gmail
    }

    const file = await drive.files.get({ fileId: folderId, fields: 'name,webViewLink' });
    return { success: true, folderLink: file.data.webViewLink, folderName: file.data.name };
  } catch (error: any) {
    console.error('Drive access error:', error.message);
    return { success: false, error: error.message };
  }
}

function buildEmailHtml(planName: string, userEmail: string, folderLink: string, orderId: string, paymentId: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f4f4;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
    <tr>
      <td style="padding:40px 30px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);text-align:center;">
        <h1 style="color:white;margin:0;font-size:28px;">Welcome to Geeky Frontend! 🎉</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 30px;background:white;">
        <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear Developer,</p>
        <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Thank you for purchasing the <strong>${planName}</strong>!
        </p>
        <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 30px;">
          Your payment has been verified. You now have immediate access to all materials.
        </p>
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:#f8f9fa;padding:20px;border-radius:8px;">
              <h2 style="color:#333;font-size:18px;margin:0 0 15px;">📚 Access Your Course:</h2>
              <table cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:5px;background:#4F46E5;">
                    <a href="${folderLink}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:16px;color:white;text-decoration:none;">
                      Open Course Materials →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#999;font-size:12px;margin:20px 0 0;">
                Or copy: <a href="${folderLink}" style="color:#4F46E5;">${folderLink}</a>
              </p>
            </td>
          </tr>
        </table>
        <div style="margin-top:30px;padding:20px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
          <p style="color:#856404;font-size:14px;margin:0;"><strong>💡 Tips:</strong></p>
          <ul style="color:#856404;font-size:14px;margin:10px 0 0;padding-left:20px;">
            <li>Shared with: <strong>${userEmail}</strong></li>
            <li>Find it in Google Drive → "Shared with me"</li>
          </ul>
        </div>
        <div style="margin-top:30px;padding-top:30px;border-top:1px solid #e0e0e0;">
          <h3 style="color:#333;font-size:16px;margin:0 0 10px;">Payment Details:</h3>
          <table style="color:#666;font-size:14px;">
            <tr><td style="padding:5px 0;">Order ID:</td><td style="padding:5px 0 5px 20px;"><strong>${orderId}</strong></td></tr>
            <tr><td style="padding:5px 0;">Payment ID:</td><td style="padding:5px 0 5px 20px;"><strong>${paymentId}</strong></td></tr>
            <tr><td style="padding:5px 0;">Course:</td><td style="padding:5px 0 5px 20px;"><strong>${planName}</strong></td></tr>
          </table>
        </div>
        <div style="margin-top:30px;">
          <p style="color:#666;font-size:14px;margin:0;">Need help? Email: support@geekyfrontend.com</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;background:#f8f9fa;text-align:center;">
        <p style="color:#999;font-size:12px;margin:0;">© 2025 Geeky Frontend. All rights reserved.</p>
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

    // Connect to database (optional)
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

      // Get plan name
      let planName = payment.notes?.planName;
      if (!planName && orderId) {
        try {
          const order = await razorpay.orders.fetch(orderId);
          planName = order.notes?.planName;
        } catch { }
      }
      planName = planName || 'Complete Frontend Interview Preparation Kit';
      console.log(`📋 Processing: ${userEmail} - ${planName}`);

      // Get folder ID
      const folderId = FOLDER_IDS[planName];
      if (!folderId) {
        console.error(`❌ No folder for plan: ${planName}`);
        return NextResponse.json({ message: 'Invalid plan' });
      }

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

      // Grant folder access
      const access = await grantFolderAccess(folderId, userEmail);
      if (!access.success || !access.folderLink) {
        console.error('❌ Drive access failed:', access.error);
        await updateOrderStatus(orderId, 'failed', dbConnected, access.error);
        return NextResponse.json({ message: 'Drive access failed' });
      }
      console.log(`✅ Access granted: ${access.folderLink}`);

      // Send email
      const emailHtml = buildEmailHtml(planName, userEmail, access.folderLink, orderId, paymentId);
      const emailSent = await sendEmailWithRetry(
        userEmail,
        `✅ Access Ready: ${planName} - Geeky Frontend`,
        emailHtml,
        `Your course is ready! Access here: ${access.folderLink}`
      );

      // Update order status
      if (emailSent) {
        await updateOrderStatus(orderId, 'email_sent', dbConnected);
      } else {
        await updateOrderStatus(orderId, 'failed', dbConnected, 'Email sending failed');
      }
    }

    return NextResponse.json({ message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}