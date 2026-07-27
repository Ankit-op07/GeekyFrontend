/**
 * Seed script: Java Interview Kit (PRD-009).
 *
 * Creates the `java-interview-kit` Kit. Chapters live as separate data modules
 * in scripts/java-content/ (ch1..ch14) and are loaded here in filename order.
 * Content is authored as HTML to the PRD-009 §5 per-topic template.
 *
 * ── HOW DIAGRAMS DIFFER FROM THE ANGULAR KIT ──────────────────────────────
 * seed-angular-kit.js resolves {{fig:...}} into an <img> pointing at Cloudinary,
 * which means every diagram needs an upload round-trip before content can ship.
 * This kit INLINES the SVG source instead:
 *
 *   {{fig:filename.svg|ALT TEXT|CAPTION}}
 *     → <figure><svg …>…</svg><figcaption>CAPTION</figcaption></figure>
 *
 * read straight from scripts/java-content/diagrams/. Three reasons that is the
 * right trade here, all of them load-bearing:
 *   1. The diagrams are ANIMATED. They use the .gf-dash/.gf-pulse/.gf-seq
 *      classes defined in the reader's style block, which only work when the
 *      SVG is part of the page DOM — an <img> renders its own isolated
 *      document and would never see those rules.
 *   2. They are THEME-AWARE. Labels use `currentColor`, so they follow the
 *      reader's light/dark text colour. A flat PNG/SVG file cannot.
 *   3. No upload step, so a diagram fix ships with the content commit rather
 *      than needing Cloudinary credentials in the loop.
 *
 * The cost is document weight: an inlined diagram lives in Topic.content, so
 * topics are larger than the Angular kit's. That is checked below — see
 * MAX_TOPIC_BYTES.
 *
 * Idempotent — skips the kit if the slug already exists.
 *
 * Usage:
 *   node scripts/seed-java-kit.js                   # dry run — validate + print plan
 *   node scripts/seed-java-kit.js --apply           # first write to MongoDB
 *   node scripts/seed-java-kit.js --apply --update  # add/refresh chapters, KEEP topic _ids
 *   node scripts/seed-java-kit.js --apply --force   # delete + re-create the kit from scratch
 *
 * Use --update whenever the kit already exists. --force churns every Topic _id,
 * which orphans quiz questions and any saved progress that points at a topic.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
/** Add/refresh chapters on an existing kit without churning Topic _ids. */
const update = process.argv.includes('--update');

/* ── Kit metadata ──
 * ⚠️  The slug MUST contain "java-interview". Access is a substring test
 * (lib/learn-access.ts: kitSlug.includes(fragment)) against the fragments in
 * PLAN_TO_SLUGS, where this kit is registered as "java-interview". Renaming the
 * slug to something that does not contain that fragment locks out every buyer. */
const KIT_META = {
  name: 'Java Interview Kit',
  slug: 'java-interview-kit',
  description:
    'Master Java for interviews and real projects — OOP, collections internals, generics, ' +
    'concurrency, the JVM, modern Java 17/21 and Spring Boot, explained with animated diagrams ' +
    'and the exact questions interviewers ask.',
  icon: '☕',
  color: 'from-orange-500 to-red-600',
  order: 6,
};

/** A single topic larger than this is almost certainly a runaway diagram. */
const MAX_TOPIC_BYTES = 220 * 1024;

/* ── Load chapter modules (ch1..chN) in numeric order ── */
const contentDir = path.join(__dirname, 'java-content');
const chapterFiles = fs
  .readdirSync(contentDir)
  .filter((f) => /^ch\d+.*\.js$/.test(f))
  .sort((a, b) => parseInt(a.match(/^ch(\d+)/)[1], 10) - parseInt(b.match(/^ch(\d+)/)[1], 10));
const chapters = chapterFiles.map((f) => require(path.join(contentDir, f)));

/* ── Diagram inlining ── */
const diagramDir = path.join(contentDir, 'diagrams');
const missingImages = [];
const usedDiagrams = new Set();

/**
 * Strip the bits of a standalone .svg file that must not appear inline.
 * The XML prolog and DOCTYPE are illegal inside HTML, and a stray <?xml?> also
 * defeats the reader's first-tag HTML sniff if it ever led the content.
 */
