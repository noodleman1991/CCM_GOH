// Homepage H2 / Task 3 follow-up: LOCALIZE the hero CTA labels.
// scripts/set-hero-ctas.mjs set Explore/Collaborate on every homepage doc but
// used the English titles for all locales. Each homepage doc is single-language
// (a `language` field: en/es/fr/ar), so this re-titles the two hero CTAs in the
// doc's own language while preserving everything else (href, target, variant,
// _key, order, and the rest of the hero block).
//
// Link item shape (sanity/schemas/blocks/shared/link.ts + the hero-1 projection):
//   { _key, _type: "link", title, href, target, buttonVariant: { variant, size, stroke } }
//
// Idempotent (skips a doc whose hero CTAs already have the localized titles +
// the right hrefs). Dry-run by default; --apply to write. Refuses production.
// Backs up the affected homepage docs first.
//
// Env: same loader as set-hero-ctas.mjs (.env then .env.local; --env-dir=<path>
// to load env from another checkout, e.g. from a worktree without local env).
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
const fileEnv = { ...parseEnvFile(path.join(envDir, ".env")), ...parseEnvFile(path.join(envDir, ".env.local")) };
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

// Per-locale CTA labels. Standard imperative/infinitive button verbs.
//   Explore:     es Explorar · fr Explorer · ar استكشاف
//   Collaborate: es Colaborar · fr Collaborer · ar تعاون
const TITLES = {
  en: { explore: "Explore", collaborate: "Collaborate" },
  es: { explore: "Explorar", collaborate: "Colaborar" },
  fr: { explore: "Explorer", collaborate: "Collaborer" },
  ar: { explore: "استكشاف", collaborate: "تعاون" },
};

// Build the two desired links for a given language. href/variant/_key are stable
// across locales; only `title` is localized.
function desiredLinks(lang) {
  const t = TITLES[lang] || TITLES.en;
  return [
    {
      _key: "hero-cta-explore",
      _type: "link",
      title: t.explore,
      href: "/atlas",
      target: false,
      buttonVariant: { variant: "default", size: "default", stroke: "none" },
    },
    {
      _key: "hero-cta-collaborate",
      _type: "link",
      title: t.collaborate,
      href: "/collaborate",
      target: false,
      buttonVariant: { variant: "outline", size: "default", stroke: "none" },
    },
  ];
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

// Match the editor-meaningful fields against the localized target for this lang.
function linksMatch(existing, want) {
  if (!Array.isArray(existing) || existing.length !== want.length) return false;
  return want.every((w, i) => {
    const got = existing[i] || {};
    const bv = got.buttonVariant || {};
    return got.title === w.title && got.href === w.href && bv.variant === w.buttonVariant.variant;
  });
}

console.log(`Dataset: ${DS}  (apply=${apply})`);

const homepages = await q(`*[_type=="homepage"]{ _id, language, blocks }`);
console.log(`Found ${homepages.length} homepage doc(s).`);

const patches = [];
const backups = [];
for (const hp of homepages) {
  const lang = hp.language || "en";
  const want = desiredLinks(lang);
  const blocks = Array.isArray(hp.blocks) ? hp.blocks : [];
  const heroIdx = blocks.findIndex((b) => b && b._type === "hero-1");
  if (heroIdx === -1) {
    console.log(`  ${hp._id} (${lang}): no hero-1 block — skip`);
    continue;
  }
  const hero = blocks[heroIdx];
  if (linksMatch(hero.links, want)) {
    console.log(`  ${hp._id} (${lang}): hero[${heroIdx}] already localized — skip`);
    continue;
  }
  const before = (hero.links || []).map((l) => `${l?.title || "?"}`).join(" / ") || "(none)";
  const after = want.map((l) => l.title).join(" / ");
  console.log(`  ${hp._id} (${lang}): hero[${heroIdx}]  [${before}]  =>  [${after}]`);
  backups.push(hp);
  patches.push({ patch: { id: hp._id, set: { [`blocks[${heroIdx}].links`]: want } } });
}

if (!apply) {
  console.log(`\nDRY RUN — ${patches.length} doc(s) to update. Re-run with --apply.`);
  process.exit(0);
}
if (patches.length === 0) {
  console.log("Nothing to update — already localized.");
  process.exit(0);
}

const backupDir = env("BACKUP_DIR") || ".sanity-backups";
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `homepage-hero-ctas-localized-${DS}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backups, null, 2));
console.log(`Backed up ${backups.length} homepage doc(s) to ${backupPath}`);

await mutate(patches);
console.log(`Localized hero CTAs on ${patches.length} homepage doc(s) in ${DS}.`);
