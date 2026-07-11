import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import CompanyKitUser from '@/lib/models/CompanyKitUser';

export const revalidate = 60; // cache 60s — this is public, non-personalised data

/**
 * ─── Social Proof: REAL orders only ────────────────────────────────────────
 *
 *  GET /api/social-proof/recent
 *
 *  Returns genuine recent purchases from the Order collection, plus a true
 *  total purchase count.
 *
 *  ⚠️  DO NOT ADD FABRICATED DATA TO THIS ENDPOINT.
 *  The component this feeds used to generate random Indian names and cities to
 *  fake "Aarav Sharma from Pune just bought the React Kit". That was removed on
 *  purpose. Moving fabrication from the client to the server does not make it
 *  true — it makes it deliberate. Our audience are developers; they open
 *  DevTools for fun. If there is nothing real to show, show nothing.
 *
 *  Never-empty is achieved with REAL data via two levers:
 *    1. A wide 30-day window (not "last hour"), with soft relative timestamps
 *       so no false recency is implied.
 *    2. A true aggregate count, which always has something to say.
 *
 *  Privacy: first name only. Never email, order id, payment id, or amount.
 * ──────────────────────────────────────────────────────────────────────────
 */

const WINDOW_DAYS = 30;
const MAX_ITEMS = 20;

/** Soft, honest relative time. Never claims more recency than we have. */
function softAgo(date: Date): string {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return 'in the last hour';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'last week' : `${weeks} weeks ago`;
}

/** First name only. Falls back to a neutral label — never to an invented name. */
function toFirstName(name?: string | null, email?: string | null): string | null {
    const fromName = name?.trim().split(/\s+/)[0];
    if (fromName && fromName.length > 1 && !fromName.includes('@')) {
        return fromName.charAt(0).toUpperCase() + fromName.slice(1);
    }
    // Users who bought before creating a profile may have no name. Use the
    // email local-part only if it looks like a name, else return null and let
    // the caller render "A developer".
    const local = email?.split('@')[0]?.replace(/[^a-zA-Z]/g, '');
    if (local && local.length > 2) {
        return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
    }
    return null;
}

export async function GET() {
    try {
        await connectToDatabase();

        const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

        // An Order row only exists after a signature-verified payment.captured
        // webhook, so every row here is a real, paid purchase.
        const orders = await Order.find({
            createdAt: { $gte: since },
            paymentId: { $exists: true, $nin: [null, ''] },
        })
            .sort({ createdAt: -1 })
            .limit(MAX_ITEMS)
            .select('email planName createdAt')
            .lean();

        // Join to users for a display name. One query, not N.
        const emails = Array.from(new Set(orders.map((o: any) => o.email)));
        const users = await CompanyKitUser.find({ email: { $in: emails } })
            .select('email name')
            .lean();
        const nameByEmail = new Map(users.map((u: any) => [u.email, u.name]));

        const recent = orders.map((o: any) => ({
            firstName: toFirstName(nameByEmail.get(o.email), o.email) ?? 'A developer',
            planName: o.planName,
            boughtAgo: softAgo(new Date(o.createdAt)),
        }));

        // True lifetime purchase count — always has something to say, and is
        // more persuasive than a single name anyway.
        const totalPurchases = await Order.countDocuments({
            paymentId: { $exists: true, $nin: [null, ''] },
        });

        return NextResponse.json(
            { recent, totalPurchases },
            { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
        );
    } catch (error) {
        console.error('Error loading social proof:', error);
        // Fail closed: an empty state is infinitely cheaper than a fake one.
        return NextResponse.json({ recent: [], totalPurchases: 0 });
    }
}
