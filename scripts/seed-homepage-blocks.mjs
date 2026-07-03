// Task E4: ensure the homepage docs carry the full §4.1 block composition.
//
// For every homepage doc (all locales):
//   - hero-1 must already exist (carries the Explore/Collaborate CTAs set by
//     scripts/set-hero-ctas.mjs + localize-hero-ctas.mjs) — verified, never
//     fabricated or modified.
//   - Ensures region-map, events-calendar, lived-experiences-carousel and the
//     NEW submit-story-banner blocks exist, inserting any missing one at its
//     §4.1 position. Existing blocks are NEVER deleted or reordered.
//   - The legacy generic cta-1 "Share your story" band (authored by
//     compose-homepage-section41.mjs as _key "submit-lived-section41") is
//     REPLACED in place by a submit-story-banner block. The new block has no
//     copy overrides: the component falls back to localized i18n defaults, so
//     every locale doc localizes for free.
//
// Idempotent (re-runs are no-ops). Dry-run by default; --apply to write.
// Refuses production datasets. Backs up affected docs before writing.
import fs from "node:fs";
import path from "node:path";

// --- minimal dotenv loader (.env first, then .env.local overrides) -----------
function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const envDirArg = process.argv.find((a) => a.startsWith("--env-dir="));
const envDir = envDirArg ? envDirArg.slice("--env-dir=".length) : process.cwd();
const fileEnv = {
  ...parseEnvFile(path.join(envDir, ".env")),
  ...parseEnvFile(path.join(envDir, ".env.local")),
};
const env = (k) => process.env[k] ?? fileEnv[k];

const PID = env("NEXT_PUBLIC_SANITY_PROJECT_ID");
const API = env("NEXT_PUBLIC_SANITY_API_VERSION") || "2021-06-07";
const TOKEN = env("SANITY_API_EDITOR_TOKEN") || env("SANITY_API_WRITE_TOKEN");
const DS = env("NEXT_PUBLIC_SANITY_DATASET");
const apply = process.argv.includes("--apply");

// Refuse any production-looking dataset. Staging is `development`.
if (!DS || /^prod/i.test(DS)) {
  console.error(`Refusing: dataset is "${DS}". Run against development (staging).`);
  process.exit(1);
}
if (!PID) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID. Pass --env-dir=<path-to-checkout-with-.env.local>.");
  process.exit(1);
}
if (!TOKEN) {
  console.error("Missing SANITY_API_EDITOR_TOKEN / SANITY_API_WRITE_TOKEN — cannot write.");
  process.exit(1);
}

const auth = { Authorization: "Bearer " + TOKEN };
const q = async (query) => {
  const r = await fetch(
    `https://${PID}.api.sanity.io/v${API}/data/query/${DS}?query=${encodeURIComponent(query)}`,
    { headers: auth }
  );
  if (!r.ok) throw new Error(`query HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).result;
};
const mutate = async (mutations) => {
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/mutate/${DS}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`mutate HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
};

const PADDING = { _type: "section-padding", top: true, bottom: true };

// Deterministic _keys so re-runs converge. Copy fields stay EMPTY: the
// components localize via i18n defaults per locale doc.
const REQUIRED = [
  {
    make: () => ({
      _type: "region-map",
      _key: "region-map-section41",
      title: "Explore by region",
      description: "See research, communities, and stories across the world's regions.",
      defaultFacet: "caseStudyCount",
      padding: PADDING,
    }),
    type: "region-map",
  },
  {
    make: () => ({
      _type: "events-calendar",
      _key: "events-calendar-section41",
      title: "Events",
      description: "Upcoming events from across the network.",
      upcomingLimit: 5,
      padding: PADDING,
    }),
    type: "events-calendar",
  },
  {
    make: () => ({
      _type: "lived-experiences-carousel",
      _key: "lived-experiences-section41",
      title: "Lived experiences",
      subtitle: "Voices and stories from people with lived experience.",
      maxItems: 9,
      featured: false,
      viewAllLink: true,
      padding: PADDING,
    }),
    type: "lived-experiences-carousel",
  },
  {
    make: () => ({
      _type: "submit-story-banner",
      _key: "submit-story-banner-section41",
      padding: PADDING,
    }),
    type: "submit-story-banner",
  },
];

// Is this cta-1 the legacy share-story band the composer authored?
const isLegacyShareBand = (b) =>
  b?._type === "cta-1" &&
  (b._key === "submit-lived-section41" || b.title === "Share your story");

console.log(`Dataset: ${DS}  (apply=${apply})`);

const homepages = await q(`*[_type=="homepage"]{ _id, language, blocks }`);
console.log(`Found ${homepages.length} homepage doc(s).`);

const patches = [];
const backups = [];
for (const hp of homepages) {
  const label = `${hp._id} (${hp.language || "?"})`;
  const blocks = Array.isArray(hp.blocks) ? [...hp.blocks] : [];

  const hero = blocks.find((b) => b && b._type === "hero-1");
  if (!hero) {
    console.log(`  ${label}: no hero-1 block — SKIP (run set-hero-ctas/compose first)`);
    continue;
  }
  const changes = [];

  // 1. Replace the legacy cta-1 share band in place with submit-story-banner.
  const legacyIdx = blocks.findIndex(isLegacyShareBand);
  const hasBanner = blocks.some((b) => b?._type === "submit-story-banner");
  if (legacyIdx !== -1 && !hasBanner) {
    blocks.splice(legacyIdx, 1, REQUIRED.find((r) => r.type === "submit-story-banner").make());
    changes.push(`replace cta-1[${legacyIdx}] -> submit-story-banner`);
  } else if (legacyIdx !== -1 && hasBanner) {
    blocks.splice(legacyIdx, 1);
    changes.push(`drop duplicate legacy cta-1[${legacyIdx}] (banner already present)`);
  }

  // 2. Insert any missing required block at its §4.1 position: after the last
  //    present block that PRECEDES it in the required order (or after hero).
  for (let i = 0; i < REQUIRED.length; i++) {
    const req = REQUIRED[i];
    if (blocks.some((b) => b?._type === req.type)) continue;
    let insertAt = blocks.indexOf(hero) + 1;
    for (let j = 0; j < i; j++) {
      const prevIdx = blocks.findIndex((b) => b?._type === REQUIRED[j].type);
      if (prevIdx !== -1) insertAt = Math.max(insertAt, prevIdx + 1);
    }
    blocks.splice(insertAt, 0, req.make());
    changes.push(`insert ${req.type} at ${insertAt}`);
  }

  if (changes.length === 0) {
    console.log(`  ${label}: complete — skip`);
    continue;
  }

  console.log(`  ${label}:`);
  for (const c of changes) console.log(`    - ${c}`);
  console.log(`    after: ${blocks.map((b) => b?._type).join(" > ")}`);

  backups.push(hp);
  patches.push({ patch: { id: hp._id, set: { blocks } } });
}

if (!apply) {
  console.log(`\nDRY RUN — ${patches.length} doc(s) to update. Re-run with --apply.`);
  process.exit(0);
}
if (patches.length === 0) {
  console.log("Nothing to update.");
  process.exit(0);
}

const backupDir = env("BACKUP_DIR") || ".sanity-backups";
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `homepage-seed-blocks-${DS}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backups, null, 2));
console.log(`Backed up ${backups.length} homepage doc(s) to ${backupPath}`);

await mutate(patches);
console.log(`Updated blocks[] on ${patches.length} homepage doc(s) in ${DS}.`);
