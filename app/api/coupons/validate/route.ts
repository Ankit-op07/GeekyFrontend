import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { computeUpgradePrice } from '@/lib/pricing';
import { getKitById } from '@/lib/appConstants';

export const runtime = 'nodejs';

/**
 * POST /api/coupons/validate  { kitId, code, email? }
 *
 * "Does this code work, and what would I pay?" — the Apply button on checkout.
 *
 * DISPLAY ONLY, like /api/payment/quote. It runs the identical server-side
 * evaluation that create-order will run again before charging, so the number
 * shown here is the number charged — but nothing it returns is trusted later.
 *
 * Deliberately returns 200 with `{ ok: false, message }` for a bad code rather
 * than a 4xx: a rejected coupon is a normal outcome of a form, not a client
 * error, and the page renders the message inline either way.
 */

/* ── Brute-force damper ─────────────────────────────────────────────────────
 * Codes are short and guessable by design (they get shared in reels and DMs),
 * so an unthrottled validate endpoint is a free oracle for enumerating live
 * campaigns. This is a best-effort, per-instance limiter: serverless runs many
 * instances and memory resets on cold start, so it slows a script down rather
 * than stopping one. That is the right trade here — the real protections are
 * that a discovered code still obeys its own limits, and that redemption is
 * capped and attributable. Move to a shared store only if abuse shows up. */
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 12;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || entry.resetAt < now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        // Opportunistic sweep so the map cannot grow without bound on a
        // long-lived instance. Cheap: it only runs on a fresh window.
        if (attempts.size > 5_000) {
            for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
        }
        return false;
    }

    entry.count += 1;
    return entry.count > MAX_ATTEMPTS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
    try {
        const { kitId, code, email } = await request.json();

        if (!kitId || typeof kitId !== 'string') {
            return NextResponse.json({ error: 'Missing kitId' }, { status: 400 });
        }
        const kit = getKitById(kitId);
        if (!kit || kit.comingSoon) {
            return NextResponse.json({ error: 'Unknown kit' }, { status: 404 });
        }
        if (!code || typeof code !== 'string') {
            return NextResponse.json({ ok: false, message: 'Enter a coupon code.' });
        }

        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        const session = token ? verifySessionToken(token) : null;

        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';
        if (rateLimited(session?.email ?? ip)) {
            return NextResponse.json(
                { ok: false, message: 'Too many attempts. Try again in a minute.' },
                { status: 429 },
            );
        }

        // A signed-in buyer's own email always wins over the body, so a crafted
        // request cannot check a code against someone else's history.
        const buyerEmail = session?.email ?? (typeof email === 'string' ? email : null);

        const quote = await computeUpgradePrice(session?.email ?? null, kitId, {
            couponCode: code,
            buyerEmail,
        });

        /* The quote goes back on BOTH paths. A refused code can still leave an
         * auto-apply offer standing (see computeUpgradePrice), so the page must
         * re-render the price even when the answer is "that code is no good" —
         * otherwise it would show a stale total next to the error. */
        const headers = { 'Cache-Control': 'private, no-store' };

        if (quote.couponError) {
            return NextResponse.json(
                {
                    ok: false,
                    reason: quote.couponError.reason,
                    message: quote.couponError.message,
                    coupon: quote.coupon,
                    quote,
                },
                { headers },
            );
        }

        return NextResponse.json({ ok: true, coupon: quote.coupon, quote }, { headers });
    } catch (error) {
        console.error('Coupon validation failed:', error);
        return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
    }
}