function sanitizeSvg(svg) {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

// {{fig:filename.svg|ALT|CAPTION}} → captioned <figure> with the SVG inlined.
// Never image-first: the reader decides HTML-vs-Markdown from the first tag and
// neither <svg> nor <figure> leading is worth the risk, so topics open with a
// heading and figures always sit mid-content (PRD-009 §5).
function resolveFigures(content) {
  return content.replace(/\{\{fig:([^|}]+)\|([^|}]*)\|([^}]*)\}\}/g, (_m, file, alt, caption) => {
    const name = file.trim();
    const filePath = path.join(diagramDir, name);
    if (!fs.existsSync(filePath)) {
      missingImages.push(name);
      return `<figure data-missing="${name}"><figcaption>${caption.trim()}</figcaption></figure>`;
    }
    usedDiagrams.add(name);
    let svg = sanitizeSvg(fs.readFileSync(filePath, 'utf8'));
    // Accessibility: the marker's ALT text is the diagram's accessible name.
    // Authored SVGs carry role="img"; inject the label rather than trusting
    // each file to repeat it.
    svg = svg.replace(/<svg\b/, `<svg role="img" aria-label="${alt.trim().replace(/"/g, '&quot;')}"`);
    // Drop a duplicate role/aria-label if the file already had one.
    svg = svg.replace(/(<svg\b[^>]*?)\srole="img"([^>]*)\srole="img"/, '$1 role="img"$2');
    return `<figure>${svg}<figcaption>${caption.trim()}</figcaption></figure>`;
  });
}

/* ── Validation ──
 * The reader sniffs the FIRST tag to choose the HTML parser over Markdown
 * (app/learn/[kitSlug]/[topicSlug]/page.tsx). `img`, `svg` and `figure` are all
 * absent from that list, so content must open with a heading or paragraph. */
const HTML_HEAD = /^\s*<(h[1-6]|p|div|pre|ul|ol|blockquote|table|section|article|hr)[\s>]/i;

function build() {
  const errors = [];
  const warnings = [];
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
        errors.push(
          `Topic "${ch.slug}/${t.slug}" does not start with a block tag — the reader would mis-parse it as Markdown.`,
        );
      }
      const bytes = Buffer.byteLength(content, 'utf8');
      if (bytes > MAX_TOPIC_BYTES) {
        warnings.push(`Topic "${ch.slug}/${t.slug}" is ${(bytes / 1024).toFixed(0)}KB — unusually large.`);
      }
      return { ...t, content };
    });
    return { title: ch.title, slug: ch.slug, order: ch.order, topics };
  });
  return { builtChapters, errors, warnings };
}

/* ── Mongoose schemas (mirror lib/models, avoid TS build — same as seed-kits.js) ── */
const KitSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: String,
    icon: String,
    color: String,
    order: Number,
    purchasesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const ChapterSchema = new mongoose.Schema(
  { kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' }, title: String, slug: String, order: Number },
  { timestamps: true },
);
const TopicSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' },
    title: String,
    slug: String,
    content: { type: String, default: '' },
    order: Number,
  },
  { timestamps: true },
);

