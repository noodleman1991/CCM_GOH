/**
 * Fix case-study status "source of truth" drift.
 *
 * Background: case studies are only public when `status == "approved"`. A batch
 * of case studies was imported/migrated with the default `status: "pending"`
 * and no `submittedBy` (they are not real user submissions awaiting review) —
 * so legitimate content shows "Pending Review" in the Studio and is hidden from
 * the public site. This script approves ONLY those imported docs and backfills
 * `publishedAt`. Genuine user submissions (those with `submittedBy`) are left
 * untouched so the review workflow is preserved.
 *
 * SAFE BY DEFAULT: dry-run unless you pass --apply.
 *
 *   node scripts/fix-imported-case-study-status.mjs           # dry run (lists)
 *   node scripts/fix-imported-case-study-status.mjs --apply   # writes changes
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

// Imported content = pending AND no submittedBy (not a real user submission).
const QUERY = `*[_type == "caseStudy" && status == "pending" && !defined(submittedBy)]{
  _id,
  "title": title.en,
  _createdAt,
  publishedAt
} | order(_createdAt)`;

async function main() {
  if (!process.env.SANITY_API_EDITOR_TOKEN) {
    console.error('❌ SANITY_API_EDITOR_TOKEN missing — cannot run.');
    process.exit(1);
  }

  const docs = await client.fetch(QUERY);

  console.log(`\nFound ${docs.length} imported pending case studies (no submittedBy):\n`);
  docs.forEach((d, i) => {
    console.log(`  ${i + 1}. ${(d.title || '(no title)').slice(0, 70)}`);
    console.log(`     ${d._id}  created ${(d._createdAt || '').slice(0, 10)}`);
  });

  if (docs.length === 0) {
    console.log('\nNothing to do.');
    return;
  }

  if (!APPLY) {
    console.log(`\n🟡 DRY RUN — no changes written.`);
    console.log(`   These would be set to status="approved" with publishedAt backfilled`);
    console.log(`   (preserving any existing publishedAt). Re-run with --apply to write.\n`);
    console.log(`   User-submitted pending docs (with submittedBy) are NOT touched.\n`);
    return;
  }

  console.log(`\n🔴 APPLYING — approving ${docs.length} documents...\n`);
  let tx = client.transaction();
  for (const d of docs) {
    tx = tx.patch(d._id, (p) =>
      p.set({
        status: 'approved',
        publishedAt: d.publishedAt || d._createdAt || new Date().toISOString(),
      })
    );
  }
  await tx.commit();
  console.log(`✅ Approved ${docs.length} imported case studies.`);
  console.log(`   (Run your search sync afterwards: pnpm sync:search)\n`);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
