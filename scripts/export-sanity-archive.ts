// Full archival export of a Sanity dataset + an integrity manifest.
// The .tar.gz lands in backups/ (gitignored); the manifest is committed.
//
// Usage:
//   npx tsx scripts/export-sanity-archive.ts            # development dataset
//   npx tsx scripts/export-sanity-archive.ts --prod     # production_2
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { buildManifest, type Manifest } from "./lib/sanity-archive-manifest";

// dotenv is a direct dependency; @next/env is not, and pnpm's strict layout
// means it is not reliably resolvable from a script.
dotenv.config({ path: ".env" });

const prod = process.argv.includes("--prod");
const dataset = prod ? "production_2" : process.env.NEXT_PUBLIC_SANITY_DATASET;
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_READ_TOKEN;

if (!dataset || !projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_DATASET / _PROJECT_ID / SANITY_API_READ_TOKEN");
  process.exit(1);
}

console.log(`Exporting project ${projectId}, dataset "${dataset}"`);

const stamp = new Date().toISOString().slice(0, 10);
const outDir = "backups";
const archive = path.join(outDir, `sanity-${dataset}-${stamp}.tar.gz`);
fs.mkdirSync(outDir, { recursive: true });

execFileSync(
  "pnpm",
  ["exec", "sanity", "dataset", "export", dataset, archive, "--overwrite"],
  { stdio: "inherit", env: { ...process.env, SANITY_AUTH_TOKEN: token } },
);

// Manifest is built from the live dataset, then checked against the archive.
const res = await fetch(
  `https://${projectId}.api.sanity.io/v${process.env.NEXT_PUBLIC_SANITY_API_VERSION}` +
    `/data/query/${dataset}?query=${encodeURIComponent("*[]{_id,_type}")}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!res.ok) {
  console.error(`Query failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const { result } = await res.json();

const manifest: Manifest = buildManifest(result, dataset);
manifest.archive = {
  file: path.basename(archive),
  bytes: fs.statSync(archive).size,
  sha256: createHash("sha256").update(fs.readFileSync(archive)).digest("hex"),
};

const manifestPath = "docs/migration/sanity-archive-manifest.json";
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`\nArchive:  ${archive} (${(manifest.archive.bytes / 1e6).toFixed(1)} MB)`);
console.log(`Manifest: ${manifestPath}`);
console.log(`Content:  ${manifest.totals.published} published + ${manifest.totals.drafts} drafts`);
