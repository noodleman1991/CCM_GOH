/**
 * Fix Lived Experience Tags Script
 *
 * 33/35 livedExperience docs hold `tags` as plain strings (a legacy backfill
 * from populate-lived-experience-videos.mjs) while the schema expects an array
 * of references to `tag` documents. The malformed data breaks the Studio tag
 * input on exactly those documents.
 *
 * Modes:
 *   map (default)   — convert each string to a reference to the closest
 *                     existing tag doc (see MAPPING below); unmapped strings
 *                     are dropped. Chosen by the user 2026-07-28.
 *   strip           — remove string entries entirely (keeps any valid
 *                     references), leaving docs ready for manual tagging.
 *
 * Usage:
 *   node scripts/fix-lived-experience-tags.mjs                # dry-run, map
 *   node scripts/fix-lived-experience-tags.mjs --mode=strip   # dry-run, strip
 *   node scripts/fix-lived-experience-tags.mjs --execute      # apply (map)
 *
 * Reads go through the API CDN so dry-runs work even while the live API is
 * over quota; --execute needs the live API (mutations) and will fail with
 * 402 plan_limit_reached until the quota resets.
 *
 * Env: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_WRITE_TOKEN from .env
 * (production values). Dataset defaults to production_2; override with
 * --dataset=<name>.
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const MODE = (args.find(a => a.startsWith('--mode='))?.split('=')[1]) || 'map';
const DATASET = (args.find(a => a.startsWith('--dataset='))?.split('=')[1]) || 'production_2';

if (!['strip', 'map'].includes(MODE)) {
  console.error(`Unknown --mode=${MODE} (use strip or map)`);
  process.exit(1);
}

// Legacy boilerplate string -> closest real tag value (null = drop entirely).
const MAPPING = {
  'climate-change': 'climate-change',
  'mental-health': 'mental-health-support',
  'climate-action': 'community-action',
  'community-stories': 'storytelling',
  'lived-experience': null, // every doc IS a lived experience — redundant
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-04-24',
  useCdn: !EXECUTE, // CDN for dry-runs; mutations must use the live API
});

console.log(`Project ${client.config().projectId} | dataset ${DATASET} | mode ${MODE} | ${EXECUTE ? 'EXECUTE' : 'dry-run'}\n`);

const [docs, tagDocs] = await Promise.all([
  client.fetch('*[_type=="livedExperience"]{_id, title, tags}'),
  client.fetch('*[_type=="tag"]{_id, "value": value.current}'),
]);
const tagIdByValue = Object.fromEntries(tagDocs.map(t => [t.value, t._id]));

let patched = 0;
for (const doc of docs) {
  const tags = doc.tags ?? [];
  const strings = tags.filter(t => typeof t === 'string');
  if (strings.length === 0) continue;

  const validRefs = tags.filter(t => t && typeof t === 'object' && t._ref);
  const mappedRefs =
    MODE === 'map'
      ? strings
          .map(s => MAPPING[s] && tagIdByValue[MAPPING[s]])
          .filter(Boolean)
          .map(id => ({ _type: 'reference', _ref: id, _key: id }))
      : [];

  // Merge, dedupe by _ref, keep existing valid refs first.
  const seen = new Set();
  const newTags = [...validRefs, ...mappedRefs].filter(r => !seen.has(r._ref) && seen.add(r._ref));

  const title = typeof doc.title === 'object' ? (doc.title.en ?? '?') : (doc.title ?? '?');
  console.log(`${doc._id} | "${String(title).slice(0, 50)}"`);
  console.log(`   strings dropped: [${strings.join(', ')}]`);
  console.log(`   tags after: ${newTags.length ? newTags.map(r => r._ref).join(', ') : '(empty — ready for manual tagging)'}`);

  if (EXECUTE) {
    await client.patch(doc._id).set({ tags: newTags }).commit();
    console.log('   ✅ patched');
  }
  patched++;
}

console.log(`\n${EXECUTE ? 'Patched' : 'Would patch'} ${patched}/${docs.length} documents.`);
if (!EXECUTE) console.log('Re-run with --execute to apply (requires live-API quota).');
