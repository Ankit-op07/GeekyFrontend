import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { createSessionToken, getSessionCookieString } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, mode } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        await connectToDatabase();
        let user = await CompanyKitUser.findOne({ email: email.toLowerCase() });
        let isNewUser = false;

        if (mode === 'register') {
            // ── REGISTER MODE ───────────────────────
            if (user) {
                return NextResponse.json(
                    { error: 'An account with this email already exists. Try logging in instead.' },
                    { status: 409 }
                );
            }
            user = await CompanyKitUser.create({
                email: email.toLowerCase(),
                name: name || email.split('@')[0],
                password,
                emailVerified: true,
                subscriptionStatus: 'none',
                purchasedKits: [],
                completedQuestions: [],
            });
            isNewUser = true;
        } else {
            // ── LOGIN MODE ──────────────────────────
            if (!user) {
                return NextResponse.json(
                    { error: 'No account found with this email.' },
                    { status: 404 }
                );
            }
            if (user.password && user.password !== password) {
                return NextResponse.json(
                    { error: 'Incorrect email or password.' },
                    { status: 401 }
                );
            }
            // If user signed up via Google and has no password yet
            if (!user.password) {
                user.password = password;
                await user.save();
            }
        }

        // ── Set session cookie (same as Google auth) ──
        const sessionToken = createSessionToken({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
        });

        const response = NextResponse.json({
            success: true,
            isNewUser,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                purchasedKits: user.purchasedKits || [],
                mustChangePassword: user.mustChangePassword || false,
            },
        });

        response.headers.set('Set-Cookie', getSessionCookieString(sessionToken));
        return response;

    } catch (error) {
        console.error('Email auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
