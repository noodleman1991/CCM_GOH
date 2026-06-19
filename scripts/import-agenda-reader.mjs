/**
 * ETL: import the Global Agenda chapters from the Docusaurus reader site into
 * Sanity `docsChapter` documents — properly CMS-integrated.
 *
 *   node scripts/import-agenda-reader.mjs            # dry-run (prints plan)
 *   node scripts/import-agenda-reader.mjs --apply    # uploads images + writes
 *
 * What it does:
 *   • Headings (h1–h4), paragraphs, lists → portable-text blocks.
 *   • Images → DOWNLOADED and UPLOADED to Sanity as real assets (so they get
 *     LQIP/dimensions and serve through the image pipeline), emitted as valid
 *     `image` blocks with localized alt/caption. Uploads are deduped by source.
 *   • Inline links → `link` annotation (external get target=_blank); links that
 *     point back at the Hub are rewritten to RELATIVE in-app routes so they
 *     resolve internally.
 *   • Figures (img + <figcaption>/following caption) keep their caption.
 *
 * Blocks match the `styled-block-content` schema (sanity/schemas/blocks/shared)
 * so the content is fully editable in Studio and renders via PortableTextRenderer.
 */
import * as cheerio from "cheerio";
import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";
import "dotenv/config";

const SITE = "https://reader.connectingclimateminds.org";
const COLLECTION = "global-agenda";
const APPLY = process.argv.includes("--apply");

// Hosts that are "us" — links to these become relative in-app routes.
const HUB_HOSTS = ["hub.connectingclimateminds.org", "connectingclimateminds.org"];

const ORDER = [
  "Cover", "Forward", "Executive Summary", "Image Attribution", "Introduction",
  "Background Context", "Methods", "Global Research and Action Agenda",
  "Global Research Agenda", "Global Action Agenda", "Conclusion and Call to Action",
  "Contributors to this Agenda", "Appendices",
];

const key = () => randomUUID().slice(0, 8);
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 96);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-10-31",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

/**
 * Normalize an href: Hub links → relative in-app path; others returned as-is.
 * Returns { href, internal }.
 */
function normalizeHref(raw) {
  if (!raw) return null;
  try {
    if (raw.startsWith("/")) return { href: raw, internal: true };
    const u = new URL(raw);
    if (HUB_HOSTS.includes(u.hostname)) {
      // Map to a relative path so it's an in-app link.
      const path = u.pathname === "/default" ? "/" : u.pathname;
      return { href: path + u.search + u.hash, internal: true };
    }
    if (/^https?:$/.test(u.protocol) || u.protocol === "mailto:") {
      return { href: raw, internal: false };
    }
  } catch {
    // relative or odd href
    return { href: raw, internal: true };
  }
  return null;
}

/**
 * Upload an image (by absolute URL) to Sanity once; cache by URL so the same
 * asset isn't uploaded twice. Returns the asset _id, or null on failure.
 */
