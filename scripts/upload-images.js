/**
 * Bulk image uploader for learn-content diagrams.
 *
 * Uploads every image in a folder to the SAME Cloudinary account + folder
 * (`geeky-frontend/learn-content`) used by the admin editor
 * (app/api/admin/upload-image/route.ts), then writes a `urls.json` manifest
 * mapping each source filename -> Cloudinary secure_url. The seed script reads
 * that manifest to embed images into topic content.
 *
 * Idempotent: each file uploads with a stable public_id derived from its name
 * (folder + basename), so re-running OVERWRITES instead of creating duplicates.
 *
 * Usage:
 *   node scripts/upload-images.js ./angular-diagrams            # dry run (lists what would upload)
 *   node scripts/upload-images.js ./angular-diagrams --apply    # actually upload
 *
 * Env (already used by the app — no new vars):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const FOLDER = 'geeky-frontend/learn-content';
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

function fail(msg) { console.error(`❌ ${msg}`); process.exit(1); }

const srcDir = process.argv[2];
const apply = process.argv.includes('--apply');

if (!srcDir) fail('Usage: node scripts/upload-images.js <folder> [--apply]');
if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
  fail(`Not a directory: ${srcDir}`);
}

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (apply && (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)) {
  fail('Missing CLOUDINARY_* env vars (needed for --apply). Set them in .env');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// public_id keeps files grouped by their source folder name for easy lookup,
// e.g. angular-diagrams/ch1-architecture -> stable, overwrite-on-rerun.
function publicIdFor(fileName) {
  const base = path.basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const group = path.basename(path.resolve(srcDir)).toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
  return `${group}/${base}`;
}

async function main() {
  const files = fs.readdirSync(srcDir)
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) fail(`No images (${[...IMAGE_EXT].join(', ')}) found in ${srcDir}`);

  console.log(`${apply ? '🚀 UPLOADING' : '🔍 DRY RUN'} — ${files.length} image(s) from ${srcDir}\n`);

  // Preserve any URLs already recorded so a partial re-run doesn't lose them.
  const manifestPath = path.join(srcDir, 'urls.json');
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};

  let ok = 0, failed = 0;
  for (const file of files) {
    const publicId = publicIdFor(file);
    if (!apply) {
      console.log(`  would upload  ${file}  →  public_id: ${FOLDER}/${publicId}`);
      continue;
    }
    try {
      const res = await cloudinary.uploader.upload(path.join(srcDir, file), {
        folder: FOLDER,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: true,
        invalidate: true,
      });
      manifest[file] = res.secure_url;
      ok++;
      console.log(`  ✅ ${file}  →  ${res.secure_url}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ ${file}  —  ${err.message}`);
    }
  }

  if (apply) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\n📝 Wrote ${manifestPath}  (${ok} ok, ${failed} failed)`);
    console.log('   The seed script reads this manifest to embed image URLs.');
  } else {
    console.log('\nRun again with --apply to upload for real.');
  }
}

main().catch((e) => fail(e.message));
