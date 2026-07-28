/**
 * Normalize Case Study Content (run with: npx tsx scripts/normalize-case-studies.ts)
 *
 * Fixes the schema/content drift found in the 2026-07-28 audit:
 *  1. `region` (fixed-7 short code) is missing on every doc — backfill from
 *     `relatedCommunity` when present, else derive from the country.
 *  2. `locationText.{country,city}` was used as freeform "place / bigger
 *     place", often swapped ("Jharkhand" / "India"). Derive the real country,
 *     write `locationCountryCode` (ISO alpha-3) and a tidy
 *     `locationDisplayText` ("Place, Country"). The legacy locationText object
 *     is left untouched.
 *  3. Trim/collapse whitespace in localized `title` and `excerpt` values.
 *
 * What it deliberately does NOT do: invent excerpts, topics, themes, tags or
 * map coordinates — those are editorial. It prints a TODO list per doc instead.
 *
 * Usage:
 *   npx tsx scripts/normalize-case-studies.ts             # dry-run
 *   npx tsx scripts/normalize-case-studies.ts --execute   # apply patches
 *
 * Reads via the API CDN (works during quota outage); --execute needs the live
 * API and fails with 402 plan_limit_reached until the quota resets.
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { isoToRegion } from "../lib/maps/iso-to-region";
import { RC_SLUG_TO_REGION, type RegionCode } from "../lib/maps/region-codes";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const DATASET = args.find((a) => a.startsWith("--dataset="))?.split("=")[1] || "production_2";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-04-24",
  useCdn: !EXECUTE,
});

/** Country detection table: lowercase needle -> [ISO alpha-3, canonical name].
 *  Needles are matched against BOTH locationText fields, longest first, so
 *  "Sindh, Pakistan" and swapped "Jharkhand"/"India" both resolve. */
const COUNTRY_NEEDLES: Record<string, [string, string]> = {
  "trinidad and tobago": ["TTO", "Trinidad and Tobago"],
  "united states": ["USA", "United States"],
  "new zealand": ["NZL", "New Zealand"],
  "tāmaki makaurau": ["NZL", "New Zealand"],
  auckland: ["NZL", "New Zealand"],
  afghanistan: ["AFG", "Afghanistan"],
  bangladesh: ["BGD", "Bangladesh"],
  philippines: ["PHL", "Philippines"],
  netherlands: ["NLD", "Netherlands"],
  indonesia: ["IDN", "Indonesia"],
  eswatini: ["SWZ", "Eswatini"],
  eswantini: ["SWZ", "Eswatini"], // typo present in data
  australia: ["AUS", "Australia"],
  barbados: ["BRB", "Barbados"],
  cameroon: ["CMR", "Cameroon"],
  malaysia: ["MYS", "Malaysia"],
  pakistan: ["PAK", "Pakistan"],
  morocco: ["MAR", "Morocco"],
  nigeria: ["NGA", "Nigeria"],
  vietnam: ["VNM", "Vietnam"],
  "viet nam": ["VNM", "Vietnam"],
  france: ["FRA", "France"],
  jordan: ["JOR", "Jordan"],
  kenya: ["KEN", "Kenya"],
  japan: ["JPN", "Japan"],
  india: ["IND", "India"],
  italy: ["ITA", "Italy"],
  usa: ["USA", "United States"],
};
const NEEDLES = Object.keys(COUNTRY_NEEDLES).sort((a, b) => b.length - a.length);

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

function detectCountry(...fields: (string | undefined | null)[]): [string, string] | null {
  const hay = fields.filter(Boolean).join(", ").toLowerCase();
  for (const n of NEEDLES) if (hay.includes(n)) return COUNTRY_NEEDLES[n];
  return null;
}

/** Everything in the location fields that is not the country = the place part. */
function placePart(countryName: string, ...fields: (string | undefined | null)[]): string {
  const tokens = fields
    .filter(Boolean)
    .flatMap((f) => f!.split(","))
    .map(tidy)
    .filter((t) => t && !NEEDLES.some((n) => t.toLowerCase() === n || t.toLowerCase().includes(n)));
  return [...new Set(tokens)].join(", ");
}