const assetCache = new Map();
async function uploadImage(absUrl) {
  if (assetCache.has(absUrl)) return assetCache.get(absUrl);
  if (!APPLY) {
    // Dry run: don't upload, just record intent.
    assetCache.set(absUrl, "image-DRYRUN");
    return "image-DRYRUN";
  }
  try {
    const res = await fetch(absUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = decodeURIComponent(absUrl.split("/").pop().split("?")[0]) || "image";
    const asset = await client.assets.upload("image", buf, { filename });
    assetCache.set(absUrl, asset._id);
    return asset._id;
  } catch (e) {
    console.warn(`  ! image upload failed (${absUrl}): ${e.message}`);
    assetCache.set(absUrl, null);
    return null;
  }
}

/** Build inline spans + markDefs for the children of a text element. */
function inlineSpans($, el) {
  const spans = [];
  const markDefs = [];
  const walk = (node, activeMarks) => {
    if (node.type === "text") {
      if (node.data) spans.push({ _key: key(), _type: "span", text: node.data, marks: [...activeMarks] });
      return;
    }
    if (node.type !== "tag") return;
    const t = node.tagName;
    if (t === "a") {
      const norm = normalizeHref($(node).attr("href"));
      if (norm) {
        const mk = key();
        markDefs.push(
          norm.internal
            ? { _key: mk, _type: "link", href: norm.href }
            : { _key: mk, _type: "link", href: norm.href, target: true }
        );
        $(node).contents().each((_, c) => walk(c, [...activeMarks, mk]));
      } else {
        $(node).contents().each((_, c) => walk(c, activeMarks));
      }
    } else if (t === "strong" || t === "b") {
      $(node).contents().each((_, c) => walk(c, [...activeMarks, "strong"]));
    } else if (t === "em" || t === "i") {
      $(node).contents().each((_, c) => walk(c, [...activeMarks, "em"]));
    } else if (t === "u") {
      $(node).contents().each((_, c) => walk(c, [...activeMarks, "underline"]));
    } else if (t === "br") {
      spans.push({ _key: key(), _type: "span", text: "\n", marks: [...activeMarks] });
    } else {
      $(node).contents().each((_, c) => walk(c, activeMarks));
    }
  };
  $(el).contents().each((_, c) => walk(c, []));
  return { spans, markDefs };
}

/** Convert a chapter container into portable-text blocks (async — uploads images). */
async function toBlocks($, container) {
  const blocks = [];
  let imgCount = 0;

  const pushText = (style, el) => {
    const { spans, markDefs } = inlineSpans($, el);
    if (spans.some((s) => s.text.trim())) {
      blocks.push({ _key: key(), _type: "block", style, markDefs, children: spans });
    }
  };

  const pushImage = async (imgEl, captionText) => {
    const src = $(imgEl).attr("src");
    if (!src) return;
    const absUrl = src.startsWith("http") ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`;
    const altText = ($(imgEl).attr("alt") || "").trim();
    const assetId = await uploadImage(absUrl);
    imgCount++;
    const block = {
      _key: key(),
      _type: "image",
      asset: assetId ? { _type: "reference", _ref: assetId } : undefined,
      alt: altText ? { en: altText } : undefined,
      caption: captionText ? { en: captionText } : undefined,
      _srcUrl: absUrl, // dry-run visibility only; stripped before write
    };
    blocks.push(block);
  };

  // Iterate children in document order.
  const children = container.children().toArray();
  for (const el of children) {
    const tag = el.tagName;
    if (tag === "h1" || tag === "header") pushText("h2", el);
    else if (tag === "h2") pushText("h2", el);
    else if (tag === "h3") pushText("h3", el);
    else if (tag === "h4") pushText("h4", el);
    else if (tag === "p") {
      // A paragraph may wrap an image (Docusaurus often does <p><img></p>).
      const imgs = $(el).find("img").toArray();
      if (imgs.length) {
        for (const im of imgs) await pushImage(im, "");
      } else {
        pushText("normal", el);
      }
    } else if (tag === "blockquote") {
      pushText("blockquote", el);
    } else if (tag === "figure") {
      const im = $(el).find("img").first();
      const cap = $(el).find("figcaption").first().text().trim();
      if (im.length) await pushImage(im.get(0), cap);
    } else if (tag === "img") {
      await pushImage(el, "");
    } else if (tag === "ul" || tag === "ol") {
      $(el).children("li").each((__, li) => {
        const { spans, markDefs } = inlineSpans($, li);
        if (spans.some((s) => s.text.trim())) {
          blocks.push({
            _key: key(), _type: "block", style: "normal",
            listItem: tag === "ol" ? "number" : "bullet", level: 1,
            markDefs, children: spans,
          });
        }
      });
    } else if (tag === "div" || tag === "table" || tag === "section") {
      // Wrappers (Docusaurus admonitions, table layouts) can contain images
      // and text. Pull any images out in order, then any leftover paragraph
      // text, so nothing is silently dropped.
      const imgs = $(el).find("img").toArray();
      for (const im of imgs) {
        const cap = $(im).closest("figure").find("figcaption").first().text().trim();
        await pushImage(im, cap);
      }
      // Capture table-cell / paragraph text inside the wrapper as plain blocks.
      $(el).find("p, td, th").each((__, cell) => {
        if ($(cell).find("img").length) return; // already handled as image
        const { spans, markDefs } = inlineSpans($, cell);
        if (spans.some((s) => s.text.trim())) {
          blocks.push({ _key: key(), _type: "block", style: "normal", markDefs, children: spans });
        }
      });
    }
  }
  return { blocks, imgCount };
}

async function chapterUrls() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1]));
  return locs.filter((u) => u !== `${SITE}/` && !u.endsWith("/"));
}

async function run() {
  const urls = await chapterUrls();
  const docs = [];
  let totalImgs = 0;

  for (const url of urls) {
    const name = decodeURIComponent(url.replace(`${SITE}/`, ""));
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);
    const container = $(".theme-doc-markdown.markdown").first();
    if (!container.length) {
      console.warn(`! no markdown container for ${name}`);
      continue;
    }
    const { blocks, imgCount } = await toBlocks($, container);
    totalImgs += imgCount;
    const order = (ORDER.indexOf(name) === -1 ? 99 : ORDER.indexOf(name)) + 1;
    docs.push({
      _id: `docsChapter-${COLLECTION}-${slugify(name)}`,
      _type: "docsChapter",
      collection: COLLECTION,
      title: name,
      slug: { _type: "slug", current: slugify(name) },
      order,
      body: blocks,
    });
  }

  docs.sort((a, b) => a.order - b.order);
  console.log(`\nParsed ${docs.length} chapters (${totalImgs} images, ${assetCache.size} unique):`);
  for (const d of docs) {
    const imgs = d.body.filter((b) => b._type === "image").length;
    console.log(`  ${d.order}. ${d.title} (${d.body.length} blocks, ${imgs} images)`);
  }

  if (!APPLY) {
    console.log("\nDry run — nothing uploaded or written. Re-run with --apply.");
    return;
  }

  // Strip dry-run-only fields, drop images that failed to upload (no asset).
  for (const d of docs) {
    d.body = d.body
      .filter((b) => b._type !== "image" || b.asset)
      .map((b) => {
        if (b._type === "image") { const { _srcUrl, ...rest } = b; return rest; }
        return b;
      });
  }

  let tx = client.transaction();
  for (const d of docs) tx = tx.createOrReplace(d);
  await tx.commit();
  console.log(`\n✓ Wrote ${docs.length} docsChapter documents (${assetCache.size} images uploaded).`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
