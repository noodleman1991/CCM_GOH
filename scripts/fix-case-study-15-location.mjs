/**
 * case-study-15 ("Japan's Shinrin-yoku…") carries a Manila location from the
 * legacy backfill while its own locationText.country says "Japan":
 *   locationDisplayText "Manila, Philippines" · locationCountryCode PHL ·
 *   studyLocation 14.6,120.98 (Manila)
 * This re-points all three to Japan (Tokyo as the representative geopoint —
 * the study is nationwide).
 *
 * Dry-run by default. Apply with --execute; target another dataset with
 * --dataset=<name> (defaults to development).
 *
 *   node --env-file=.env.local scripts/fix-case-study-15-location.mjs --execute
 *   node --env-file=.env.local scripts/fix-case-study-15-location.mjs --dataset=production_2 --execute
 */
import { createClient } from '@sanity/client';

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const DATASET = (args.find((a) => a.startsWith('--dataset='))?.split('=')[1]) || 'development';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: DATASET,
  apiVersion: process.env.SANITY_API_VERSION || '2024-10-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const FIX = {
  locationDisplayText: 'Japan',
  locationCountryCode: 'JPN',
  studyLocation: { _type: 'geopoint', lat: 35.6762, lng: 139.6503 },
};

const doc = await client.fetch(
  `*[_id == "case-study-15"][0]{ "title": title.en, locationDisplayText, locationCountryCode, locationText, studyLocation }`
);
if (!doc) {
  console.error(`case-study-15 not found in dataset "${DATASET}" — nothing to do.`);
  process.exit(1);
}
console.log(`Dataset ${DATASET} | ${EXECUTE ? 'EXECUTE' : 'dry-run'}`);
console.log('current:', JSON.stringify(doc, null, 1));
console.log('would set:', JSON.stringify(FIX, null, 1));

if (doc.locationCountryCode !== 'PHL') {
  console.log('locationCountryCode is not PHL any more — already fixed? Skipping.');
  process.exit(0);
}
if (EXECUTE) {
  const res = await client.patch('case-study-15').set(FIX).commit();
  console.log('patched:', res._id, '→', res.locationDisplayText, res.locationCountryCode);
} else {
  console.log('Dry-run only. Re-run with --execute to apply.');
}
