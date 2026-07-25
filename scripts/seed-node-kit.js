/**
 * Seed script: Node.js Backend Kit (deep rebuild).
 *
 * Replaces the 6-topic stub with a comprehensive kit. Chapters live as separate
 * data modules in scripts/node-content/ (ch1..chN) and are loaded here in order.
 * Content is authored as HTML to the same per-topic template as the Angular kit.
 *
 * Diagrams referenced in content with markers {{fig:filename.svg|ALT|CAPTION}},
 * resolved from node-diagrams/urls.json (written by scripts/upload-images.js --apply).
 *
 * Keeps slug `nodejs-backend-kit` so the "node" access mapping keeps working.
 *
 * Usage:
 *   node scripts/seed-node-kit.js                    # dry run — validate + print plan
 *   node scripts/seed-node-kit.js --apply            # write to MongoDB (skips if exists)
 *   node scripts/seed-node-kit.js --apply --force    # delete existing kit + reseed
 *   node scripts/seed-node-kit.js --apply --force --allow-missing-images
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apply = process.argv.includes('--apply');
const allowMissingImages = process.argv.includes('--allow-missing-images');
const force = process.argv.includes('--force');

/* ── Kit metadata (keep slug + branding of the existing Node kit) ── */
const KIT_META = {
  name: 'Node.js Backend Kit',
  slug: 'nodejs-backend-kit',
  description:
    'Master Node.js for backend interviews and real projects — the event loop, async patterns, ' +
    'streams, Express, REST APIs, databases, auth & security, testing, scaling and production, ' +
    'explained deeply with clear diagrams.',
  icon: '🟢',
  color: 'from-green-500 to-emerald-500',
  order: 1,
};

/* ── Load chapter modules (ch1..chN) in numeric order ── */
const contentDir = path.join(__dirname, 'node-content');
const chapterFiles = fs.readdirSync(contentDir)
  .filter((f) => /^ch\d+.*\.js$/.test(f))
  .sort((a, b) => parseInt(a.match(/^ch(\d+)/)[1], 10) - parseInt(b.match(/^ch(\d+)/)[1], 10));
const chapters = chapterFiles.map((f) => require(path.join(contentDir, f)));

/* ── Diagram manifest + marker resolution ── */
const manifestPath = path.join(__dirname, '..', 'node-diagrams', 'urls.json');
const DIAGRAMS = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : {};
const missingImages = [];

function resolveFigures(content) {
  return content.replace(/\{\{fig:([^|}]+)\|([^|}]*)\|([^}]*)\}\}/g, (_m, file, alt, caption) => {
    const url = DIAGRAMS[file.trim()];
    if (!url) missingImages.push(file.trim());
    return `<figure><img src="${url || ''}" alt="${alt.trim()}"${url ? '' : ' data-missing="true"'}>` +
      `<figcaption>${caption.trim()}</figcaption></figure>`;
  });
}

/* ── Validation: resolved content must open with a block-level tag ── */
const HTML_HEAD = /^\s*<(h[1-6]|p|div|pre|ul|ol|blockquote|table|section|article|figure|hr)[\s>]/i;

function build() {
  const errors = [];
  const seenChapterSlugs = new Set();
  const builtChapters = chapters.map((ch) => {
    if (seenChapterSlugs.has(ch.slug)) errors.push(`Duplicate chapter slug: ${ch.slug}`);
    seenChapterSlugs.add(ch.slug);
    const seenTopicSlugs = new Set();
    const topics = ch.topics.map((t) => {
      if (seenTopicSlugs.has(t.slug)) errors.push(`Duplicate topic slug in ${ch.slug}: ${t.slug}`);
      seenTopicSlugs.add(t.slug);
      const content = resolveFigures(t.content);
      if (!HTML_HEAD.test(content)) {
        errors.push(`Topic "${ch.slug}/${t.slug}" does not start with a block tag — reader would mis-parse as Markdown.`);
      }
      return { ...t, content };
    });
    return { title: ch.title, slug: ch.slug, order: ch.order, topics };
  });
  return { builtChapters, errors };
}

/* ── Mongoose schemas (mirror lib/models, avoid TS build) ── */
const KitSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, description: String,
  icon: String, color: String, order: Number, purchasesCount: { type: Number, default: 0 },
}, { timestamps: true });
const ChapterSchema = new mongoose.Schema({
  kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' },
  title: String, slug: String, order: Number,
}, { timestamps: true });
const TopicSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' },
  title: String, slug: String, content: { type: String, default: '' }, order: Number,
}, { timestamps: true });

async function main() {
  const { builtChapters, errors } = build();
  if (errors.length) {
    console.error('❌ Content validation failed:');
    errors.forEach((e) => console.error('   - ' + e));
    process.exit(1);
  }

  const topicCount = builtChapters.reduce((n, c) => n + c.topics.length, 0);
  console.log(`${apply ? '🚀 SEEDING' : '🔍 DRY RUN'} — kit "${KIT_META.slug}"`);
  console.log(`   Loaded ${chapterFiles.length} chapter file(s).`);
  console.log(`   ${builtChapters.length} chapter(s), ${topicCount} topic(s) — all start with a valid block tag ✅`);

  if (missingImages.length) {
    const unique = [...new Set(missingImages)];
    console.warn(`\n⚠️  ${unique.length} diagram(s) have no Cloudinary URL yet.`);
    console.warn('   Run:  node scripts/upload-images.js ./node-diagrams --apply');
    if (apply && !allowMissingImages) {
      console.error('\n❌ Refusing to seed live content with missing images. Upload first, or pass --allow-missing-images.');
      process.exit(1);
    }
  }

  if (!apply) {
    builtChapters.forEach((c) => console.log(`   • ${c.order}. ${c.title} (${c.topics.length} topics)`));
    console.log('\nRun again with --apply to write to MongoDB.');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(MONGODB_URI);

  const Kit = mongoose.models.Kit || mongoose.model('Kit', KitSchema);
  const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
  const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

  const existing = await Kit.findOne({ slug: KIT_META.slug });
  if (existing) {
    if (!force) {
      console.log(`↩️  Kit "${KIT_META.slug}" already exists — skipping. Re-run with --force to replace.`);
      await mongoose.disconnect();
      return;
    }
    const delTopics = await Topic.deleteMany({ kitId: existing._id });
    const delChapters = await Chapter.deleteMany({ kitId: existing._id });
    await Kit.deleteOne({ _id: existing._id });
    console.log(`♻️  --force: removed existing kit (${delChapters.deletedCount} chapters, ${delTopics.deletedCount} topics).`);
  }

  const kitDoc = await Kit.create({ ...KIT_META });
  for (const ch of builtChapters) {
    const chDoc = await Chapter.create({ kitId: kitDoc._id, title: ch.title, slug: ch.slug, order: ch.order });
    for (const t of ch.topics) {
      await Topic.create({
        kitId: kitDoc._id, chapterId: chDoc._id,
        title: t.title, slug: t.slug, content: t.content, order: t.order,
      });
    }
    console.log(`   ✅ ${ch.title} — ${ch.topics.length} topics`);
  }
  console.log(`\n✅ Seeded "${KIT_META.name}" (${builtChapters.length} chapters, ${topicCount} topics).`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
