import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Try to delete by MongoDB _id first, then by orderId
        let deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            deletedOrder = await Order.findOneAndDelete({ orderId: id });
        }

        if (!deletedOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Order deleted successfully',
            deletedOrder,
        });
    } catch (error: any) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        );
    }
}
