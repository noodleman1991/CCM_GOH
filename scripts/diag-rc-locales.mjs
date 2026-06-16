/**
 * Read-only inventory of regionalCommunityPage docs by locale + their
 * document-internationalization translation groups. No writes.
 *   node scripts/diag-rc-locales.mjs
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: "2024-10-31",
  useCdn: false,
});

const docs = await client.fetch(`*[_type == "regionalCommunityPage"]{
  _id, language, "slug": slug.current, "title": coalesce(title, welcomeHero.heading),
  "blocks": count(blocks), "hasContentFlow": defined(contentFlow), useTemplate
} | order(slug asc, language asc)`);

// translation.metadata groups (document-internationalization)
const meta = await client.fetch(`*[_type == "translation.metadata" &&
  references(*[_type=="regionalCommunityPage"]._id)]{
  _id, "langs": translations[].value->language, "ids": translations[].value->_id
}`);

const bySlug = {};
for (const d of docs) {
  (bySlug[d.slug] ||= []).push(d);
}

console.log("\n=== regionalCommunityPage docs by slug → locales present ===\n");
const LOCALES = ["en", "es", "fr", "ar"];
for (const [slug, list] of Object.entries(bySlug)) {
  const present = list.map((d) => d.language);
  const missing = LOCALES.filter((l) => !present.includes(l));
  console.log(`${slug}`);
  console.log(`   present: ${present.join(", ") || "(none)"}${missing.length ? `   MISSING: ${missing.join(", ")}` : "   ✓ all 4"}`);
  for (const d of list) {
    console.log(`     - ${d.language}  _id=${d._id}  blocks=${d.blocks}  template=${d.useTemplate ?? "?"}  flow=${d.hasContentFlow}`);
  }
}

console.log(`\n=== translation.metadata groups touching RC pages: ${meta.length} ===`);
for (const m of meta) {
  console.log(`   ${m._id}  langs=[${(m.langs || []).join(",")}]`);
}

console.log(`\nTotal RC docs: ${docs.length} across ${Object.keys(bySlug).length} slugs.`);
