import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';

// ---------------------------------------------------------
// 1. CONFIGURATION
// ---------------------------------------------------------

// Google Drive setup with Service Account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Razorpay instance (Needed to fetch order details if notes are missing)
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ---------------------------------------------------------
// 2. HELPER FUNCTIONS
// ---------------------------------------------------------

// Grant folder access logic
async function grantFolderAccess(folderId: string, userEmail: string) {
  try {
    // Method 1: Create "anyone with link" permission (Instant Access)
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: false,
      },
    });

    // Method 2: Specific user permission (Backup)
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'user',
          emailAddress: userEmail,
        },
        sendNotificationEmail: false,
      });
    } catch (e) {
      console.log('Specific user share failed (likely non-gmail), relying on link access.');
    }

    // Get the shareable link
    const file = await drive.files.get({
      fileId: folderId,
      fields: 'name,webViewLink',
    });

    return {
      success: true,
      folderName: file.data.name,
      folderLink: file.data.webViewLink,
    };
  } catch (error: any) {
    console.error('Error granting access:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ---------------------------------------------------------
// 3. MAIN WEBHOOK LOGIC
// ---------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // A. Verify Signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = request.headers.get('x-razorpay-signature');
    const body = await request.text();

    if (!signature) {
      return NextResponse.json({ status: 401, error: 'Missing signature' }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('❌ Invalid Webhook Signature');
      console.error('   Expected:', expectedSignature);
      console.error('   Received:', signature);
      console.error('   Secret length:', webhookSecret?.length || 0);
      return NextResponse.json({ status: 400, error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ Signature verified successfully');

    // B. Connect to Database
    await connectToDatabase();

    // C. Parse Event
    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // ✅ IDEMPOTENCY CHECK: Skip if already processed
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder) {
        if (existingOrder.status === 'email_sent') {
          console.log(`⏭️ Skipping: Order ${orderId} already processed successfully`);
          return NextResponse.json({ status: 200, message: 'Already processed' });
        }
        // If status is 'processing' or 'failed', we'll retry
        console.log(`🔄 Retrying: Order ${orderId} (previous status: ${existingOrder.status})`);
      }

      // 1. Get User Email (Check payment entity first, then notes)
      const userEmail = payment.email || payment.notes?.userEmail;

      if (!userEmail) {
        console.error('Webhook Error: Email not found in payload');
        return NextResponse.json({ status: 200, message: 'Email missing' });
      }

      // 2. CRITICAL FIX: Get Plan Name (Payment Notes -> Order Fetch -> Fallback)
      let planName = payment.notes?.planName;

      // If planName is missing in payment, fetch the original Order
      if (!planName && payment.order_id) {
        try {
          console.log(`Searching for notes in Order ID: ${payment.order_id}`);
          const order = await razorpay.orders.fetch(payment.order_id);

          if (order.notes && order.notes.planName) {
            planName = order.notes.planName;
            console.log(`✅ Found Plan Name in Order: ${planName}`);
          }
        } catch (err) {
          console.error('Failed to fetch order details:', err);
        }
      }

      // Fallback if absolutely nothing is found
      if (!planName) {
        planName = 'Complete Frontend Interview Preparation Kit';
        console.log('⚠️ Using Fallback Plan Name');
      }

      // 3. Select Folder ID
      const folderIds: { [key: string]: string } = {
        'JS Interview Preparation Kit': process.env.JS_KIT_FOLDER_ID!,
        'Complete Frontend Interview Preparation Kit': process.env.COMPLETE_KIT_FOLDER_ID!,
        'Frontend Interview Experiences Kit': process.env.EXPERIENCES_KIT_FOLDER_ID!,
        'Reactjs Interview Preparation Kit': process.env.REACT_KIT_FOLDER_ID!,
        'Node.js Interview Preparation Kit': process.env.NODEJS_KIT_FOLDER_ID!,
      };

      const folderId = folderIds[planName];

      if (!folderId) {
        console.error(`ERROR: No Folder ID found for plan: "${planName}"`);
        return NextResponse.json({ status: 200, message: 'Plan ID not found' });
      }

      // ✅ SAVE ORDER TO DB (if new)
      if (!existingOrder) {
        await Order.create({
          orderId,
          paymentId: payment.id,
          email: userEmail,
          planName,
          amount: payment.amount,
          status: 'processing'
        });
        console.log(`📦 Order ${orderId} saved to DB (status: processing)`);
      }

      // 4. Grant Access
      const accessResult = await grantFolderAccess(folderId, userEmail);

      // ✅ FIX: Check BOTH success AND folderLink exist
      if (!accessResult.success || !accessResult.folderLink) {
        console.error(`❌ CRITICAL: Drive access failed for ${userEmail}`, {
          orderId: payment.order_id,
          planName,
          error: accessResult.error || 'folderLink is undefined'
        });
        // Return 200 so Razorpay doesn't retry infinitely, but log the failure
        return NextResponse.json({ status: 200, message: 'Drive access failed' });
      }

      console.log(`✅ Drive access granted for ${userEmail}, link: ${accessResult.folderLink}`);

      // 5. Send Professional Email with RETRY LOGIC
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Geeky Frontend</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
            <tr>
              <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Geeky Frontend! 🎉</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px; background-color: white;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Dear Developer,
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for purchasing the <strong>${planName}</strong>!
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Your payment has been successfully verified. You now have immediate access to all course materials.
                </p>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                      <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">
                        📚 Access Your Course Materials:
                      </h2>
                      
                      <p style="color: #666; font-size: 14px; margin: 0 0 20px 0;">
                        Click the button below to access your course materials immediately:
                      </p>
                      
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="border-radius: 5px; background-color: #4F46E5;">
                            <a href="${accessResult.folderLink}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: white; text-decoration: none; border-radius: 5px;">
                              Open Course Materials →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${accessResult.folderLink}" style="color: #4F46E5; word-break: break-all;">
                          ${accessResult.folderLink}
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                  <p style="color: #856404; font-size: 14px; margin: 0;">
                    <strong>💡 Quick Tips:</strong>
                  </p>
                  <ul style="color: #856404; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
                    <li>The folder has been shared with your email: <strong>${userEmail}</strong></li>
                    <li>You can also find it in Google Drive under "Shared with me"</li>
                    <li>You have view-only access to protect the content</li>
                  </ul>
                </div>
                
                <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                  <h3 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">
                    Payment Details:
                  </h3>
                  <table style="color: #666; font-size: 14px;">
                    <tr>
                      <td style="padding: 5px 0;">Order ID:</td>
                      <td style="padding: 5px 0 5px 20px;"><strong>${payment.order_id}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0;">Payment ID:</td>
                      <td style="padding: 5px 0 5px 20px;"><strong>${payment.id}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0;">Course:</td>
                      <td style="padding: 5px 0 5px 20px;"><strong>${planName}</strong></td>
                    </tr>
                  </table>
                </div>
                
                <div style="margin-top: 30px;">
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                    If you face any issues accessing the materials, please contact us immediately:
                  </p>
                  <ul style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                    <li>Email: support@geekyfrontend.com</li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #f8f9fa; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © 2025 Geeky Frontend. All rights reserved.<br>
                  This email was sent to ${userEmail}.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>`;

      // ✅ FIX: Retry email up to 3 times with delay
      const MAX_RETRIES = 3;
      let emailSent = false;
      let lastError: any = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await transporter.sendMail({
            from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Access Ready: ${planName} - Geeky Frontend`,
            text: `Your payment is successful! Access your course here: ${accessResult.folderLink}`,
            html: emailHtml,
            headers: {
              'X-Priority': '1',
              'X-MSMail-Priority': 'High',
              'Importance': 'high',
            },
          });
          console.log(`✅ Email sent successfully to ${userEmail} (attempt ${attempt})`);
          emailSent = true;
          break; // Success, exit loop
        } catch (emailError: any) {
          lastError = emailError;
          console.error(`❌ Email attempt ${attempt} failed for ${userEmail}:`, emailError.message);
          if (attempt < MAX_RETRIES) {
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!emailSent) {
        console.error(`❌ CRITICAL: All ${MAX_RETRIES} email attempts failed for ${userEmail}`, {
          orderId,
          planName,
          folderLink: accessResult.folderLink,
          error: lastError?.message
        });
        // ✅ UPDATE DB: Mark as failed
        await Order.findOneAndUpdate(
          { orderId },
          { status: 'failed', errorMessage: lastError?.message }
        );
      } else {
        // ✅ UPDATE DB: Mark as email_sent
        await Order.findOneAndUpdate(
          { orderId },
          { status: 'email_sent' }
        );
        console.log(`📦 Order ${orderId} updated to 'email_sent'`);
      }
    }

    return NextResponse.json({ status: 200, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ status: 500, error: 'Internal server error' }, { status: 500 });
  }
}