/**
 * Cleanup Duplicate Pending Case Studies
 *
 * The Oct/Nov 2025 batch import created cleaned, approved copies
 * (case-study-N ids) of case studies that had come in through the submit flow
 * (UUID ids). The raw pending originals were never removed, so the Studio
 * "Pending Review" list shows 10 duplicates alongside genuinely new
 * submissions.
 *
 * Safety: a pending doc is only deleted when an APPROVED doc with the same
 * normalized title exists (pairs are re-derived at runtime, never hardcoded),
 * AND the pending doc predates or matches the approved twin's creation date.
 * Genuinely new pending submissions are never touched.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-case-studies.mjs             # dry-run
 *   node scripts/cleanup-duplicate-case-studies.mjs --execute   # delete dupes
 *
 * Reads go through the API CDN so dry-runs work while the live API is over
 * quota; --execute needs the live API and fails with 402 until quota resets.
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const DATASET = (args.find(a => a.startsWith('--dataset='))?.split('=')[1]) || 'production_2';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-04-24',
  useCdn: !EXECUTE,
});

console.log(`Project ${client.config().projectId} | dataset ${DATASET} | ${EXECUTE ? 'EXECUTE' : 'dry-run'}\n`);

const docs = await client.fetch(
  '*[_type=="caseStudy"]{_id, title, status, _createdAt, "slug": slug.current}'
);

const normTitle = (t) => {
  const s = typeof t === 'object' ? (t?.en ?? Object.values(t ?? {})[0]) : t;
  return (s ?? '').trim().toLowerCase();
};

const approvedByTitle = new Map();
for (const d of docs) {
  if (d.status === 'approved') approvedByTitle.set(normTitle(d.title), d);
}

const toDelete = [];
for (const d of docs) {
  if (d.status !== 'pending') continue;
  if (d._id.startsWith('drafts.')) continue; // handled with the published doc
  const twin = approvedByTitle.get(normTitle(d.title));
  if (!twin) continue;
  if (new Date(d._createdAt) > new Date(twin._createdAt)) {
    console.log(`⚠️  SKIP ${d._id} — pending is NEWER than approved twin ${twin._id}; review manually`);
    continue;
  }
  toDelete.push({ pending: d, approved: twin });
}

for (const { pending, approved } of toDelete) {
  console.log(`${EXECUTE ? 'DELETING' : 'would delete'} pending ${pending._id} (${pending._createdAt.slice(0, 10)})`);
  console.log(`   duplicate of approved ${approved._id} (${approved._createdAt.slice(0, 10)}) — "${normTitle(pending.title).slice(0, 60)}"`);
  if (EXECUTE) {
    // Delete the published pending doc AND any lingering draft counterpart so
    // it can't resurface in the Studio's Pending Review list.
    await client.transaction().delete(pending._id).delete(`drafts.${pending._id}`).commit();
    console.log('   ✅ deleted (incl. draft counterpart if any)');
  }
}

const deletedIds = new Set(toDelete.flatMap(({ pending }) => [pending._id, `drafts.${pending._id}`]));
const remainingPending = docs.filter(
  (d) =>
    d.status === 'pending' &&
    !deletedIds.has(d._id) &&
    // list draft-only docs once (skip drafts whose published copy is also listed)
    !(d._id.startsWith('drafts.') && docs.some((o) => o._id === d._id.slice(7)))
);
console.log(`\n${EXECUTE ? 'Deleted' : 'Would delete'} ${toDelete.length} duplicate pending docs.`);
console.log(`Genuinely pending submissions left for review: ${remainingPending.length}`);
for (const d of remainingPending) console.log(`   • ${d._id} | ${d._createdAt.slice(0, 10)} | ${normTitle(d.title).slice(0, 70)}`);
if (!EXECUTE) console.log('\nRe-run with --execute to apply (requires live-API quota).');