type LocalizedString = Record<string, string | undefined>;

function tidyLocalized(obj: LocalizedString | undefined | null): { changed: boolean; value?: LocalizedString } {
  if (!obj || typeof obj !== "object") return { changed: false };
  let changed = false;
  const out: LocalizedString = { ...obj };
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && tidy(v) !== v) {
      out[k] = tidy(v);
      changed = true;
    }
  }
  return { changed, value: out };
}

const docs: any[] = await client.fetch(
  `*[_type=="caseStudy" && !(_id in path("drafts.**"))]{
    _id, status, title, excerpt, region, themes, topic, tags,
    locationText, locationCountryCode, locationDisplayText,
    "rcSlug": relatedCommunity->slug.current,
    "hasGeo": defined(studyLocation)
  }`
);

console.log(`Project ${client.config().projectId} | dataset ${DATASET} | ${EXECUTE ? "EXECUTE" : "dry-run"} | ${docs.length} docs\n`);

let patchedCount = 0;
const editorialTodo: string[] = [];

for (const d of docs) {
  const patch: Record<string, unknown> = {};
  const notes: string[] = [];

  // 1. region backfill: relatedCommunity slug wins, else country-derived
  if (!d.region) {
    const fromRc: RegionCode | undefined = d.rcSlug ? RC_SLUG_TO_REGION[d.rcSlug] : undefined;
    const country = detectCountry(d.locationText?.country, d.locationText?.city);
    const fromIso = country ? isoToRegion(country[0]) : null;
    const region = fromRc ?? fromIso;
    if (region) {
      patch.region = region;
      notes.push(`region=${region} (${fromRc ? "from relatedCommunity" : "from country"})`);
      if (fromRc && fromIso && fromRc !== fromIso)
        notes.push(`⚠ region mismatch: community says ${fromRc}, country says ${fromIso} — kept community`);
    }
  }

  // 2. country code + display text
  const country = detectCountry(d.locationText?.country, d.locationText?.city);
  if (country) {
    const [iso3, name] = country;
    if (d.locationCountryCode !== iso3) {
      patch.locationCountryCode = iso3;
      notes.push(`countryCode=${iso3}`);
    }
    if (!d.locationDisplayText) {
      const place = placePart(name, d.locationText?.country, d.locationText?.city);
      patch.locationDisplayText = place ? `${place}, ${name}` : name;
      notes.push(`display="${patch.locationDisplayText}"`);
    }
  }

  // 3. whitespace tidy on localized title/excerpt
  for (const field of ["title", "excerpt"] as const) {
    const { changed, value } = tidyLocalized(d[field]);
    if (changed) {
      patch[field] = value;
      notes.push(`${field} whitespace tidied`);
    }
  }

  // editorial TODO report (no automated changes)
  const missing = [
    !d.excerpt?.en && "excerpt",
    !d.topic && "topic",
    !(d.themes?.length) && "themes",
    !(d.tags?.length) && "tags",
    !d.hasGeo && "map point (studyLocation)",
  ].filter(Boolean);
  if (missing.length && d.status === "approved")
    editorialTodo.push(`  ${d._id}: needs ${missing.join(", ")}`);

  if (Object.keys(patch).length === 0) continue;
  patchedCount++;
  const title = tidy(String(d.title?.en ?? "?")).slice(0, 55);
  console.log(`${d._id} [${d.status}] "${title}"`);
  for (const n of notes) console.log(`   ${n}`);
  if (EXECUTE) {
    await client.patch(d._id).set(patch).commit();
    console.log("   ✅ patched");
  }
}

console.log(`\n${EXECUTE ? "Patched" : "Would patch"} ${patchedCount}/${docs.length} docs.`);
if (editorialTodo.length) {
  console.log(`\nEditorial TODO on approved docs (not automated):`);
  for (const line of editorialTodo) console.log(line);
}
if (!EXECUTE) console.log("\nRe-run with --execute to apply (requires live-API quota).");
