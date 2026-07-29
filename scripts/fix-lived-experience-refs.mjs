/**
 * Throwaway migration: livedExperience.region / .tags were written as plain
 * strings by a legacy backfill; schema + queries expect references.
 * Run with --apply to write; default is a dry run.
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply");
// Tags are a separate decision: 4 of the 5 legacy strings have no tag doc, and
// all 5 sit on every doc, so rewriting them would silently drop metadata.
const REGION_ONLY = process.argv.includes("--region-only");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-04-24",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// code -> regionalCommunity slug (mirrors lib/maps/region-codes.ts RC_SLUG_TO_REGION)
const REGION_TO_RC_SLUG = {
  ssa: "sub-saharan-africa",
  nawa: "northern-africa-and-western-asia",
  csa: "central-and-southern-asia",
  esea: "eastern-and-south-eastern-asia",
  lac: "latin-america-and-the-caribbean",
  oce: "oceania",
  enam: "europe-and-northern-america",
};

const isRef = (v) => v && typeof v === "object" && typeof v._ref === "string";

const [docs, communities, tags] = await Promise.all([
  client.fetch(`*[_type=="livedExperience"]{_id, title, region, tags}`),
  client.fetch(`*[_type=="regionalCommunity"]{_id, "slug": slug.current}`),
  client.fetch(`*[_type=="tag"]{_id, "slug": value.current}`),
]);

const communityBySlug = new Map(communities.map((c) => [c.slug, c._id]));
const tagBySlug = new Map(tags.map((t) => [t.slug, t._id]));
const tagById = new Map(tags.map((t) => [t._id, t._id]));

const unmappedRegions = new Set();
const unmappedTags = new Map(); // slug -> count
const tagFrequency = new Map();
const patches = [];

for (const doc of docs) {
  const set = {};

  // ---- region: "ssa" -> reference to the regionalCommunity
  if (typeof doc.region === "string") {
    const slug = REGION_TO_RC_SLUG[doc.region];
    const id = slug ? communityBySlug.get(slug) : undefined;
    if (id) set.region = { _type: "reference", _ref: id };
    else unmappedRegions.add(doc.region);
  }

  // ---- tags: ["climate-change", ...] -> [{_type:'reference', _ref:'tag-...'}]
  if (Array.isArray(doc.tags) && !REGION_ONLY) {
    const hasStrings = doc.tags.some((t) => typeof t === "string");
    if (hasStrings) {
      const next = [];
      const seen = new Set();
      for (const t of doc.tags) {
        if (isRef(t)) {
          if (!seen.has(t._ref)) { seen.add(t._ref); next.push({ ...t, _key: t._key || t._ref }); }
          continue;
        }
        if (typeof t !== "string") continue;
        tagFrequency.set(t, (tagFrequency.get(t) ?? 0) + 1);
        const id = tagBySlug.get(t) ?? tagById.get(t) ?? tagById.get(`tag-${t}`);
        if (!id) { unmappedTags.set(t, (unmappedTags.get(t) ?? 0) + 1); continue; }
        if (!seen.has(id)) { seen.add(id); next.push({ _type: "reference", _ref: id, _key: id }); }
      }
      set.tags = next;
    }
  }

  if (Object.keys(set).length) patches.push({ id: doc._id, set });
}

console.log(`docs scanned            : ${docs.length}`);
console.log(`docs needing a patch    : ${patches.length}`);
console.log(`region fixes            : ${patches.filter((p) => p.set.region).length}`);
console.log(`tag-array rewrites      : ${patches.filter((p) => p.set.tags).length}`);
console.log(`\nstring tag frequency:`);
for (const [t, n] of [...tagFrequency].sort((a, b) => b[1] - a[1])) {
  console.log(`   ${t.padEnd(22)} ${n}  ${tagBySlug.has(t) ? "-> " + tagBySlug.get(t) : "** NO MATCHING tag DOC **"}`);
}
if (unmappedRegions.size) console.log(`\nUNMAPPED region codes: ${[...unmappedRegions].join(", ")}`);
console.log(`\nsample patches:`);
for (const p of patches.slice(0, 3)) console.log("  ", p.id, JSON.stringify(p.set));

if (!APPLY) {
  console.log(`\nDRY RUN — nothing written. Re-run with --apply to commit.`);
  process.exit(0);
}

let tx = client.transaction();
for (const p of patches) tx = tx.patch(p.id, { set: p.set });
const res = await tx.commit();
console.log(`\nAPPLIED. transaction ${res.transactionId}, ${patches.length} docs patched.`);
