/**
 * Assets-only reconciliation for the development dataset (one-off ops script).
 *
 * The dev dataset was populated docs-only: documents reference image/file
 * assets that have neither an asset document nor a binary in development, so
 * cdn.sanity.io 404s. This script scans EVERY document (drafts included) for
 * asset references, and for each referenced asset that 404s in development it
 * downloads the same content-hash binary from production_2 and uploads it into
 * development. Asset ids are content-hash-derived, so uploads land on the SAME
 * _id and all existing references heal. No content documents are modified.
 *
 * Run: node scripts/sync-dev-assets.mjs
 */
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dev = createClient({ projectId, dataset: 'development', token: process.env.SANITY_API_WRITE_TOKEN, apiVersion: '2024-04-24', useCdn: false, perspective: 'raw' });

// 1. Collect every referenced asset id from every document (drafts included).
const docs = await dev.fetch('*[!(_type match "sanity.**")]');
const blob = JSON.stringify(docs);
const refs = new Set([
  ...blob.matchAll(/"image-[a-f0-9]{40}-\d+x\d+-[a-z]+"/g),
  ...blob.matchAll(/"file-[a-f0-9]{40}-[a-z0-9]+"/g),
].map((m) => m[0].slice(1, -1)));
console.log(`development: ${docs.length} docs referencing ${refs.size} distinct assets`);

// 2. Asset id -> CDN URL for a given dataset.
function assetUrl(id, dataset) {
  const img = id.match(/^image-([a-f0-9]{40})-(\d+x\d+)-([a-z]+)$/);
  if (img) return `https://cdn.sanity.io/images/${projectId}/${dataset}/${img[1]}-${img[2]}.${img[3]}`;
  const file = id.match(/^file-([a-f0-9]{40})-([a-z0-9]+)$/);
  if (file) return `https://cdn.sanity.io/files/${projectId}/${dataset}/${file[1]}.${file[2]}`;
  return null;
}

let ok = 0, healed = 0, missingInProd = 0, failed = 0;
const queue = [...refs];
async function worker() {
  for (;;) {
    const id = queue.shift();
    if (!id) return;
    const devUrl = assetUrl(id, 'development');
    if (!devUrl) continue;
    try {
      const head = await fetch(devUrl, { method: 'HEAD' });
      if (head.ok) { ok++; continue; }
      const prodRes = await fetch(assetUrl(id, 'production_2'));
      if (!prodRes.ok) { missingInProd++; console.log(`  ✗ not in production_2 either: ${id}`); continue; }
      const buf = Buffer.from(await prodRes.arrayBuffer());
      const uploaded = await dev.assets.upload(id.startsWith('image-') ? 'image' : 'file', buf);
      if (uploaded._id !== id) console.log(`  ⚠ id mismatch: expected ${id}, got ${uploaded._id}`);
      healed++;
      if (healed % 25 === 0) console.log(`  …${healed} healed`);
    } catch (e) {
      failed++;
      console.log(`  ✗ ${id}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`\nDone. intact: ${ok}, healed: ${healed}, missing in prod too: ${missingInProd}, errors: ${failed}`);
