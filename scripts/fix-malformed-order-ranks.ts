/**
 * Fix Malformed orderRank Script
 *
 * @sanity/orderable-document-list stores `orderRank` as a LexoRank string
 * (`<bucket>|<base36 decimal>`, e.g. `0|10002w:`) and parses it unguarded. When
 * the Studio resolves the initial value for a new document of an orderable type
 * it takes the highest existing rank —
 *
 *     *[_type == $type]|order(orderRank desc)[0].orderRank
 *
 * — and calls `LexoRank.parse()` on it. `parse()` splits on `|` and hands part
 * two to `LexoDecimal.parse()`, so a value without a `|` throws "Cannot read
 * properties of undefined (reading 'indexOf')" and takes the Studio down.
 *
 * The three `profilePrompt` docs seeded by the old seed-profile-prompts.mjs hold
 * "000000"/"000001"/"000002" and hit exactly that. This script finds every
 * document whose `orderRank` the plugin cannot parse and rewrites it as a real
 * LexoRank, preserving the current relative order and placing the repaired docs
 * after any already-valid ranks of the same type.
 *
 * Usage:
 *   pnpm fix:order-ranks                                  # dry-run, production_2
 *   pnpm fix:order-ranks -- --dataset=development         # dry-run, development
 *   pnpm fix:order-ranks -- --execute                     # apply
 *   pnpm fix:order-ranks -- --dataset=development --execute
 *
 * Reads go through the API CDN so dry-runs work even while the live API is over
 * quota; --execute needs the live API (mutations) and will fail with 402
 * plan_limit_reached until the quota resets.
 *
 * Env: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_WRITE_TOKEN from .env.
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { isValidOrderRank, sequentialOrderRanks } from "../lib/order-rank";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const DATASET = args.find((a) => a.startsWith("--dataset="))?.split("=")[1] || "production_2";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-04-24",
  useCdn: !EXECUTE, // CDN for dry-runs; mutations must use the live API
});

console.log(
  `Project ${client.config().projectId} | dataset ${DATASET} | ${EXECUTE ? "EXECUTE" : "dry-run"}\n`,
);

interface RankedDoc {
  _id: string;
  _type: string;
  orderRank: string;
}

const docs: RankedDoc[] = await client.fetch(`*[defined(orderRank)]{_id, _type, orderRank}`);
const malformed = docs.filter((d) => !isValidOrderRank(d.orderRank));

console.log(`${docs.length} documents carry an orderRank; ${malformed.length} are malformed.\n`);

if (malformed.length === 0) {
  console.log("Nothing to fix.");
  process.exit(0);
}

const byType = new Map<string, RankedDoc[]>();
for (const doc of malformed) {
  byType.set(doc._type, [...(byType.get(doc._type) ?? []), doc]);
}

let patched = 0;
for (const [type, brokenDocs] of byType) {
  // Keep whatever order the broken values already implied ("000000" < "000001").
  const ordered = [...brokenDocs].sort((a, b) => a.orderRank.localeCompare(b.orderRank));

  // Slot the repaired docs after the highest valid rank of the same type, so
  // documents that already sort correctly do not move.
  const validRanks = docs
    .filter((d) => d._type === type && isValidOrderRank(d.orderRank))
    .map((d) => d.orderRank)
    .sort();
  const lastValidRank = validRanks.at(-1) ?? null;
  const ranks = sequentialOrderRanks(ordered.length, lastValidRank);

  console.log(`${type} — ${ordered.length} to repair (after ${lastValidRank ?? "the minimum rank"})`);
  for (const [i, doc] of ordered.entries()) {
    console.log(`   ${doc._id.padEnd(46)} ${JSON.stringify(doc.orderRank)} -> ${ranks[i]}`);

    if (EXECUTE) {
      await client.patch(doc._id).set({ orderRank: ranks[i] }).commit();
      console.log("   ✅ patched");
    }
    patched++;
  }
  console.log("");
}

console.log(`${EXECUTE ? "Patched" : "Would patch"} ${patched} document(s).`);
if (!EXECUTE) console.log("Re-run with --execute to apply (requires live-API quota).");
