import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      planName,
    } = await request.json();

    // Verify payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get folder ID based on plan
    const folderIds = {
      'JS Interview Preparation Kit': process.env.JS_KIT_FOLDER_ID!,
      'Complete Frontend Interview Preparation Kit': process.env.COMPLETE_KIT_FOLDER_ID!,
      'Frontend Interview Experiences Kit': process.env.EXPERIENCES_KIT_FOLDER_ID!,
    };

    const folderId = folderIds[planName as keyof typeof folderIds];

    if (folderId) {
      try {
        // Share folder with customer
        await drive.permissions.create({
          fileId: folderId,
          requestBody: {
            role: 'reader',
            type: 'user',
            emailAddress: userEmail,
          },
          sendNotificationEmail: false,
        });

        // Get folder link
        const folder = await drive.files.get({
          fileId: folderId,
          fields: 'name,webViewLink',
        });

        // Send email
        await transporter.sendMail({
          from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
          to: userEmail,
          subject: `Access Granted: ${planName}`,
          html: `
            <h2>Payment Successful! 🎉</h2>
            <p>Thank you for purchasing ${planName}!</p>
            <p>Access your materials here: 
            <a href="${folder.data.webViewLink}">Open Course Materials</a></p>
            <p>The folder has been shared with: ${userEmail}</p>
            <p>Payment ID: ${razorpay_payment_id}</p>
          `,
        });

        console.log(`Access granted to ${userEmail} for ${planName}`);
      } catch (error) {
        console.error('Error sharing folder:', error);
      }
    }

    return NextResponse.json({
      verified: true,
      message: 'Payment verified and access granted',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}