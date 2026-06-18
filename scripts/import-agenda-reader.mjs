/**
 * ETL: import the Global Agenda chapters from the Docusaurus reader site into
 * Sanity `docsChapter` documents.
 *
 *   node scripts/import-agenda-reader.mjs            # dry-run (prints plan)
 *   node scripts/import-agenda-reader.mjs --apply    # writes to Sanity
 *
 * Conversion is best-effort: headings, paragraphs, lists, links, and images
 * (kept as external URLs — referenced via remotePatterns, not re-uploaded) map
 * to portable-text. Review the dry-run output; expect to tidy a few chapters by
 * hand in Studio afterward (Docusaurus HTML doesn't round-trip perfectly).
 */
import * as cheerio from "cheerio";
import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";
import "dotenv/config";

const SITE = "https://reader.connectingclimateminds.org";
const COLLECTION = "global-agenda";
const APPLY = process.argv.includes("--apply");

// Chapter order as shown in the reader's sidebar.
const ORDER = [
  "Cover", "Forward", "Executive Summary", "Image Attribution", "Introduction",
  "Background Context", "Methods", "Global Research and Action Agenda",
  "Global Research Agenda", "Global Action Agenda", "Conclusion and Call to Action",
  "Contributors to this Agenda", "Appendices",
];

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 96);

async function chapterUrls() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1]));
  return locs.filter((u) => u !== `${SITE}/` && !u.endsWith("/"));
}

/** Convert a chapter's markdown container into portable-text blocks. */
function toBlocks($, container) {
  const blocks = [];
  const pushText = (style, el) => {
    const spans = [];
    const markDefs = [];
    $(el).contents().each((_, node) => {
      if (node.type === "text") {
        spans.push({ _key: randomUUID().slice(0, 8), _type: "span", text: node.data, marks: [] });
      } else if (node.tagName === "a") {
        const href = $(node).attr("href");
        const key = randomUUID().slice(0, 8);
        if (href && /^https?:/.test(href)) {
          markDefs.push({ _key: key, _type: "link", href });
          spans.push({ _key: randomUUID().slice(0, 8), _type: "span", text: $(node).text(), marks: [key] });
        } else {
          spans.push({ _key: randomUUID().slice(0, 8), _type: "span", text: $(node).text(), marks: [] });
        }
      } else if (node.tagName === "strong" || node.tagName === "b") {
        spans.push({ _key: randomUUID().slice(0, 8), _type: "span", text: $(node).text(), marks: ["strong"] });
      } else if (node.tagName === "em" || node.tagName === "i") {
        spans.push({ _key: randomUUID().slice(0, 8), _type: "span", text: $(node).text(), marks: ["em"] });
      } else if (node.type === "tag") {
        spans.push({ _key: randomUUID().slice(0, 8), _type: "span", text: $(node).text(), marks: [] });
      }
    });
    if (spans.some((s) => s.text.trim())) {
      blocks.push({ _key: randomUUID().slice(0, 8), _type: "block", style, markDefs, children: spans });
    }
  };

  container.children().each((_, el) => {
    const tag = el.tagName;
    if (tag === "h1" || tag === "header") pushText("h2", el);
    else if (tag === "h2") pushText("h2", el);
    else if (tag === "h3") pushText("h3", el);
    else if (tag === "h4") pushText("h4", el);
    else if (tag === "p") pushText("normal", el);
    else if (tag === "ul" || tag === "ol") {
      $(el).children("li").each((__, li) => {
        const text = $(li).text().trim();
        if (text) {
          blocks.push({
            _key: randomUUID().slice(0, 8), _type: "block", style: "normal",
            listItem: tag === "ol" ? "number" : "bullet", level: 1, markDefs: [],
            children: [{ _key: randomUUID().slice(0, 8), _type: "span", text, marks: [] }],
          });
        }
      });
    }
  });
  return blocks;
}

async function run() {
  const urls = await chapterUrls();
  const docs = [];
  for (const url of urls) {
    const name = decodeURIComponent(url.replace(`${SITE}/`, ""));
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);
    const container = $(".theme-doc-markdown.markdown").first();
    if (!container.length) {
      console.warn(`! no markdown container for ${name}`);
      continue;
    }
    const body = toBlocks($, container);
    const order = (ORDER.indexOf(name) === -1 ? 99 : ORDER.indexOf(name)) + 1;
    docs.push({
      _id: `docsChapter-${COLLECTION}-${slugify(name)}`,
      _type: "docsChapter",
      collection: COLLECTION,
      title: name,
      slug: { _type: "slug", current: slugify(name) },
      order,
      body,
    });
  }

  docs.sort((a, b) => a.order - b.order);
  console.log(`\nParsed ${docs.length} chapters:`);
  for (const d of docs) console.log(`  ${d.order}. ${d.title} (${d.body.length} blocks)`);

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to write to Sanity.");
    return;
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: "2024-10-31",
    token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
    useCdn: false,
  });
  let tx = client.transaction();
  for (const d of docs) tx = tx.createOrReplace(d);
  await tx.commit();
  console.log(`\n✓ Wrote ${docs.length} docsChapter documents.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
