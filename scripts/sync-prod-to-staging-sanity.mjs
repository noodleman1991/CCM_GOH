// Populate the staging Sanity dataset (development) from production (production_2)
// using the raw server export endpoint + the mutation API — avoids the
// @sanity/export@6.0.2 corruption bug and the paid `dataset copy` feature.
//
// Usage:
//   node scripts/sync-prod-to-staging-sanity.mjs            # dry run (counts only)
//   node scripts/sync-prod-to-staging-sanity.mjs --apply    # actually write
//
// Idempotent: uses createOrReplace so re-runs converge. Skips system docs.
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require(
  path.resolve("node_modules/.pnpm/@next+env@16.1.1/node_modules/@next/env/dist/index.js")
);
loadEnvConfig(process.cwd(), true);

const PID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const API = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2021-06-07";
const TOKEN = process.env.SANITY_API_WRITE_TOKEN;
const SOURCE = "production_2";
const TARGET = "development";
const apply = process.argv.includes("--apply");

if (!PID || !TOKEN) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN");
  process.exit(1);
}
if (TARGET === "production_2") {
  console.error("Refusing: target is production.");
  process.exit(1);
}

const auth = { Authorization: "Bearer " + TOKEN };

async function exportDocs(ds) {
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/export/${ds}`, { headers: auth });
  if (!r.ok) throw new Error(`export ${ds}: HTTP ${r.status}`);
  const text = await r.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    // Skip system docs (drafts are fine to carry; _.* / system are not exported anyway).
    .filter((d) => d._id && !d._id.startsWith("_."));
}

async function mutate(mutations) {
  // One transaction so references resolve across the whole set (order-independent).
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/mutate/${TARGET}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`mutate: HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

const docs = await exportDocs(SOURCE);
console.log(`Source ${SOURCE}: ${docs.length} docs`);
const byType = docs.reduce((m, d) => ((m[d._type] = (m[d._type] || 0) + 1), m), {});
console.log("By type:", Object.entries(byType).map(([t, n]) => `${t}:${n}`).join(", "));

if (!apply) {
  console.log("\nDRY RUN — pass --apply to write into", TARGET);
  process.exit(0);
}

// Single transaction → references resolve across the whole set regardless of order.
console.log(`Writing all ${docs.length} docs in one transaction…`);
await mutate(docs.map((doc) => ({ createOrReplace: doc })));
console.log(`Done. ${docs.length} docs written to ${TARGET}.`);