async function main() {
  const { builtChapters, errors, warnings } = build();

  if (errors.length) {
    console.error('❌ Content validation failed:');
    errors.forEach((e) => console.error('   - ' + e));
    process.exit(1);
  }

  const topicCount = builtChapters.reduce((n, c) => n + c.topics.length, 0);
  const totalBytes = builtChapters.reduce(
    (n, c) => n + c.topics.reduce((m, t) => m + Buffer.byteLength(t.content, 'utf8'), 0),
    0,
  );

  console.log(`${apply ? '🚀 SEEDING' : '🔍 DRY RUN'} — kit "${KIT_META.slug}"`);
  console.log(`   Loaded ${chapterFiles.length} chapter file(s)`);
  console.log(`   ${builtChapters.length} chapter(s), ${topicCount} topic(s), ${(totalBytes / 1024).toFixed(0)}KB of content`);
  console.log(`   ${usedDiagrams.size} diagram(s) inlined — all topics start with a valid block tag ✅`);

  warnings.forEach((w) => console.warn('   ⚠️  ' + w));

  if (missingImages.length) {
    const unique = [...new Set(missingImages)];
    console.error(`\n❌ ${unique.length} diagram file(s) referenced but not found in scripts/java-content/diagrams/:`);
    unique.forEach((f) => console.error('   - ' + f));
    // Unlike the Angular kit there is no upload step to be "pending" on: a
    // missing file here is a typo or a file that was never written, and
    // shipping the placeholder <figure> would leave a caption with no diagram.
    process.exit(1);
  }

  // Unused diagrams are not fatal, but they usually mean a renamed marker.
  if (fs.existsSync(diagramDir)) {
    const onDisk = fs.readdirSync(diagramDir).filter((f) => f.endsWith('.svg'));
    const orphans = onDisk.filter((f) => !usedDiagrams.has(f));
    if (orphans.length) {
      console.warn(`\n⚠️  ${orphans.length} diagram(s) on disk are referenced by no topic:`);
      orphans.forEach((f) => console.warn('   - ' + f));
    }
  }

  if (!apply) {
    builtChapters.forEach((c) => console.log(`   • ${c.order + 1}. ${c.title} (${c.topics.length} topics)`));
    console.log('\nRun again with --apply to write to MongoDB.');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);

  const Kit = mongoose.models.Kit || mongoose.model('Kit', KitSchema);
  const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
  const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

  const existing = await Kit.findOne({ slug: KIT_META.slug });

  /* ── --update: incremental, id-preserving ──────────────────────────────
   * The kit is authored chapter by chapter, so "add chapter 5" happens many
   * times. --force would satisfy that by deleting and re-creating everything,
   * which mints new Topic _ids on every run — orphaning quiz questions
   * (QuizQuestion.topicId) and any bookmark or progress row that points at a
   * topic. This mode upserts by slug instead, so ids survive.
   *
   * It never deletes: a chapter or topic removed from the source stays in the
   * DB and is reported as an orphan for a human to remove deliberately. */
  if (existing && update) {
    let addedCh = 0, updatedCh = 0, addedT = 0, updatedT = 0, unchangedT = 0;

    await Kit.updateOne({ _id: existing._id }, { $set: { ...KIT_META } });

    const sourceChapterSlugs = new Set();
    const sourceTopicSlugs = new Set();

    for (const ch of builtChapters) {
      sourceChapterSlugs.add(ch.slug);
      let chDoc = await Chapter.findOne({ kitId: existing._id, slug: ch.slug });
      if (chDoc) {
        await Chapter.updateOne({ _id: chDoc._id }, { $set: { title: ch.title, order: ch.order } });
        updatedCh++;
      } else {
        chDoc = await Chapter.create({ kitId: existing._id, title: ch.title, slug: ch.slug, order: ch.order });
        addedCh++;
      }

      for (const t of ch.topics) {
        sourceTopicSlugs.add(t.slug);
        const topicDoc = await Topic.findOne({ kitId: existing._id, slug: t.slug });
        if (!topicDoc) {
          await Topic.create({
            kitId: existing._id, chapterId: chDoc._id,
            title: t.title, slug: t.slug, content: t.content, order: t.order,
          });
          addedT++;
        } else if (
          topicDoc.content !== t.content ||
          topicDoc.title !== t.title ||
          topicDoc.order !== t.order ||
          String(topicDoc.chapterId) !== String(chDoc._id)
        ) {
          await Topic.updateOne(
            { _id: topicDoc._id },
            { $set: { title: t.title, content: t.content, order: t.order, chapterId: chDoc._id } },
          );
          updatedT++;
        } else {
          unchangedT++;
        }
      }
      console.log(`   ✅ ${ch.title} — ${ch.topics.length} topics`);
    }

    const orphanChapters = (await Chapter.find({ kitId: existing._id }).lean())
      .filter((c) => !sourceChapterSlugs.has(c.slug));
    const orphanTopics = (await Topic.find({ kitId: existing._id }).select('slug').lean())
      .filter((t) => !sourceTopicSlugs.has(t.slug));
    if (orphanChapters.length || orphanTopics.length) {
      console.warn(`\n⚠️  In the DB but no longer in the source (NOT deleted — remove by hand if intended):`);
      orphanChapters.forEach((c) => console.warn('   chapter: ' + c.slug));
      orphanTopics.forEach((t) => console.warn('   topic:   ' + t.slug));
    }

    console.log(
      `\n✅ Updated "${KIT_META.name}" — chapters: +${addedCh} new, ${updatedCh} touched · ` +
        `topics: +${addedT} new, ${updatedT} changed, ${unchangedT} unchanged. Topic _ids preserved.`,
    );
    await mongoose.disconnect();
    return;
  }

  if (existing) {
    if (!force) {
      console.log(
        `↩️  Kit "${KIT_META.slug}" already exists — skipping (idempotent).\n` +
          `   Use --update to add/refresh chapters while preserving topic _ids (what you almost always want),\n` +
          `   or --force to delete and re-create the kit from scratch.`,
      );
      await mongoose.disconnect();
      return;
    }
    // NOTE: --force churns Topic _ids. Quiz questions reference topicId, so
    // re-run scripts/quiz-insert-authored.ts afterwards or the kit's questions
    // will point at topics that no longer exist.
    const delTopics = await Topic.deleteMany({ kitId: existing._id });
    const delChapters = await Chapter.deleteMany({ kitId: existing._id });
    await Kit.deleteOne({ _id: existing._id });
    console.log(
      `♻️  --force: removed existing kit (${delChapters.deletedCount} chapters, ${delTopics.deletedCount} topics) before re-seeding.`,
    );
    console.log('   ⚠️  Topic _ids changed — re-import quiz questions for this kit.');
  }

  const kitDoc = await Kit.create({ ...KIT_META });
  for (const ch of builtChapters) {
    const chDoc = await Chapter.create({ kitId: kitDoc._id, title: ch.title, slug: ch.slug, order: ch.order });
    for (const t of ch.topics) {
      await Topic.create({
        kitId: kitDoc._id,
        chapterId: chDoc._id,
        title: t.title,
        slug: t.slug,
        content: t.content,
        order: t.order,
      });
    }
    console.log(`   ✅ ${ch.title} — ${ch.topics.length} topics`);
  }

  console.log(`\n✅ Seeded "${KIT_META.name}" (${builtChapters.length} chapters, ${topicCount} topics).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
