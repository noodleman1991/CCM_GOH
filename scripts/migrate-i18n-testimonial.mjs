/**
 * Phase 2 i18n migration — Testimonial → Lane B (field-level localized objects).
 *
 * Copies legacy `title`/`body` into localized `jobTitle.en`/`quote.en`.
 * Idempotent. SAFE BY DEFAULT: dry-run unless you pass --apply.
 *
 *   node scripts/migrate-i18n-testimonial.mjs           # dry run
 *   node scripts/migrate-i18n-testimonial.mjs --apply   # writes
 */
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

const APPLY = process.argv.includes('--apply');

async function main() {
  if (!process.env.SANITY_API_EDITOR_TOKEN) {
    console.error('❌ SANITY_API_EDITOR_TOKEN missing.');
    process.exit(1);
  }

  const docs = await client.fetch(
    `*[_type == "testimonial" && (defined(title) || defined(body)) && !defined(jobTitle.en) && !defined(quote.en)]{_id, name, title, body}`
  );

  console.log(`\nTestimonials to migrate: ${docs.length}\n`);
  docs.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d._id} (${d.name || 'unnamed'})`);
    if (d.title) console.log(`     title → jobTitle.en: "${d.title}"`);
    if (d.body) console.log(`     body  → quote.en: ${d.body.length} block(s)`);
  });

  if (docs.length === 0) { console.log('\nNothing to migrate.'); return; }
  if (!APPLY) { console.log(`\n🟡 DRY RUN — no writes. Re-run with --apply (after a backup).`); return; }

  console.log(`\n🔴 APPLYING — migrating ${docs.length} testimonials...\n`);
  let tx = client.transaction();
  for (const d of docs) {
    const patch = {};
    if (d.title) patch.jobTitle = { en: d.title };
    if (d.body) patch.quote = { en: d.body };
    tx = tx.patch(d._id, (p) => p.set(patch));
  }
  await tx.commit();
  console.log(`✅ Migrated ${docs.length} testimonials (jobTitle.en / quote.en set).\n`);
}

main().catch((err) => { console.error('❌ Migration failed:', err.message); process.exit(1); });
