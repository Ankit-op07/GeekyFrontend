import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { computeUpgradePrice } from '@/lib/pricing';
import { getBonusesForKit, getBonusWorth, getDealsForKit } from '@/lib/offers';
import { getPromotedOffers } from '@/lib/coupons';
import { getKitById } from '@/lib/appConstants';

export const runtime = 'nodejs';

/**
 * GET /api/payment/offers?kit=<kitId>[&coupon=<code>][&email=<guest email>]
 *
 * Everything the checkout page needs to render its commercial layer, in ONE
 * round trip: the personalised quote, the free bonuses, a better-deal
 * suggestion, and any publicly advertised offer.
 *
 * It exists so /pay doesn't fan out four requests on load. All of it is
 * DISPLAY ONLY — create-order re-derives the charge from scratch.
 */
export async function GET(request: NextRequest) {
    try {
        const kitId = request.nextUrl.searchParams.get('kit');
        if (!kitId) return NextResponse.json({ error: 'Missing ?kit=' }, { status: 400 });

        const kit = getKitById(kitId);
        if (!kit) return NextResponse.json({ error: 'Unknown kit' }, { status: 404 });
        if (kit.comingSoon) {
            return NextResponse.json({ error: 'This kit is not available yet' }, { status: 400 });
        }

        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        const session = token ? verifySessionToken(token) : null;

        const couponCode = request.nextUrl.searchParams.get('coupon');
        // Session email wins over the query string — a link carrying someone
        // else's ?email= must not change what a signed-in buyer sees.
        const buyerEmail = session?.email ?? request.nextUrl.searchParams.get('email');

        const [quote, deals, promoted] = await Promise.all([
            computeUpgradePrice(session?.email ?? null, kitId, { couponCode, buyerEmail }),
            // Deals are a nice-to-have; a failure here must not cost us the
            // quote, which is the part the buyer actually needs to pay.
            getDealsForKit(session?.email ?? null, kitId).catch(() => []),
            getPromotedOffers(2).catch(() => []),
        ]);

        return NextResponse.json(
            {
                quote,
                bonuses: getBonusesForKit(kitId),
                bonusWorth: getBonusWorth(kitId),
                deals,
                // Don't advertise a code the buyer already has applied — it
                // reads as "you're missing out" while they are, in fact, on it.
                promotedOffers: promoted.filter((o) => o.code !== quote.coupon?.code),
            },
            { headers: { 'Cache-Control': 'private, no-store' } },
        );
    } catch (error) {
        console.error('Failed to build offers payload:', error);
        return NextResponse.json({ error: 'Failed to load offers' }, { status: 500 });
    }
}
