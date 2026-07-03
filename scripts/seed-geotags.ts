/**
 * Seed geo + theme data into the Sanity DEVELOPMENT dataset so the Atlas
 * features (region-pins / region-data map endpoints) have something to show.
 *
 * Idempotent: any doc that already has coordinates set (studyLocation for
 * caseStudy, place.point for livedExperience) is skipped, so re-running this
 * is safe.
 *
 * SAFETY: this only ever targets NEXT_PUBLIC_SANITY_DATASET from .env.local
 * (expected: "development"). It hard-refuses to run against any dataset
 * whose name contains "production".
 *
 * Run: `npx tsx scripts/seed-geotags.ts`
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env.local") });

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!dataset) {
  console.error("BLOCKED: NEXT_PUBLIC_SANITY_DATASET is not set in .env.local");
  process.exit(1);
}
if (dataset.includes("production")) {
  console.error(
    `BLOCKED: refusing to seed into "${dataset}" — this script only targets a development dataset.`
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset,
  token: process.env.SANITY_API_EDITOR_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-10-31",
  useCdn: false,
});

console.log(`Seeding geo + theme data into dataset: "${dataset}"\n`);

// ── Region → plausible real-city coordinates ────────────────────────────────
// Matches the task's spec. Each region has a short list of candidate cities;
// we cycle through them per doc so a region with multiple docs gets variety.
type CityFixture = {
  city: string;
  lat: number;
  lng: number;
  countryCode: string; // ISO alpha-3
  countryName: string;
};

const REGION_CITIES: Record<string, CityFixture[]> = {
  ssa: [
    { city: "Nairobi", lat: -1.29, lng: 36.82, countryCode: "KEN", countryName: "Kenya" },
    { city: "Lagos", lat: 6.52, lng: 3.38, countryCode: "NGA", countryName: "Nigeria" },
    { city: "Lilongwe", lat: -13.98, lng: 33.78, countryCode: "MWI", countryName: "Malawi" },
  ],
  nawa: [
    { city: "Amman", lat: 31.95, lng: 35.93, countryCode: "JOR", countryName: "Jordan" },
    { city: "Cairo", lat: 30.04, lng: 31.24, countryCode: "EGY", countryName: "Egypt" },
  ],
  csa: [
    { city: "Dhaka", lat: 23.81, lng: 90.41, countryCode: "BGD", countryName: "Bangladesh" },
    { city: "Karachi", lat: 24.86, lng: 67.0, countryCode: "PAK", countryName: "Pakistan" },
  ],
  esea: [
    { city: "Manila", lat: 14.6, lng: 120.98, countryCode: "PHL", countryName: "Philippines" },
    { city: "Jakarta", lat: -6.21, lng: 106.85, countryCode: "IDN", countryName: "Indonesia" },
  ],
  lac: [
    { city: "Bogotá", lat: 4.71, lng: -74.07, countryCode: "COL", countryName: "Colombia" },
    { city: "Lima", lat: -12.05, lng: -77.04, countryCode: "PER", countryName: "Peru" },
  ],
  oce: [{ city: "Suva", lat: -18.14, lng: 178.44, countryCode: "FJI", countryName: "Fiji" }],
  enam: [{ city: "Toronto", lat: 43.65, lng: -79.38, countryCode: "CAN", countryName: "Canada" }],
};

const REGION_TO_RC_ID: Record<string, string> = {
  ssa: "regional-community-sub-saharan-africa",
  nawa: "regional-community-northern-africa-and-western-asia",
  csa: "regional-community-central-and-southern-asia",
  esea: "regional-community-eastern-and-south-eastern-asia",
  lac: "regional-community-latin-america-and-the-caribbean",
  oce: "regional-community-oceania",
  enam: "regional-community-europe-and-northern-america",
};

const ALL_REGIONS = Object.keys(REGION_CITIES);

// Round-robin picker per region so repeated docs in the same region get
// different cities instead of all landing on the first fixture.
const cityCursor: Record<string, number> = {};
function nextCity(region: string): CityFixture {
  const list = REGION_CITIES[region];
  const i = cityCursor[region] ?? 0;
  cityCursor[region] = (i + 1) % list.length;
  return list[i];
}

// ── Types ─────────────────────────────────────────────────────────────────
type MutationRow = {
  docType: string;
  id: string;
  title: string;
  field: string;
  value: string;
};

const mutationLog: MutationRow[] = [];

// ── 1. Case studies ──────────────────────────────────────────────────────
type CaseStudyRow = {
  _id: string;
  title: string | null;
  region: string | null;
  communitySlug: string | null;
  studyLocation: unknown;
};

async function seedCaseStudies() {
  const docs = await client.fetch<CaseStudyRow[]>(
    `*[_type == "caseStudy" && status == "approved"] | order(_id asc) [0...12] {
      _id, "title": title.en, region, "communitySlug": relatedCommunity->slug.current, studyLocation
    }`
  );

  console.log(`Found ${docs.length} approved case studies (fetched up to 12).`);

  // Precision distribution per the task: 2 "exact", 1 "country", 1 "region",
  // the rest "city".
  const precisionPlan: string[] = [];
  for (let i = 0; i < docs.length; i++) {
    if (i === 0 || i === 1) precisionPlan.push("exact");
    else if (i === 2) precisionPlan.push("country");
    else if (i === 3) precisionPlan.push("region");
    else precisionPlan.push("city");
  }

  const mutatedIds: string[] = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (doc.studyLocation) {
      console.log(`  skip (already geotagged): ${doc._id}`);
      continue;
    }

    // Resolve a region for this doc: use its own region if set, else its
    // community slug's region, else spread across ALL_REGIONS round-robin so
    // regionless docs still get a sensible region via coordinates only.
    let region = doc.region;
    if (!region) {
      region = ALL_REGIONS[i % ALL_REGIONS.length];
    }
    if (!REGION_CITIES[region]) region = ALL_REGIONS[i % ALL_REGIONS.length];

    const fixture = nextCity(region);
    const precision = precisionPlan[i];
    const displayText = `${fixture.city}, ${fixture.countryName}`;

    await client
      .patch(doc._id)
      .set({
        studyLocation: { _type: "geopoint", lat: fixture.lat, lng: fixture.lng },
        locationDisplayText: displayText,
        locationPrecision: precision,
        locationCountryCode: fixture.countryCode,
      })
      .commit();

    mutatedIds.push(doc._id);
    mutationLog.push({
      docType: "caseStudy",
      id: doc._id,
      title: doc.title ?? "(untitled)",
      field: "studyLocation/locationPrecision/locationCountryCode",
      value: `${displayText} [${fixture.lat}, ${fixture.lng}] precision=${precision} cc=${fixture.countryCode} region=${region}`,
    });
  }

  return mutatedIds;
}

// ── 2. Lived experiences ─────────────────────────────────────────────────
type LivedExperienceRow = {
  _id: string;
  title: string | null;
  region: unknown;
  relatedCommunitySlug: string | null;
  place: { point?: unknown } | null;
};

async function seedLivedExperiences() {
  const docs = await client.fetch<LivedExperienceRow[]>(
    `*[_type == "livedExperience"] | order(_id asc) [0...6] {
      _id, "title": title.en, region, "relatedCommunitySlug": relatedCommunity->slug.current, place
    }`
  );

  console.log(`Found ${docs.length} lived experiences (fetched up to 6).`);

  const mutatedIds: string[] = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (doc.place?.point) {
      console.log(`  skip (already geotagged): ${doc._id}`);
      continue;
    }

    // legacy `region` field on these docs is a stale reference to a
    // regionalCommunity doc (not the new string enum) — derive a region code
    // from that reference's _id when present, else round-robin.
    let region: string | null = null;
    const regionRef = doc.region as { _ref?: string } | null;
    if (regionRef?._ref) {
      const match = Object.entries(REGION_TO_RC_ID).find(([, id]) => id === regionRef._ref);
      if (match) region = match[0];
    }
    if (!region) region = ALL_REGIONS[i % ALL_REGIONS.length];

    const fixture = nextCity(region);
    // Per spec: "point/text/precision 'country' for most, one 'city'/countryCode"
    const precision = i === 0 ? "city" : "country";
    const displayText = `${fixture.city}, ${fixture.countryName}`;

    await client
      .patch(doc._id)
      .set({
        place: {
          _type: "place",
          point: { _type: "geopoint", lat: fixture.lat, lng: fixture.lng },
          text: displayText,
          precision,
          countryCode: fixture.countryCode,
        },
      })
      .commit();

    mutatedIds.push(doc._id);
    mutationLog.push({
      docType: "livedExperience",
      id: doc._id,
      title: doc.title ?? "(untitled)",
      field: "place",
      value: `${displayText} [${fixture.lat}, ${fixture.lng}] precision=${precision} cc=${fixture.countryCode} region=${region}`,
    });
  }

  return mutatedIds;
}

// ── 3. Theme tags ────────────────────────────────────────────────────────
type TagRow = {
  _id: string;
  label: string | null;
  useAsTheme: boolean | null;
  refCount: number;
};

async function seedThemeTags() {
  const tags = await client.fetch<TagRow[]>(
    `*[_type == "tag"]{
      _id, "label": label.en, useAsTheme,
      "refCount": count(*[_type in ["caseStudy","livedExperience"] && references(^._id)])
    } | order(refCount desc)`
  );

  const alreadyFlagged = tags.filter((t) => t.useAsTheme).map((t) => t._id);
  let toFlag: TagRow[];

  if (alreadyFlagged.length >= 4) {
    console.log(`Already have ${alreadyFlagged.length} theme tags flagged; skipping flagging step.`);
    toFlag = [];
  } else {
    const needed = 4 - alreadyFlagged.length;
    // pick tags with the most references (tags already sorted refCount desc),
    // excluding ones already flagged, else first 4 with labels.
    const candidates = tags.filter((t) => !t.useAsTheme && t.label);
    toFlag = candidates.slice(0, needed);
  }

  const flaggedIds: string[] = [...alreadyFlagged];

  for (const tag of toFlag) {
    await client.patch(tag._id).set({ useAsTheme: true }).commit();
    flaggedIds.push(tag._id);
    mutationLog.push({
      docType: "tag",
      id: tag._id,
      title: tag.label ?? "(untitled)",
      field: "useAsTheme",
      value: `true (refCount=${tag.refCount})`,
    });
  }

  return flaggedIds;
}

// ── 4. Ensure >=2 geotagged case studies carry a flagged tag ─────────────
async function ensureThemedCaseStudies(caseStudyIds: string[], flaggedTagIds: string[]) {
  if (flaggedTagIds.length === 0 || caseStudyIds.length === 0) return;

  const themeTagRef = flaggedTagIds[0];

  const rows = await client.fetch<{ _id: string; title: string | null; tags: { _ref: string }[] | null }[]>(
    `*[_type == "caseStudy" && _id in $ids]{ _id, "title": title.en, tags }`,
    { ids: caseStudyIds }
  );

  const candidates = rows.filter(
    (r) => !(r.tags ?? []).some((t) => flaggedTagIds.includes(t._ref))
  );

  const target = candidates.slice(0, 2);

  for (const doc of target) {
    const existingTags = doc.tags ?? [];
    await client
      .patch(doc._id)
      .setIfMissing({ tags: [] })
      .append("tags", [{ _type: "reference", _ref: themeTagRef, _key: `theme-${themeTagRef}` }])
      .commit();

    mutationLog.push({
      docType: "caseStudy",
      id: doc._id,
      title: doc.title ?? "(untitled)",
      field: "tags (appended)",
      value: `+ ref ${themeTagRef} (had ${existingTags.length} tag(s) before)`,
    });
  }
}

// ── Run ───────────────────────────────────────────────────────────────────
async function main() {
  const caseStudyIds = await seedCaseStudies();
  console.log("");
  const leIds = await seedLivedExperiences();
  console.log("");
  const flaggedTagIds = await seedThemeTags();
  console.log("");
  await ensureThemedCaseStudies(caseStudyIds, flaggedTagIds);

  console.log("\n=== Mutation Summary ===\n");
  if (mutationLog.length === 0) {
    console.log("No mutations were made (everything already seeded).");
  } else {
    const idWidth = Math.max(...mutationLog.map((m) => m.id.length), 12);
    const typeWidth = Math.max(...mutationLog.map((m) => m.docType.length), 8);
    for (const m of mutationLog) {
      console.log(
        `${m.docType.padEnd(typeWidth)}  ${m.id.padEnd(idWidth)}  ${m.field.padEnd(38)}  ${m.value}  (${m.title})`
      );
    }
  }
  console.log(`\nTotal mutations: ${mutationLog.length}`);
  console.log(`  caseStudy geotagged: ${caseStudyIds.length}`);
  console.log(`  livedExperience geotagged: ${leIds.length}`);
  console.log(`  tags flagged useAsTheme: ${flaggedTagIds.length}`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
