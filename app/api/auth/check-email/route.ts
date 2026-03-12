import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

/**
 * POST /api/auth/check-email
 * Returns whether an account with the given email already exists.
 * Used by guest checkout to prevent duplicate accounts.
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectToDatabase();
        const user = await CompanyKitUser.findOne({ email: email.toLowerCase() }).select('_id').lean();

        return NextResponse.json({ exists: !!user });
    } catch (error: any) {
        console.error('Check email error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
