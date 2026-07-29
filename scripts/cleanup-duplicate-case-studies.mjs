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

/** Deep-rewrite every reference to `fromId` so it points at `toId`, then
 *  dedupe reference items within the same array (re-pointing can create a
 *  double when the approved twin was already referenced alongside). */
function repointRefs(node, fromId, toId) {
  if (Array.isArray(node)) {
    const mapped = node.map((item) => repointRefs(item, fromId, toId));
    const seenRefs = new Set();
    return mapped.filter((item) => {
      const ref = item && typeof item === 'object' && item._ref;
      if (!ref) return true;
      if (seenRefs.has(ref)) return false;
      seenRefs.add(ref);
      return true;
    });
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = k === '_ref' && v === fromId ? toId : repointRefs(v, fromId, toId);
    }
    return out;
  }
  return node;
}

for (const { pending, approved } of toDelete) {
  console.log(`${EXECUTE ? 'DELETING' : 'would delete'} pending ${pending._id} (${pending._createdAt.slice(0, 10)})`);
  console.log(`   duplicate of approved ${approved._id} (${approved._createdAt.slice(0, 10)}) — "${normTitle(pending.title).slice(0, 60)}"`);

  // Re-point any referencing docs (e.g. regional-community pages featuring the
  // raw pending copy) to the approved twin — deletion is blocked otherwise.
  const referencing = await client.fetch('*[references($id)]', { id: pending._id });
  for (const refDoc of referencing) {
    console.log(`   ↪ repoint ref in ${refDoc._id}`);
    if (EXECUTE) {
      const { _rev, _updatedAt, _createdAt, ...rest } = repointRefs(refDoc, pending._id, approved._id);
      await client.createOrReplace(rest);
    }
  }

  if (EXECUTE) {
    // Delete the published pending doc AND any lingering draft counterpart so
    // it can't resurface in the Studio's Pending Review list.
    await client.transaction().delete(pending._id).delete(`drafts.${pending._id}`).commit();
    console.log('   ✅ deleted (incl. draft counterpart if any)');
  }
}

// Draft-only / unpublished duplicates: multiple distinct docs sharing a title
// where none is approved (e.g. double-submitted drafts). No canonical copy to
// keep, so these are reported for manual review in the Studio, never deleted.
const baseId = (id) => (id.startsWith('drafts.') ? id.slice(7) : id);
const unapprovedByTitle = new Map();
for (const d of docs) {
  const t = normTitle(d.title);
  if (d.status === 'approved' || approvedByTitle.has(t)) continue;
  if (!unapprovedByTitle.has(t)) unapprovedByTitle.set(t, new Map());
  unapprovedByTitle.get(t).set(baseId(d._id), d); // draft+published of same doc = one entry
}
const manualReview = [...unapprovedByTitle.entries()].filter(([, m]) => m.size > 1);
if (manualReview.length) {
  console.log('\n⚠️  UNPUBLISHED DUPLICATE GROUPS — review manually in Studio (not auto-deleted):');
  for (const [t, m] of manualReview) {
    console.log(`   "${t.slice(0, 60)}"`);
    for (const d of m.values()) console.log(`      • ${d._id} (${d._createdAt.slice(0, 10)}, ${d.status ?? 'no status'})`);
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
