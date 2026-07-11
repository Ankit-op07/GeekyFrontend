import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { computeUpgradePrice } from '@/lib/pricing';
import { getKitById } from '@/lib/appConstants';

/**
 * GET /api/payment/quote?kit=<kitId>
 *
 * Returns what THIS user would pay for a kit, with their upgrade credit applied.
 *
 * This endpoint is for DISPLAY ONLY. `create-order` recomputes the price from
 * scratch and never trusts anything the client sends back — so a tampered quote
 * buys the attacker nothing.
 *
 * Works logged-out (returns full list price, zero credit).
 */
export async function GET(request: NextRequest) {
    try {
        const kitId = request.nextUrl.searchParams.get('kit');
        if (!kitId) {
            return NextResponse.json({ error: 'Missing ?kit=' }, { status: 400 });
        }

        const kit = getKitById(kitId);
        if (!kit) {
            return NextResponse.json({ error: 'Unknown kit' }, { status: 404 });
        }
        if (kit.comingSoon) {
            return NextResponse.json({ error: 'This kit is not available yet' }, { status: 400 });
        }

        // Session is optional — logged-out visitors get the plain list price.
        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        const session = token ? verifySessionToken(token) : null;

        const quote = await computeUpgradePrice(session?.email ?? null, kitId);

        return NextResponse.json(quote, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error: any) {
        console.error('Error building price quote:', error);
        return NextResponse.json({ error: 'Failed to build quote' }, { status: 500 });
    }
}
