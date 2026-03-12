import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Find or create user
        let user = await CompanyKitUser.findOne({ email: email.toLowerCase() });

        if (user) {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        } else {
            user = await CompanyKitUser.create({
                email: email.toLowerCase(),
                name: email.split('@')[0],
                googleId: `email_${Date.now()}`,
                subscriptionStatus: 'none',
                completedQuestions: [],
                otp: otp,
                otpExpiry: otpExpiry,
            });
        }

        // For testing: Log OTP to console
        console.log(`\n========================================`);
        console.log(`OTP for ${email}: ${otp}`);
        console.log(`========================================\n`);

        // TODO: In production, send OTP via email service (Resend, SendGrid, etc.)
        // await sendEmail({
        //     to: email,
        //     subject: 'Your OTP for Company Wise Kit',
        //     body: `Your OTP is: ${otp}. Valid for 5 minutes.`
        // });

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}
