/**
 * Phase 2 i18n migration — FAQ → Lane B (field-level localized objects).
 *
 * Copies the legacy single-language `title`/`body` into the new localized
 * `question.en`/`answer.en`. Idempotent (skips docs already migrated).
 * SAFE BY DEFAULT: dry-run unless you pass --apply.
 *
 *   node scripts/migrate-i18n-faq.mjs           # dry run (lists)
 *   node scripts/migrate-i18n-faq.mjs --apply   # writes
 *
 * Run a dataset export backup BEFORE --apply.
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
    console.error('❌ SANITY_API_EDITOR_TOKEN missing — cannot run.');
    process.exit(1);
  }

  // FAQs that still need migration: have legacy title/body but no localized question.
  const docs = await client.fetch(
    `*[_type == "faq" && defined(title) && !defined(question.en)]{_id, title, body}`
  );

  console.log(`\nFAQs to migrate: ${docs.length}\n`);
  docs.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d._id}`);
    console.log(`     title → question.en: "${(d.title || '').slice(0, 60)}"`);
    console.log(`     body  → answer.en:   ${d.body ? `${d.body.length} block(s)` : '(empty)'}`);
  });

  if (docs.length === 0) {
    console.log('\nNothing to migrate.');
    return;
  }

  if (!APPLY) {
    console.log(`\n🟡 DRY RUN — no writes. Re-run with --apply (after a dataset backup).`);
    return;
  }

  console.log(`\n🔴 APPLYING — migrating ${docs.length} FAQs...\n`);
  let tx = client.transaction();
  for (const d of docs) {
    const patch = {};
    if (d.title) patch.question = { en: d.title };
    if (d.body) patch.answer = { en: d.body };
    tx = tx.patch(d._id, (p) => p.set(patch));
  }
  await tx.commit();
  console.log(`✅ Migrated ${docs.length} FAQs (question.en / answer.en set).`);
  console.log(`   Legacy title/body left in place; remove in a later cleanup once readers switch.\n`);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
