import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../../lib/db';
import CompanyKitUser from '../../../../lib/models/CompanyKitUser';

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const jwtSecret = process.env.JWT_SECRET || 'secret_key';

        let decoded: any;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        if (decoded.type !== 'reset' && decoded.type !== 'set-password') {
            return NextResponse.json({ error: 'Invalid token type' }, { status: 400 });
        }

        await connectToDatabase();
        const user = await CompanyKitUser.findById(decoded.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.password = newPassword;
        user.mustChangePassword = false; // Clear the forced-change flag
        await user.save();

        return NextResponse.json({ success: true, message: 'Password has been reset successfully' });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
