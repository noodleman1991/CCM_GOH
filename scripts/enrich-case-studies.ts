/**
 * Editorial enrichment for approved case studies (npx tsx scripts/enrich-case-studies.ts)
 *
 * Fills the fields the 2026-07-28 audit found missing on every approved doc,
 * using an explicit per-document table derived from each study's title,
 * excerpt and location (reviewable below — nothing is inferred at runtime):
 *   - topic (schema topicOptions), themes + populations (fixed taxonomies)
 *   - tags: 3–4 refs into the real 41-tag vocabulary (resolved by value)
 *   - studyLocation geopoint + locationPrecision (city/country centroids;
 *     Zaatari camp is exact)
 *   - authors: converts the legacy [{_ref: author-ccm-case-studies}] reference
 *     shape to the schema's inline {name, role} objects ("CCM Community");
 *     case-study-29 credits its named author (Dr Olivia Yates, per excerpt)
 *
 * Usage:
 *   npx tsx scripts/enrich-case-studies.ts             # dry-run
 *   npx tsx scripts/enrich-case-studies.ts --execute   # apply
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const EXECUTE = process.argv.includes("--execute");
const DATASET = process.argv.find((a) => a.startsWith("--dataset="))?.split("=")[1] || "production_2";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-04-24",
  useCdn: false,
});

type Row = {
  topic: string;
  themes?: string[];
  populations?: string[];
  tags: string[]; // tag `value.current`s, resolved to _refs at runtime
  geo: { lat: number; lng: number; precision: "exact" | "city" | "country" };
  display?: string; // locationDisplayText override
  author?: { name: string; role: string };
};

const T: Record<string, Row> = {
  "case-study-11": { topic: "mental-health", themes: [], populations: [],
    tags: ["drought", "heatwaves", "mental-health-support"],
    geo: { lat: 33.94, lng: 67.71, precision: "country" } },
  "case-study-12": { topic: "mental-health", themes: ["livelihoods"], populations: [],
    tags: ["climate-justice", "vulnerable-populations", "mental-health-support"],
    geo: { lat: 22.75, lng: 89.25, precision: "city" } },
  "case-study-13": { topic: "mental-health", themes: ["indigenous"], populations: ["indigenous"],
    tags: ["indigenous-communities", "mental-health-support", "climate-change"],
    geo: { lat: 23.61, lng: 85.28, precision: "city" } },
  "case-study-14": { topic: "technology-innovation", themes: ["displacement"], populations: ["displaced"],
    tags: ["flooding", "mental-health-support", "resilience"],
    geo: { lat: 24.656, lng: 68.837, precision: "city" } },
  "case-study-15": { topic: "mental-health", themes: [], populations: [],
    tags: ["connection-to-nature", "coping-strategies", "mental-health-support"],
    geo: { lat: 36.2, lng: 138.25, precision: "country" } },
  "case-study-19": { topic: "human-rights", themes: [], populations: [],
    tags: ["climate-justice", "vulnerable-populations", "mental-health-support"],
    geo: { lat: 12.88, lng: 121.77, precision: "country" } },
  "case-study-2": { topic: "community-health", themes: [], populations: [],
    tags: ["community-action", "mental-health-support", "research"],
    geo: { lat: -0.13, lng: 111.1, precision: "city" } },
  "case-study-20": { topic: "policy-governance", themes: [], populations: [],
    tags: ["research", "mental-health-support", "adaptation"],
    geo: { lat: 14.06, lng: 108.28, precision: "country" } },
  "case-study-21": { topic: "food-agriculture", themes: ["livelihoods"], populations: ["farmers"],
    tags: ["farmers", "storytelling", "mental-health-support"],
    geo: { lat: 10.69, lng: -61.22, precision: "country" } },
  "case-study-22": { topic: "policy-governance", themes: [], populations: [],
    tags: ["climate-change", "mental-health-support", "research"],
    geo: { lat: 10.69, lng: -61.22, precision: "country" } },
  "case-study-23": { topic: "disaster-resilience", themes: ["livelihoods"], populations: [],
    tags: ["drought", "resilience", "community-action"],
    geo: { lat: 13.19, lng: -59.54, precision: "country" } },
  "case-study-24": { topic: "migration", themes: ["displacement"], populations: ["displaced", "women"],
    tags: ["displacement", "vulnerable-populations", "mental-health-support"],
    geo: { lat: 32.294, lng: 36.327, precision: "exact" } },
  "case-study-25": { topic: "food-agriculture", themes: ["livelihoods"], populations: ["farmers"],
    tags: ["farmers", "adaptation", "drought"],
    geo: { lat: 31.79, lng: -7.09, precision: "country" } },
  "case-study-26": { topic: "youth-education", themes: ["youth"], populations: ["youth"],
    tags: ["youth", "eco-anxiety", "heatwaves"],
    geo: { lat: 41.893, lng: 12.483, precision: "city" } },
  "case-study-27": { topic: "community-health", themes: [], populations: [],
    tags: ["trauma", "community-action", "resilience"],
    geo: { lat: 35.63, lng: -79.81, precision: "city" } },
  "case-study-28": { topic: "mental-health", themes: [], populations: [],
    tags: ["sea-level-rise", "eco-anxiety", "coping-strategies"],
    geo: { lat: 50.851, lng: 5.691, precision: "city" } },
  "case-study-29": { topic: "migration", themes: ["displacement"], populations: ["indigenous"],
    tags: ["displacement", "storytelling", "research"],
    geo: { lat: -36.848, lng: 174.763, precision: "city" },
    author: { name: "Olivia Yates", role: "lead" } },
  "case-study-30": { topic: "disaster-resilience", themes: [], populations: [],
    tags: ["wildfires", "rural-communities", "resilience"],
    geo: { lat: -30.404, lng: 152.343, precision: "city" } },
  "case-study-31": { topic: "mental-health", themes: ["youth"], populations: ["youth"],
    tags: ["youth", "eco-anxiety", "mental-health-support"],
    geo: { lat: -27.67, lng: 121.63, precision: "city" },
    display: "Western Australia, Australia" },
  "case-study-32": { topic: "mental-health", themes: [], populations: [],
    tags: ["community-action", "mental-health-support", "resilience"],
    geo: { lat: 5.963, lng: 10.159, precision: "city" } },
  "case-study-33": { topic: "disaster-resilience", themes: ["displacement"], populations: ["displaced"],
    tags: ["flooding", "displacement", "trauma"],
    geo: { lat: 6.47, lng: 6.79, precision: "city" } },
  "case-study-34": { topic: "mental-health", themes: [], populations: [],
    tags: ["drought", "mental-health-support", "community-action"],
    geo: { lat: -26.305, lng: 31.136, precision: "city" } },
  "case-study-35": { topic: "technology-innovation", themes: ["livelihoods"], populations: ["women", "farmers"],
    tags: ["women", "farmers", "mental-health-support"],
    geo: { lat: -1.286, lng: 36.817, precision: "city" } },
  "case-study-36": { topic: "climate-environment", themes: ["youth"], populations: ["youth"],
    tags: ["youth", "community-action", "hope"],
    geo: { lat: 9.08, lng: 8.68, precision: "country" } },
  "case-study-37": { topic: "policy-governance", themes: [], populations: [],
    tags: ["research", "mental-health-support", "adaptation"],
    geo: { lat: 31.955, lng: 35.945, precision: "city" } },
};

const [docs, tagDocs] = await Promise.all([
  client.fetch(`*[_type=="caseStudy" && status=="approved" && !(_id in path("drafts.**"))]{_id, topic, themes, populations, tags, authors, "hasGeo": defined(studyLocation), locationDisplayText}`),
  client.fetch(`*[_type=="tag"]{_id, "value": value.current}`),
]);
const tagId = Object.fromEntries(tagDocs.map((t: any) => [t.value, t._id]));

console.log(`Project ${client.config().projectId} | dataset ${DATASET} | ${EXECUTE ? "EXECUTE" : "dry-run"}\n`);

let patched = 0;
for (const d of docs) {
  const row = T[d._id];
  if (!row) { console.log(`⚠ ${d._id}: no editorial row — skipped`); continue; }

  const patch: Record<string, unknown> = {};
  if (!d.topic) patch.topic = row.topic;
  if (!(d.themes?.length) && row.themes?.length) patch.themes = row.themes;
  if (!(d.populations?.length) && row.populations?.length) patch.populations = row.populations;
  if (!(d.tags?.length) && row.tags.length) {
    const refs = row.tags.map((v) => tagId[v]).filter(Boolean);
    if (refs.length !== row.tags.length)
      console.log(`   ⚠ ${d._id}: unresolved tag values ${row.tags.filter((v) => !tagId[v]).join(", ")}`);
    patch.tags = refs.map((id) => ({ _type: "reference", _ref: id, _key: id }));
  }
  if (!d.hasGeo) {
    patch.studyLocation = { _type: "geopoint", lat: row.geo.lat, lng: row.geo.lng };
    patch.locationPrecision = row.geo.precision;
  }
  if (row.display && d.locationDisplayText !== row.display) patch.locationDisplayText = row.display;

  // Legacy author references -> inline {name, role} objects.
  const legacyAuthors = Array.isArray(d.authors) && d.authors.some((a: any) => a?._ref);
  if (legacyAuthors) {
    const a = row.author ?? { name: "CCM Community", role: "lead" };
    patch.authors = [{ _key: "author-1", name: a.name, role: a.role }];
  }

  if (!Object.keys(patch).length) continue;
  patched++;
  console.log(`${d._id}: ${Object.keys(patch).join(", ")}`);
  if (EXECUTE) {
    await client.patch(d._id).set(patch).commit();
    console.log("   ✅ patched");
  }
}
console.log(`\n${EXECUTE ? "Patched" : "Would patch"} ${patched}/${docs.length} approved docs.`);
if (!EXECUTE) console.log("Re-run with --execute to apply.");
