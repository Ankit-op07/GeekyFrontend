/**
 * Bridge: slug-keyed Java quiz files  →  the authored/*.json files that
 * scripts/quiz-insert-authored.ts consumes.
 *
 * WHY THIS EXISTS
 * ---------------
 * quiz-insert-authored.ts is deliberately the ONLY thing that writes quiz rows,
 * and it identifies a topic by `topicId` — a Mongo ObjectId that does not exist
 * until the kit has been seeded. Authoring against ObjectIds would mean editing
 * generated ids by hand and re-editing every one of them after any `--force`
 * re-seed. So questions are authored against stable topic SLUGS in
 * scripts/java-quiz/*.json, and this script resolves slug → topicId at export
 * time. It writes files; it never touches the quizquestions collection.
 *
 * It also fails loudly on the two mistakes that matter:
 *   • a slug that matches no topic in the kit (typo, or renamed topic)
 *   • a Java question typed 'predict-output' — the verification gate executes
 *     snippets in a Node vm and cannot run Java, so such a question could never
 *     be honestly verified. PRD-009 §5.1.
 *
 * Usage:
 *   node scripts/java-quiz-export.js            # dry run — resolve and report
 *   node scripts/java-quiz-export.js --apply    # write the authored/*.json files
 *
 * Then, to actually import (this is the step that writes to the DB):
 *   QUIZ_SCRATCH=<dir> node --experimental-strip-types scripts/quiz-insert-authored.ts --apply
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apply = process.argv.includes('--apply');

const KIT_SLUG = 'java-interview-kit';
const QUIZ_DIR = path.join(__dirname, 'java-quiz');

/** Where quiz-insert-authored.ts looks for its input. Keep the two in sync. */
const SCRATCH = process.env.QUIZ_SCRATCH;
const OUT_DIR = SCRATCH ? path.join(SCRATCH, 'authored') : null;

const KitSchema = new mongoose.Schema({ name: String, slug: String }, { strict: false });
const TopicSchema = new mongoose.Schema(
  { kitId: mongoose.Schema.Types.ObjectId, title: String, slug: String },
  { strict: false },
);

function loadQuizFiles() {
  if (!fs.existsSync(QUIZ_DIR)) {
    console.error(`❌ ${QUIZ_DIR} does not exist`);
    process.exit(1);
  }
  const files = fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith('.json')).sort();
  const bySlug = new Map();
  const errors = [];

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(QUIZ_DIR, file), 'utf8'));
    for (const [slug, entry] of Object.entries(raw.topics || {})) {
      if (bySlug.has(slug)) errors.push(`Topic "${slug}" appears in two quiz files (second: ${file})`);
      const questions = entry.questions || [];
      questions.forEach((q, i) => {
        if (q.type === 'predict-output') {
          errors.push(
            `${file} → ${slug} q${i}: type 'predict-output' is not usable for Java — ` +
              `the verification gate executes snippets in a Node vm. Use 'concept'. (PRD-009 §5.1)`,
          );
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`${file} → ${slug} q${i}: fewer than 2 options`);
        } else if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          errors.push(`${file} → ${slug} q${i}: correctIndex out of range`);
        }
      });
      bySlug.set(slug, { file, questions });
    }
  }
  return { bySlug, errors, files };
}

async function main() {
  const { bySlug, errors, files } = loadQuizFiles();
  if (errors.length) {
    console.error('❌ Quiz validation failed:');
    errors.forEach((e) => console.error('   - ' + e));
    process.exit(1);
  }

  const total = [...bySlug.values()].reduce((n, e) => n + e.questions.length, 0);
  console.log(`${apply ? '✍️  EXPORT' : '🔍 DRY RUN'} — ${files.length} file(s), ${bySlug.size} topic(s), ${total} question(s)`);

  // Answer-position spread. quiz-insert-authored.ts refuses an import where one
  // index holds more than 40% of answers; catching it here saves a round trip.
  const positions = {};
  for (const { questions } of bySlug.values()) {
    for (const q of questions) positions[q.correctIndex] = (positions[q.correctIndex] || 0) + 1;
  }
  const worst = Object.entries(positions).sort((a, b) => b[1] - a[1])[0];
  console.log('   answer position spread: ' +
    Object.keys(positions).sort().map((k) => `[${k}] ${positions[k]}`).join('  '));
  if (worst && worst[1] / total > 0.4) {
    console.error(`\n❌ ${Math.round((worst[1] / total) * 100)}% of answers sit at index ${worst[0]} (limit 40%). Shuffle before importing.`);
    process.exit(1);
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set — needed to resolve topic slugs to ids.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const Kit = mongoose.models.Kit || mongoose.model('Kit', KitSchema);
  const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

  const kit = await Kit.findOne({ slug: KIT_SLUG }).lean();
  if (!kit) {
    console.error(`❌ Kit "${KIT_SLUG}" not found. Seed it first: node scripts/seed-java-kit.js --apply`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const topics = await Topic.find({ kitId: kit._id }).select('_id slug title').lean();
  const topicBySlug = new Map(topics.map((t) => [t.slug, t]));

  const unresolved = [...bySlug.keys()].filter((s) => !topicBySlug.has(s));
  if (unresolved.length) {
    console.error(`\n❌ ${unresolved.length} quiz slug(s) match no topic in the kit:`);
    unresolved.forEach((s) => console.error('   - ' + s));
    await mongoose.disconnect();
    process.exit(1);
  }

  const uncovered = topics.filter((t) => !bySlug.has(t.slug));
  if (uncovered.length) {
    console.warn(`\n⚠️  ${uncovered.length} topic(s) have no quiz questions yet:`);
    uncovered.forEach((t) => console.warn(`   - ${t.slug}`));
  }

  if (!apply) {
    console.log('\nWould write:');
    for (const [slug, { questions }] of bySlug) {
      console.log(`   ${slug}.json — ${questions.length} question(s) → topicId ${topicBySlug.get(slug)._id}`);
    }
    console.log('\nRun again with --apply (and QUIZ_SCRATCH set) to write the files.');
    await mongoose.disconnect();
    return;
  }

  if (!OUT_DIR) {
    console.error('❌ QUIZ_SCRATCH not set. Set it to the same directory quiz-insert-authored.ts reads from.');
    await mongoose.disconnect();
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [slug, { questions }] of bySlug) {
    const topic = topicBySlug.get(slug);
    /* ⚠️ kitId is REQUIRED, not decorative. quiz-insert-authored.ts does
     * `new ObjectId(rec.kitId)` — and ObjectId(undefined) silently mints a
     * BRAND NEW random id rather than throwing. Omitting it once produced 200
     * rows each pointing at a different non-existent kit: invisible to
     * /admin/quiz and to the metrics panel, which both filter by kitId, while
     * still being served to learners (that query keys off topicId). */
    const payload = {
      kitSlug: KIT_SLUG,
      kitId: String(kit._id),
      topicSlug: slug,
      topicTitle: topic.title,
      topicId: String(topic._id),
      questions,
    };
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(payload, null, 2));
    console.log(`   ✅ ${slug}.json — ${questions.length} question(s)`);
  }

  console.log(`\n✅ Wrote ${bySlug.size} file(s) to ${OUT_DIR}`);
  console.log('   Import with:');
  console.log(`   QUIZ_SCRATCH=${SCRATCH} node --experimental-strip-types scripts/quiz-insert-authored.ts --apply`);
  console.log('   ⚠️  Java questions cannot be vm-verified, so without a blind peer solve they land as DRAFT');
  console.log('      in the /admin/quiz review queue. That is the intended behaviour, not a failure.');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
