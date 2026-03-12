import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

export async function POST(request: NextRequest) {
    try {
        const { sessionToken, questionId, action } = await request.json();

        if (!sessionToken || !questionId) {
            return NextResponse.json(
                { error: 'Session token and question ID required' },
                { status: 400 }
            );
        }

        // Decode session token
        let tokenData;
        try {
            tokenData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
        } catch {
            return NextResponse.json(
                { error: 'Invalid session token' },
                { status: 401 }
            );
        }

        if (tokenData.exp < Date.now()) {
            return NextResponse.json(
                { error: 'Session expired' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const user = await CompanyKitUser.findOne({ email: tokenData.email });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (action === 'complete') {
            // Add question to completed if not already there
            if (!user.completedQuestions.includes(questionId)) {
                user.completedQuestions.push(questionId);
            }
        } else if (action === 'uncomplete') {
            // Remove question from completed
            user.completedQuestions = user.completedQuestions.filter(
                (q: string) => q !== questionId
            );
        }

        await user.save();

        return NextResponse.json({
            success: true,
            completedQuestions: user.completedQuestions,
        });

    } catch (error) {
        console.error('Update progress error:', error);
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
}
