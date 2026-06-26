// Homepage H2 / Task 3: set the hero CTAs to Explore + Collaborate.
// For every homepage doc (all locales en/es/fr/ar), find the FIRST blocks[]
// item where _type=="hero-1" and set its `links` to exactly two buttons:
//   1. Explore     -> /atlas        (Primary,  variant "default")
//   2. Collaborate -> /collaborate  (Outline,  variant "outline")
//
// Link item shape matches sanity/schemas/blocks/shared/link.ts + the hero-1
// query projection (sanity/queries/hero/hero-1.ts):
//   { _key, _type: "link", title, href, target, buttonVariant: { variant, size, stroke } }
//
// Idempotent (skips a doc whose target hero already has exactly these links).
// Dry-run by default; --apply to write. Refuses production. Backs up the
// affected homepage docs first.
//
// Env: reads NEXT_PUBLIC_SANITY_* + a write token from process.env, falling
// back to a minimal .env.local / .env parser (.env.local wins) so it runs even
// without @next/env installed. Pass --env-dir=<path> to load env from another
// checkout (useful from a git worktree that has no local env files).
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

// The two CTAs we want, in order. _key is deterministic so re-runs converge.
const DESIRED_LINKS = [
  {
    _key: "hero-cta-explore",
    _type: "link",
    title: "Explore",
    href: "/atlas",
    target: false,
    buttonVariant: { variant: "default", size: "default", stroke: "none" },
  },
  {
    _key: "hero-cta-collaborate",
    _type: "link",
    title: "Collaborate",
    href: "/collaborate",
    target: false,
    buttonVariant: { variant: "outline", size: "default", stroke: "none" },
  },
];

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

// Compare only the editor-meaningful fields (ignore _key churn from prior runs).
function linksMatch(existing) {
  if (!Array.isArray(existing) || existing.length !== DESIRED_LINKS.length) return false;
  return DESIRED_LINKS.every((want, i) => {
    const got = existing[i] || {};
    const bv = got.buttonVariant || {};
    return (
      got.title === want.title &&
      got.href === want.href &&
      bv.variant === want.buttonVariant.variant
    );
  });
}

console.log(`Dataset: ${DS}  (apply=${apply})`);

const homepages = await q(`*[_type=="homepage"]{ _id, language, blocks }`);
console.log(`Found ${homepages.length} homepage doc(s).`);

const patches = [];
const backups = [];
for (const hp of homepages) {
  const blocks = Array.isArray(hp.blocks) ? hp.blocks : [];
  const heroIdx = blocks.findIndex((b) => b && b._type === "hero-1");
  if (heroIdx === -1) {
    console.log(`  ${hp._id} (${hp.language || "?"}): no hero-1 block — skip`);
    continue;
  }
  const hero = blocks[heroIdx];
  if (linksMatch(hero.links)) {
    console.log(`  ${hp._id} (${hp.language || "?"}): hero[${heroIdx}] already Explore+Collaborate — skip`);
    continue;
  }
  const before =
    (hero.links || []).map((l) => `${l?.title || "?"}→${l?.href || "?"}`).join(", ") || "(none)";
  const after = DESIRED_LINKS.map((l) => `${l.title}→${l.href} [${l.buttonVariant.variant}]`).join(", ");
  console.log(`  ${hp._id} (${hp.language || "?"}): hero[${heroIdx}]  ${before}  =>  ${after}`);
  backups.push(hp);
  // Set the links on the specific hero block by array index.
  patches.push({ patch: { id: hp._id, set: { [`blocks[${heroIdx}].links`]: DESIRED_LINKS } } });
}

if (!apply) {
  console.log(`\nDRY RUN — ${patches.length} doc(s) to update. Re-run with --apply.`);
  process.exit(0);
}
if (patches.length === 0) {
  console.log("Nothing to update — already up to date.");
  process.exit(0);
}

// Back up the affected homepage docs first. BACKUP_DIR can redirect this to a
// scratch path outside the repo; defaults to a gitignored in-repo folder.
const backupDir = env("BACKUP_DIR") || ".sanity-backups";
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `homepage-hero-ctas-${DS}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backups, null, 2));
console.log(`Backed up ${backups.length} homepage doc(s) to ${backupPath}`);

await mutate(patches);
console.log(`Updated hero CTAs on ${patches.length} homepage doc(s) in ${DS}.`);
