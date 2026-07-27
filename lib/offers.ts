import {
    KIT_CATALOG,
    BUNDLE_KIT_ID,
    BUNDLE_SLUGS,
    PLAN_TO_SLUGS,
    getKitById,
    getKitDisplayName,
} from '@/lib/appConstants';
import { computeUpgradePrice, getOwnedPlans } from '@/lib/pricing';

/**
 * ─── Bonuses & better-deal suggestions ─────────────────────────────────────
 *
 *  Two levers that raise order value without touching the price of the thing
 *  being bought:
 *
 *    BONUSES — platform features every buyer already gets, made VISIBLE at the
 *      moment of payment. Perceived value, not new entitlements.
 *
 *      ⚠️  Everything in BONUS_CATALOG must be something the platform really
 *      does today. This list is read at the exact moment a buyer decides to
 *      trust us; a bonus that doesn't exist is a refund and a bad review, not a
 *      clever upsell. If a feature is removed, remove its bonus in the same
 *      commit.
 *
 *    DEALS — "the thing you're about to buy is part of a better one". Prices
 *      come from computeUpgradePrice(), so a suggestion always quotes the
 *      buyer's REAL number with their upgrade credit applied — never a list
 *      price they won't be charged.
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface BonusItem {
    id: string;
    title: string;
    description: string;
    /** Indicative ₹ value, used only for the "worth ₹X" line. */
    worth: number;
    /** lucide-react icon name — the client maps it; this file stays server-safe. */
    icon: string;
}

/* Every bonus below maps to a feature that ships today.
 *
 * REMOVED, and why — both were promising things a buyer cannot actually reach:
 *   • 'ai-interview' — the AI Interview tab is still commented out of the
 *     dashboard nav (app/dashboard/page.tsx). Not launched.
 *   • 'company-bank' — company-wise questions are not open to buyers yet.
 *
 * Put them back the day they ship, not before. This list is read at the exact
 * moment someone decides to trust us with money. */
const BONUS_CATALOG: Record<string, BonusItem> = {
    'quiz': {
        id: 'quiz',
        title: 'End-of-topic self-checks',
        description: 'A quick MCQ at the foot of every lesson so you find the gaps before an interviewer does.',
        worth: 299,
        icon: 'ListChecks',
    },
    'progress': {
        id: 'progress',
        title: 'Progress, streaks & bookmarks',
        description: 'Resume exactly where you stopped, bookmark topics, and keep a daily streak going.',
        worth: 199,
        icon: 'Flame',
    },
    'updates': {
        id: 'updates',
        title: 'Lifetime updates',
        description: 'Every new topic, question and fix added to the kits you own — free, forever.',
        worth: 499,
        icon: 'RefreshCw',
    },
};

/** Bonuses shown with every purchase, in display order. */
const DEFAULT_BONUS_IDS = ['quiz', 'progress', 'updates'];

/**
 * Bonus overrides for specific SKUs. A kit absent from this map gets
 * DEFAULT_BONUS_IDS — so shipping a new kit needs no edit here.
 */
const BONUS_OVERRIDES: Record<string, string[]> = {};

export function getBonusesForKit(kitId: string): BonusItem[] {
    const ids = BONUS_OVERRIDES[kitId] ?? DEFAULT_BONUS_IDS;
    return ids.map((id) => BONUS_CATALOG[id]).filter(Boolean);
}

/** Combined indicative worth of a kit's bonuses, in ₹. Drives one headline line. */
export function getBonusWorth(kitId: string): number {
    return getBonusesForKit(kitId).reduce((sum, b) => sum + b.worth, 0);
}

/* ─── Better-deal suggestions ──────────────────────────────────────────── */

export interface KitDeal {
    kitId: string;
    name: string;
    tagline: string;
    /** Catalog price before any credit or coupon. */
    listPrice: number;
    /** What THIS buyer would actually pay, credit applied. */
    payable: number;
    /** Upgrade credit that would apply, in ₹. */
    credit: number;
    /** Extra ₹ over the kit they are currently looking at. Can be 0. */
    extraSpend: number;
    /** ₹ saved versus buying the contents separately. Only set for the bundle. */
    savings: number;
    /** One line explaining why this is being suggested. */
    reason: string;
    /** 'upgrade' — a superset of what they're viewing. 'addon' — adjacent kit. */
    type: 'upgrade' | 'addon';
    href: string;
}

