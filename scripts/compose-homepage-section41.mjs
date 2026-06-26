// Homepage H4 / Task 5: compose the §4.1 home block order on the staging
// homepage docs (all locales en/es/fr/ar).
//
// Target §4.1 order (docs/superpowers/specs/2026-06-26-homepage-redesign-design.md):
//   1. hero-1                       (PRESERVE verbatim — Explore/Collaborate CTAs)
//   2. region-map                   (Explore by region)
//   3. grid-row (news, media-list)  (News & updates)
//   4. events-calendar              (Events)
//   5. lived-experiences-carousel   (Lived experiences, "View all")
//   6. cta-1 (submit banner)        (Share your lived experience)
//   7. logo-cloud-1                 (Funder / partner strip)
//   8. people-widget                (People in your region)
//
// Hero preservation: blocks[0]'s hero-1 object (with its links set by
// scripts/set-hero-ctas.mjs) is read from the live doc and placed at target[0]
// AS-IS — never reconstructed — so its links are byte-preserved. The existing
// news grid-row + partner-logos are reused (content preserved); the news grid-row
// gets layout: "media-list". The new blocks (region-map / events-calendar /
// lived-experiences-carousel / submit cta-1 / people-widget) are authored here.
//
// Legacy sections (split-rows, old carousel-2, old mentalHealthDefinition cta-1)
// are dropped from the COMPOSED ORDER but NOT deleted from the dataset (the fixed
// content fields remain + a backup is written). Editors can re-add them in Studio.
//
// Idempotent (skips a doc whose blocks already match the target _type/_key
// sequence). Dry-run by default; --apply to write. Refuses production. Backs up
// the affected homepage docs first.
//
// Env: same minimal dotenv loader as scripts/set-hero-ctas.mjs (.env then
// .env.local overrides). Pass --env-dir=<path> to load env from another checkout.
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
if (!DS || /^prod/i.test(DS) || DS === "production_2" || DS === "production") {
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

// Newly authored blocks for the §4.1 order. English titles (matching how the
// hero CTAs were authored as plain strings); list/grid items are localized by
// the components. Deterministic _keys so re-runs converge.
function regionMapBlock() {
  return {
    _type: "region-map",
    _key: "region-map-section41",
    title: "Explore by region",
    description: "See research, communities, and stories across the world's regions.",
    defaultFacet: "caseStudyCount",
    padding: PADDING,
  };
}
function eventsCalendarBlock() {
  return {
    _type: "events-calendar",
    _key: "events-calendar-section41",
    title: "Events",
    description: "Upcoming events from across the network.",
    upcomingLimit: 5,
    padding: PADDING,
  };
}
function livedCarouselBlock() {
  return {
    _type: "lived-experiences-carousel",
    _key: "lived-experiences-section41",
    title: "Lived experiences",
    subtitle: "Voices and stories from people with lived experience.",
    maxItems: 9,
    featured: false,
    viewAllLink: true,
    padding: PADDING,
  };
}
function submitBannerBlock() {
  return {
    _type: "cta-1",
    _key: "submit-lived-section41",
    tagLine: "Lived experiences",
    title: "Share your story",
    body: [
      {
        _type: "block",
        _key: "submit-body-0",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "submit-body-0-0",
            text: "Your lived experience can help shape research and action on climate and mental health. Submit your story to be featured in the hub.",
            marks: [],
          },
        ],
      },
    ],
    links: [
      {
        _key: "submit-cta-link",
        _type: "link",
        title: "Submit your story",
        href: "/lived-experiences/submit",
        target: false,
        buttonVariant: { variant: "default", size: "default", stroke: "none" },
      },
    ],
    stackAlign: "center",
    padding: PADDING,
  };
}
function peopleWidgetBlock() {
  return {
    _type: "people-widget",
    _key: "people-widget-section41",
    title: "People in your region",
    description: "Connect with researchers, practitioners, and advocates near you.",
    limit: 6,
    padding: PADDING,
  };
}

// The ordered (_type,_key) signature for idempotency comparison.
const sig = (blocks) => (blocks || []).map((b) => `${b?._type}:${b?._key}`).join("|");

console.log(`Dataset: ${DS}  (apply=${apply})`);

const homepages = await q(`*[_type=="homepage"]{ _id, language, blocks }`);
console.log(`Found ${homepages.length} homepage doc(s).`);

const patches = [];
const backups = [];
for (const hp of homepages) {
  const blocks = Array.isArray(hp.blocks) ? hp.blocks : [];
  const label = `${hp._id} (${hp.language || "?"})`;

  // 1. Hero — must already exist (carries the Explore/Collaborate links). Never
  //    fabricate it. Reuse the SAME object reference so its links are preserved.
  const hero = blocks.find((b) => b && b._type === "hero-1");
  if (!hero) {
    console.log(`  ${label}: no hero-1 block — SKIP (composition needs the existing hero)`);
    continue;
  }
  if (!Array.isArray(hero.links) || hero.links.length === 0) {
    console.warn(`  ${label}: WARNING hero-1 has no links — preserving as-is (run set-hero-ctas first)`);
  }

  // 2. Reuse existing news grid-row + partner logos by their H1-migration keys,
  //    falling back to first-of-type. Preserve content; set news layout.
  const newsGrid =
    blocks.find((b) => b && b._key === "grid-row-news") ||
    blocks.find((b) => b && b._type === "grid-row");
  const partnerLogos =
    blocks.find((b) => b && b._key === "logo-cloud-1-partnerLogos") ||
    blocks.find((b) => b && b._type === "logo-cloud-1");

  const newsForSection41 = newsGrid
    ? { ...newsGrid, layout: "media-list" }
    : undefined;

  // 3. Compose the §4.1 order (drop any undefined slot defensively).
  const target = [
    hero, // preserved verbatim
    regionMapBlock(),
    newsForSection41,
    eventsCalendarBlock(),
    livedCarouselBlock(),
    submitBannerBlock(),
    partnerLogos,
    peopleWidgetBlock(),
  ].filter(Boolean);

  const beforeSig = sig(blocks);
  const afterSig = sig(target);
  // Idempotent: skip when the ordered (_type,_key) sequence already matches AND
  // the news block already carries media-list (so a re-run after the layout edit
  // is also a no-op).
  const newsAlreadyMediaList =
    !newsGrid || newsGrid.layout === "media-list";
  if (beforeSig === afterSig && newsAlreadyMediaList) {
    console.log(`  ${label}: already §4.1 — skip`);
    continue;
  }

  console.log(`  ${label}:`);
  console.log(`    before: ${blocks.map((b) => b?._type).join(" > ")}`);
  console.log(`    after:  ${target.map((b) => b?._type).join(" > ")}`);

  backups.push(hp);
  patches.push({ patch: { id: hp._id, set: { blocks: target } } });
}

if (!apply) {
  console.log(`\nDRY RUN — ${patches.length} doc(s) to update. Re-run with --apply.`);
  process.exit(0);
}
if (patches.length === 0) {
  console.log("Nothing to update — already §4.1.");
  process.exit(0);
}

// Back up the affected homepage docs first.
const backupDir = env("BACKUP_DIR") || ".sanity-backups";
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `homepage-section41-${DS}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backups, null, 2));
console.log(`Backed up ${backups.length} homepage doc(s) to ${backupPath}`);

await mutate(patches);
console.log(`Composed §4.1 blocks[] on ${patches.length} homepage doc(s) in ${DS}.`);
