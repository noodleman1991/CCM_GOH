// Phase 6 / B1: backfill the new short-code `region` field on regionalCommunity
// docs (from slug) and on content docs (from their relatedCommunity's region).
// Dry-run by default; pass --apply to write. Idempotent; refuses production.
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require(
  path.resolve("node_modules/.pnpm/@next+env@16.1.1/node_modules/@next/env/dist/index.js")
);
loadEnvConfig(process.cwd(), true);

const PID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const API = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2021-06-07";
const TOKEN = process.env.SANITY_API_EDITOR_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
const DS = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apply = process.argv.includes("--apply");

if (DS === "production_2") {
  console.error("Refusing: dataset is production. Run against the development (staging) dataset.");
  process.exit(1);
}

const SLUG_TO_SHORT = {
  "sub-saharan-africa": "ssa",
  "northern-africa-and-western-asia": "nawa",
  "central-and-southern-asia": "csa",
  "eastern-and-south-eastern-asia": "esea",
  "latin-america-and-the-caribbean": "lac",
  oceania: "oce",
  "europe-and-northern-america": "enam",
};

const auth = { Authorization: "Bearer " + TOKEN };
const q = async (query) => {
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/query/${DS}?query=${encodeURIComponent(query)}`, { headers: auth });
  return (await r.json()).result;
};
const mutate = async (mutations) => {
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/mutate/${DS}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`mutate HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
};

console.log(`Dataset: ${DS}  (apply=${apply})`);

// 1. regionalCommunity docs: region from slug
const rcs = await q(`*[_type=="regionalCommunity"]{_id, "slug": slug.current, region}`);
const rcMutations = [];
const rcRegionById = {};
for (const rc of rcs) {
  const code = SLUG_TO_SHORT[rc.slug];
  if (code) rcRegionById[rc._id] = code;
  if (code && rc.region !== code) rcMutations.push({ patch: { id: rc._id, set: { region: code } } });
}
console.log(`regionalCommunity: ${rcs.length} docs, ${rcMutations.length} need region set`);

// 2. content docs: region from relatedCommunity._ref
const contentMutations = [];
for (const type of ["caseStudy", "livedExperience", "newsPost"]) {
  const docs = await q(`*[_type=="${type}" && defined(relatedCommunity._ref)]{_id, "rc": relatedCommunity._ref, region}`);
  let n = 0;
  for (const d of docs) {
    const code = rcRegionById[d.rc] || null;
    if (code && d.region !== code) { contentMutations.push({ patch: { id: d._id, set: { region: code } } }); n++; }
  }
  console.log(`${type}: ${docs.length} with relatedCommunity, ${n} need region set`);
}

const all = [...rcMutations, ...contentMutations];
if (!apply) {
  console.log(`\nDRY RUN — ${all.length} patches pending. Re-run with --apply to write.`);
  process.exit(0);
}
if (all.length === 0) {
  console.log("Nothing to change — already up to date.");
  process.exit(0);
}
// Batch the patches.
for (let i = 0; i < all.length; i += 100) await mutate(all.slice(i, i + 100));
console.log(`Applied ${all.length} region patches to ${DS}.`);
