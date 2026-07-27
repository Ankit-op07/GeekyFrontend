import { NextResponse } from 'next/server';
import { getPromotedOffers } from '@/lib/coupons';

export const runtime = 'nodejs';

/**
 * GET /api/coupons/active
 *
 * Live offers worth advertising away from checkout — the dashboard banner.
 *
 * Only coupons explicitly flagged `promoted` are ever returned, so a private
 * partner or support code is not discoverable by reading our own API. Already
 * exhausted and expired offers are filtered out in getPromotedOffers(), so this
 * never advertises something that will fail at checkout.
 *
 * Carries no personalisation, so it is safe to cache briefly at the edge.
 */
export async function GET() {
    try {
        const offers = await getPromotedOffers(3);
        return NextResponse.json(
            { offers },
            { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
        );
    } catch (error) {
        console.error('Failed to load active offers:', error);
        // A banner is decoration — degrade to "no offers" rather than 500ing a
        // dashboard over it.
        return NextResponse.json({ offers: [] });
    }
}
