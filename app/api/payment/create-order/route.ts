import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';
import { getKitById } from '@/lib/appConstants';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { computeUpgradePrice } from '@/lib/pricing';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { kitId, userEmail, userName, userMobile } = await request.json();

    if (!kitId || !userEmail) {
      return NextResponse.json({ error: 'Kit ID and email are required' }, { status: 400 });
    }

    const kit = getKitById(kitId);
    if (!kit) {
      return NextResponse.json({ error: 'Invalid kit ID' }, { status: 400 });
    }
    if (kit.comingSoon) {
      return NextResponse.json({ error: 'This kit is not available yet' }, { status: 400 });
    }

    /* ── Whose credit are we allowed to spend? ────────────────────────────
     * Credit may ONLY be applied to the email in the signed session cookie.
     * Otherwise anyone could pass userEmail=<someone-who-bought-a-lot> and
     * buy the bundle for ₹49 on a stranger's spend history.
     *
     * A logged-out buyer (the common case: first purchase) simply pays full
     * price — which is correct, as they have no prior spend anyway.
     * ─────────────────────────────────────────────────────────────────── */
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = token ? verifySessionToken(token) : null;

    const sessionEmail = session?.email?.toLowerCase().trim();
    const requestedEmail = String(userEmail).toLowerCase().trim();
    const creditEligibleEmail = sessionEmail === requestedEmail ? sessionEmail : null;

    /* ── Price is computed HERE, from the DB. Never from the client. ───── */
    const quote = await computeUpgradePrice(creditEligibleEmail, kitId);

    if (quote.alreadyOwned) {
      return NextResponse.json(
        { error: 'You already own this kit.', alreadyOwned: true },
        { status: 409 },
      );
    }

    const order = await razorpay.orders.create({
      amount: quote.payable * 100, // paise — server-computed, credit applied
      currency: 'INR',
      receipt: `${kitId}_${Date.now()}`,
      notes: {
        kitId,
        planName: kit.name, // canonical plan name → drives PLAN_TO_SLUGS access
        userEmail: requestedEmail,
        userName: userName || '',
        userMobile: userMobile || '',
        listPrice: String(quote.listPrice),
        creditApplied: String(quote.credit),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      // Echoed for display; the client cannot influence the charge.
      listPrice: quote.listPrice,
      creditApplied: quote.credit,
      payable: quote.payable,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
