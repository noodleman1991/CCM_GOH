/**
 * Backfill country codes for geo-less atlas content (2026-08-04).
 *
 * For caseStudy / livedExperience / newsPost docs that have NO location data,
 * scan the doc's own text (title + summary + body) for country names; when
 * EXACTLY ONE country is mentioned, set the schema's country fields at
 * precision "country":
 *   - caseStudy:              locationCountryCode + locationPrecision
 *   - livedExperience/news:   place.countryCode + place.precision
 *
 * Ambiguous docs (0 or 2+ countries) are listed and left untouched — no
 * invented locations, ever.
 *
 * DRY RUN by default; pass --execute to write. Requires a write token in
 * SANITY_API_TOKEN (falls back to SANITY_API_WRITE_TOKEN).
 */
import { createClient } from "@sanity/client";
import countriesLib from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json" with { type: "json" };
import { config } from "dotenv";

config({ path: new URL("../.env.local", import.meta.url).pathname });
config({ path: new URL("../.env", import.meta.url).pathname });

countriesLib.registerLocale(enLocale);

const EXECUTE = process.argv.includes("--execute");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** name (lowercased) → alpha-3, from the full en locale + common short forms
 *  the library's official names miss. Multi-word names are matched as phrases. */
function buildCountryIndex() {
  const index = new Map();
  for (const [alpha2, name] of Object.entries(enLocale.countries)) {
    const alpha3 = countriesLib.alpha2ToAlpha3(alpha2);
    if (!alpha3) continue;
    const names = Array.isArray(name) ? name : [name];
    for (const n of names) index.set(n.toLowerCase(), alpha3);
  }
  // Short forms / common usage the official list spells differently.
  const extras = {
    "vietnam": "VNM", "south korea": "KOR", "north korea": "PRK", "russia": "RUS",
    "iran": "IRN", "syria": "SYR", "laos": "LAO", "bolivia": "BOL", "venezuela": "VEN",
    "tanzania": "TZA", "drc": "COD", "democratic republic of congo": "COD",
    "ivory coast": "CIV", "cape verde": "CPV", "the gambia": "GMB", "usa": "USA",
    "united states": "USA", "uk": "GBR", "britain": "GBR", "great britain": "GBR",
    "the netherlands": "NLD", "czech republic": "CZE", "türkiye": "TUR", "turkey": "TUR",
    "moldova": "MDA", "brunei": "BRN", "micronesia": "FSM", "palestine": "PSE",
  };
  for (const [n, a3] of Object.entries(extras)) index.set(n, a3);
  return index;
}

/** All distinct alpha-3s whose country name appears as a whole word/phrase. */
function countriesInText(text, index) {
  const hay = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  const found = new Set();
  for (const [name, alpha3] of index) {
    if (name.length < 4) continue; // skip acronym-length names prone to false hits
    if (hay.includes(` ${name.replace(/[^\p{L}\p{N}]+/gu, " ")} `)) found.add(alpha3);
  }
  return [...found];
}

// Raw pieces only — JS joins them. (A GROQ `+` chain nulls out whenever one
// operand is a localized OBJECT rather than a string, which silently emptied
// every doc's text on the first attempt.) `locationText.{city,country}` are
// scanned as ONE string because the legacy import frequently SWAPPED them
// ("city":"Italy","country":"Rome").
const QUERY = `{
  "caseStudies": *[_type == "caseStudy" && !defined(studyLocation) && !defined(locationCountryCode) && !(_id in path("drafts.**"))]{
    _id, "region": relatedCommunity->slug.current, "titleObj": title, locationText
  },
  "lived": *[_type == "livedExperience" && !defined(place.point) && !defined(place.countryCode) && !(_id in path("drafts.**"))]{
    _id, "region": relatedCommunity->slug.current, "titleObj": title
  },
  "news": *[_type == "newsPost" && !defined(place.point) && !defined(place.countryCode) && !(_id in path("drafts.**"))]{
    _id, "region": relatedCommunity->slug.current, "titleObj": title
  }
}`;

/** Every string reachable in a value (plain string or localized {en,ar,…}). */
function textOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return Object.values(value).filter((v) => typeof v === "string").join(" ");
  return "";
}

const index = buildCountryIndex();
const data = await client.fetch(QUERY);
console.log(`dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET} | mode: ${EXECUTE ? "EXECUTE" : "dry-run"}`);

const plans = [];
const skipped = [];
const scan = (docs, kind) => {
  for (const d of docs) {
    const text = [textOf(d.titleObj), textOf(d.locationText?.city), textOf(d.locationText?.country)].join(" ");
    const hits = countriesInText(text, index);
    if (hits.length === 1) plans.push({ kind, id: d._id, region: d.region, alpha3: hits[0] });
    else skipped.push({ kind, id: d._id, region: d.region, hits });
  }
};
scan(data.caseStudies, "caseStudy");
scan(data.lived, "livedExperience");
scan(data.news, "newsPost");

console.log(`\nWill patch ${plans.length} docs:`);
for (const p of plans)
  console.log(`  ${p.kind} ${p.id} (${p.region ?? "no region"}) -> ${p.alpha3} (${countriesLib.getName(p.alpha3, "en")})`);
console.log(`\nSkipped ${skipped.length} (ambiguous/no mention):`);
for (const s of skipped) console.log(`  ${s.kind} ${s.id} (${s.region ?? "no region"}): [${s.hits.join(", ")}]`);

if (EXECUTE && plans.length > 0) {
  let tx = client.transaction();
  for (const p of plans) {
    tx = tx.patch(p.id, (patch) =>
      p.kind === "caseStudy"
        ? patch.set({ locationCountryCode: p.alpha3, locationPrecision: "country" })
        : patch.set({ "place.countryCode": p.alpha3, "place.precision": "country" })
    );
  }
  const result = await tx.commit();
  console.log(`\nCommitted ${result.results?.length ?? plans.length} patches.`);
} else if (!EXECUTE) {
  console.log("\nDry run — nothing written. Re-run with --execute to apply.");
}
