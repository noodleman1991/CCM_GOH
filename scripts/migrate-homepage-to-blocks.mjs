// Homepage redesign / H1: migrate the homepage's legacy fixed section fields
// into a blocks[] array, per locale. Idempotent (only writes when blocks is
// empty/absent). Dry-run by default; --apply to write. Refuses production.
// Backs up the source homepage docs first.
//
// FIELD_ORDER mirrors lib/homepage/blocks-from-fields.ts (the source of truth);
// duplicated here because this is plain .mjs.
import fs from "node:fs";
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
  console.error("Refusing: dataset is production. Run against development (staging).");
  process.exit(1);
}

const FIELD_ORDER = [
  ["heroWelcome", "hero-1"],
  ["globalAgenda", "split-row"],
  ["howToUse", "split-row"],
  ["agendasModule", "grid-row"],
  ["regionalCommunities", "grid-row"],
  ["news", "grid-row"],
  ["livedExperiences", "carousel-2"],
  ["collaboration", "split-row"],
  ["projectInfo", "split-row"],
  ["mentalHealthDefinition", "cta-1"],
  ["partnerLogos", "logo-cloud-1"],
];

function blocksFromFields(hp) {
  const out = [];
  for (const [field, type] of FIELD_ORDER) {
    const val = hp?.[field];
    if (val && typeof val === "object") {
      out.push({ ...val, _type: val._type || type, _key: val._key || `${type}-${field}` });
    }
  }
  return out;
}

const auth = { Authorization: "Bearer " + TOKEN };
const q = async (query) => {
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/query/${DS}?query=${encodeURIComponent(query)}`, { headers: auth });
  return (await r.json()).result;
};
const mutate = async (mutations) => {
  const r = await fetch(`https://${PID}.api.sanity.io/v${API}/data/mutate/${DS}`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`mutate HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
};

console.log(`Dataset: ${DS}  (apply=${apply})`);

const homepages = await q(`*[_type=="homepage"]{ _id, language, "hasBlocks": count(blocks) > 0, heroWelcome, globalAgenda, howToUse, agendasModule, regionalCommunities, news, livedExperiences, collaboration, projectInfo, mentalHealthDefinition, partnerLogos }`);
console.log(`Found ${homepages.length} homepage doc(s).`);

const patches = [];
for (const hp of homepages) {
  if (hp.hasBlocks) {
    console.log(`  ${hp._id} (${hp.language || "?"}): already has blocks — skip`);
    continue;
  }
  const blocks = blocksFromFields(hp);
  console.log(`  ${hp._id} (${hp.language || "?"}): ${blocks.length} blocks (${blocks.map((b) => b._type).join(", ")})`);
  if (blocks.length > 0) patches.push({ patch: { id: hp._id, set: { blocks } } });
}

if (!apply) {
  console.log(`\nDRY RUN — ${patches.length} doc(s) to migrate. Re-run with --apply.`);
  process.exit(0);
}
if (patches.length === 0) {
  console.log("Nothing to migrate — already up to date.");
  process.exit(0);
}

fs.mkdirSync(".sanity-backups", { recursive: true });
fs.writeFileSync(`.sanity-backups/homepage-source-${DS}.json`, JSON.stringify(homepages, null, 2));
console.log(`Backed up ${homepages.length} homepage doc(s) to .sanity-backups/homepage-source-${DS}.json`);

await mutate(patches);
console.log(`Migrated ${patches.length} homepage doc(s) to blocks[] in ${DS}.`);
