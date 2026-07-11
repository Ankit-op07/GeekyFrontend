import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CompanyKitUser from '@/lib/models/CompanyKitUser';
import { requireAdmin } from '@/lib/admin-auth';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();

        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const deletedUser = await CompanyKitUser.findByIdAndDelete(id);

        if (!deletedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error: any) {
        console.error('Failed to delete platform user:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const forbidden = requireAdmin(request);
    if (forbidden) return forbidden;

    try {
        await connectToDatabase();
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { purchasedKits, name, email } = body;

        let updateData: any = {};
        if (purchasedKits !== undefined) updateData.purchasedKits = purchasedKits;
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const updatedUser = await CompanyKitUser.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser,
        });
    } catch (error: any) {
        console.error('Failed to update platform user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
