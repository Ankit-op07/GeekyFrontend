import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../../lib/db';
import CompanyKitUser from '../../../../lib/models/CompanyKitUser';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

function buildResetEmail(resetLink: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family:sans-serif;background:#f4f6f9;padding:20px;">
  <div style="background:white;padding:30px;border-radius:10px;max-width:600px;margin:auto;">
    <h2 style="color:#764ba2;">Password Reset Request</h2>
    <p>We received a request to reset your password for Geeky Frontend.</p>
    <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#764ba2;color:white;text-decoration:none;border-radius:5px;margin-top:20px;margin-bottom:20px;">
      Reset Password
    </a>
    <p style="font-size:14px;color:#666;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectToDatabase();
        const user = await CompanyKitUser.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success even if not found to prevent email enumeration
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link was sent.' });
        }

        // Generate reset token using JWT
        const jwtSecret = process.env.JWT_SECRET || 'secret_key';
        const resetToken = jwt.sign({ id: user._id.toString(), type: 'reset' }, jwtSecret, { expiresIn: '15m' });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Geeky Frontend" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Reset Your Password - Geeky Frontend`,
            html: buildResetEmail(resetLink),
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: 'Password reset link sent.' });

    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
