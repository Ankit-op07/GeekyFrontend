/**
 * Migration: rename the "Complete Frontend Kit" content record.
 *
 *   "Complete Frontend Kit"  →  "Frontend System Design Kit"
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * The kit rename touched lib/appConstants.ts (pricing, checkout, plan names),
 * but the names shown in the dashboard and /learn come from the `kits`
 * collection in MongoDB — a different source of truth. Renaming the catalog
 * alone leaves the DB saying "Complete Frontend Kit" forever.
 *
 * WHAT THIS DOES *NOT* TOUCH
 * --------------------------
 *   • `slug` — UNCHANGED ("complete"). Access control (PLAN_TO_SLUGS), every
 *     /learn/<slug> URL, and all kitProgress records key off the slug. Changing
 *     it would revoke access and orphan every user's progress. Do not.
 *   • Chapters, Topics, content — untouched.
 *   • purchasesCount, order, icon — untouched.
 *
 * Only `name` and `description` change. The kit behaves exactly as before.
 *
 * Usage:
 *   node scripts/rename-complete-kit.js          # dry run — shows what WOULD change
 *   node scripts/rename-complete-kit.js --apply  # actually writes
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const APPLY = process.argv.includes('--apply');

const KitSchema = new mongoose.Schema({
    name: String, slug: { type: String, unique: true }, description: String,
    icon: String, color: String, order: Number, purchasesCount: { type: Number, default: 0 },
}, { timestamps: true });

const Kit = mongoose.models.Kit || mongoose.model('Kit', KitSchema);

const NEW_NAME = 'Frontend System Design Kit';
const NEW_DESCRIPTION =
    '42 frontend system design walkthroughs (RADIO framework) — plus 180 DSA problems, ' +
    '60 machine coding challenges, 35 JS coding challenges and 91 in-depth articles.';

(async () => {
    await mongoose.connect(MONGODB_URI);
    console.log(`\n${APPLY ? '🚀 APPLYING' : '🔍 DRY RUN'} — rename Complete Frontend Kit\n`);

    // Match on SLUG, not name — the slug is the stable identifier.
    const kit = await Kit.findOne({ slug: { $regex: 'complete', $options: 'i' } });

    if (!kit) {
        console.log('❌ No kit found with a slug matching "complete". Nothing to do.');
        console.log('   Existing kits:');
        for (const k of await Kit.find().select('name slug')) {
            console.log(`     - ${k.slug.padEnd(14)} "${k.name}"`);
        }
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log('  Kit found:');
    console.log(`    slug         ${kit.slug}   ← UNCHANGED (access + URLs depend on it)`);
    console.log(`    name         "${kit.name}"`);
    console.log(`              →  "${NEW_NAME}"`);
    console.log(`    description  "${(kit.description || '').slice(0, 60)}..."`);
    console.log(`              →  "${NEW_DESCRIPTION.slice(0, 60)}..."`);

    if (!APPLY) {
        console.log('\n  Dry run — nothing written. Re-run with --apply to commit.\n');
        await mongoose.disconnect();
        return;
    }

    kit.name = NEW_NAME;
    kit.description = NEW_DESCRIPTION;
    await kit.save();

    console.log('\n  ✅ Renamed. Slug untouched — existing buyers keep access, progress intact.\n');
    await mongoose.disconnect();
})().catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