/** Kits the bundle is built from — the only ones an "upgrade" suggestion fits. */
function isBundleComponent(kitId: string): boolean {
    const kit = getKitById(kitId);
    const slugs = kit ? PLAN_TO_SLUGS[kit.name] : undefined;
    if (!slugs?.length) return false;
    return slugs.every((slug) => BUNDLE_SLUGS.includes(slug));
}

/**
 * What else should this buyer see while looking at `kitId`?
 *
 * Deliberately quiet: it returns at most 2 suggestions, and NOTHING when the
 * buyer is already on the best deal. A checkout page that nags is a checkout
 * page people leave.
 *
 * @param email  buyer email (may be null) — decides credit and what's owned
 */
export async function getDealsForKit(
    email: string | null | undefined,
    kitId: string,
): Promise<KitDeal[]> {
    const current = getKitById(kitId);
    if (!current) return [];

    const ownedPlans = email ? await getOwnedPlans(email) : [];
    const owns = (id: string) => {
        const kit = getKitById(id);
        return !!kit && ownedPlans.includes(kit.name);
    };

    const deals: KitDeal[] = [];

    /* ── The upgrade: viewing a single kit that the bundle contains ───────── */
    if (isBundleComponent(kitId) && kitId !== BUNDLE_KIT_ID) {
        try {
            const bundle = await computeUpgradePrice(email ?? null, BUNDLE_KIT_ID);
            const currentQuote = await computeUpgradePrice(email ?? null, kitId);
            const extraSpend = Math.max(bundle.payable - currentQuote.payable, 0);
            const anchor = getKitById(BUNDLE_KIT_ID)?.originalPrice ?? bundle.listPrice;

            // Only pitch it if it is actually available and actually more.
            if (!bundle.alreadyOwned && extraSpend > 0) {
                deals.push({
                    kitId: BUNDLE_KIT_ID,
                    name: getKitDisplayName(BUNDLE_KIT_ID),
                    tagline: KIT_CATALOG[BUNDLE_KIT_ID].tagline,
                    listPrice: bundle.listPrice,
                    payable: bundle.payable,
                    credit: bundle.credit,
                    extraSpend,
                    savings: Math.max(anchor - bundle.payable, 0),
                    reason:
                        bundle.credit > 0
                            ? `Add ₹${extraSpend} to get all 3 kits — your ₹${bundle.credit} is already credited.`
                            : `Add ₹${extraSpend} and get all 3 kits instead of one.`,
                    type: 'upgrade',
                    href: `/pay?kit=${BUNDLE_KIT_ID}`,
                });
            }
        } catch {
            /* A failed quote must never break the checkout page — just show no deal. */
        }
    }

    /* ── Add-ons: kits the bundle does NOT contain ────────────────────────
     * Shown to bundle buyers (who have no upgrade left) and alongside an
     * upgrade when there is room. Never discounted here — this is a
     * cross-sell, and inventing a discount would contradict the coupon
     * system that owns that decision. */
    const addonIds = Object.values(KIT_CATALOG)
        .filter(
            (k) =>
                !k.comingSoon &&
                k.id !== kitId &&
                k.id !== BUNDLE_KIT_ID &&
                !isBundleComponent(k.id) &&
                !owns(k.id),
        )
        .map((k) => k.id);

    for (const addonId of addonIds) {
        if (deals.length >= 2) break;
        const kit = getKitById(addonId)!;
        deals.push({
            kitId: addonId,
            name: getKitDisplayName(addonId),
            tagline: kit.tagline,
            listPrice: kit.price,
            payable: kit.price, // standalone kits take no credit — Rule 1 in pricing-math.ts
            credit: 0,
            extraSpend: kit.price,
            savings: Math.max(kit.originalPrice - kit.price, 0),
            reason: `Round out your stack with the ${kit.badge?.toLowerCase() ?? ''} kit.`.replace('  ', ' '),
            type: 'addon',
            href: `/pay?kit=${addonId}`,
        });
    }

    return deals.slice(0, 2);
}
