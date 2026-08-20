// Phase 6 / A3: migrate `agenda` documents → `researchOutput`.
// Each agenda's files[] (per-language file) becomes a documentVersion (kind=full,
// lang). agendaType → outputType; title/subtitle/description/coverImage/year/
// organizations/regionalCommunities/tags carried; region backfilled from the
// first related community; status=approved (agendas are published).
//
// Idempotent via researchOutput.migratedFromReport == agenda._id.
// Dry-run by default; --apply to write. Refuses production. Exports a backup
// of the source agendas first.
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

// Production is refused unless explicitly acknowledged, so a stray env can
// never point a staging-intent run at live content.
const ackProd = process.argv.includes("--i-understand-this-is-production");
if (DS === "production_2" && !ackProd) {
  console.error(
    "Refusing: dataset is production. Run against development (staging), or\n" +
      "pass --i-understand-this-is-production to promote deliberately."
  );
  process.exit(1);
}

// agendaType → researchOutput.outputType (best-effort mapping to the 4 codes).
const OUTPUT_TYPE = {
  research: "report",
  annual: "report",
  policy: "guideline",
  technical: "report",
  "case-study": "report",
  whitepaper: "report",
  guidelines: "guideline",
  agenda: "report",
  minutes: "report",
  other: "report",
};

const SLUG_TO_SHORT = {
  "sub-saharan-africa": "ssa", "northern-africa-and-western-asia": "nawa",
  "central-and-southern-asia": "csa", "eastern-and-south-eastern-asia": "esea",
  "latin-america-and-the-caribbean": "lac", oceania: "oce", "europe-and-northern-america": "enam",
};

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

const agendas = await q(`*[_type=="agenda"]{
  _id, title, subtitle, description, coverImage, agendaType, publishDate, year, featured,
  files, organizations, tags,
  regionalCommunities,
  "rcSlugs": regionalCommunities[]->slug.current
}`);
console.log(`Found ${agendas.length} agenda docs.`);

// Which agendas are already migrated?
const existing = await q(`*[_type=="researchOutput" && defined(migratedFromReport)].migratedFromReport`);
const done = new Set(existing || []);

const toCreate = [];
for (const a of agendas) {
  if (done.has(a._id)) continue;
  const region = (a.rcSlugs || []).map((s) => SLUG_TO_SHORT[s]).find(Boolean) || undefined;
  const versions = (a.files || []).map((f, i) => ({
    _type: "documentVersion",
    _key: `v${i}`,
    kind: "full",
    lang: f.language || "en",
    file: f.file,
    downloadCount: f.downloadCount || 0,
  }));
  toCreate.push({
    create: {
      _type: "researchOutput",
      // Deterministic id so re-runs converge.
      _id: `researchOutput-from-${a._id}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
      title: a.title,
      excerpt: a.description,
      slug: { _type: "slug", current: (a.title?.en || a.title?.es || "research-output").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) },
      outputType: OUTPUT_TYPE[a.agendaType] || "report",
      layout: "report",
      coverImage: a.coverImage,
      versions,
      region,
      relatedCommunities: a.regionalCommunities,
      organizations: a.organizations,
      tags: a.tags,
      status: "approved",
      publishDate: a.publishDate ? new Date(a.publishDate).toISOString() : undefined,
      year: a.year,
      featured: !!a.featured,
      migratedFromReport: a._id,
    },
  });
}

console.log(`${toCreate.length} agendas to migrate (${done.size} already done).`);
if (!apply) {
  console.log("\nDRY RUN — re-run with --apply to write. Sample:");
  if (toCreate[0]) console.log(JSON.stringify({ id: toCreate[0].create._id, title: toCreate[0].create.title?.en, versions: toCreate[0].create.versions.length, region: toCreate[0].create.region }, null, 1));
  process.exit(0);
}
if (toCreate.length === 0) { console.log("Nothing to migrate — already up to date."); process.exit(0); }

// Backup the source agendas first.
fs.mkdirSync(".sanity-backups", { recursive: true });
fs.writeFileSync(`.sanity-backups/agenda-source-${DS}.json`, JSON.stringify(agendas, null, 2));
console.log(`Backed up ${agendas.length} agendas to .sanity-backups/agenda-source-${DS}.json`);

for (let i = 0; i < toCreate.length; i += 25) await mutate(toCreate.slice(i, i + 25));
console.log(`Created ${toCreate.length} researchOutput docs in ${DS}.`);
