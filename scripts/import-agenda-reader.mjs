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
 * asset isn't uploaded twice. Returns { id, width, height } (id null on failure).
 */
const assetCache = new Map();
async function uploadImage(absUrl) {
  if (assetCache.has(absUrl)) return assetCache.get(absUrl);
  if (!APPLY) {
    const result = { id: "image-DRYRUN", width: 0, height: 0 };
    assetCache.set(absUrl, result);
    return result;
  }
  try {
    const res = await fetch(absUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = decodeURIComponent(absUrl.split("/").pop().split("?")[0]) || "image";
    const asset = await client.assets.upload("image", buf, { filename });
    const dims = asset.metadata?.dimensions || {};
    const result = { id: asset._id, width: dims.width || 0, height: dims.height || 0 };
    assetCache.set(absUrl, result);
    return result;
  } catch (e) {
    console.warn(`  ! image upload failed (${absUrl}): ${e.message}`);
    const result = { id: null, width: 0, height: 0 };
    assetCache.set(absUrl, result);
    return result;
  }
}

/** Build inline spans + markDefs for the children of a text element. */
function inlineSpans($, el, footnotes = {}) {
  const spans = [];
  const markDefs = [];
  const walk = (node, activeMarks) => {
    if (node.type === "text") {
      if (node.data) spans.push({ _key: key(), _type: "span", text: node.data, marks: [...activeMarks] });
      return;
    }
    if (node.type !== "tag") return;
    const t = node.tagName;
    // Footnote reference: <sup><a href="#footnoteN">N</a></sup> → footnote mark.
    if (t === "sup") {
      const a = $(node).find('a[href^="#"]').first();
      const anchor = (a.attr("href") || "").replace(/^#/, "");
      const noteText = footnotes[anchor];
      const label = $(node).text().trim();
      if (noteText) {
        const mk = key();
        markDefs.push({ _key: mk, _type: "footnote", text: noteText });
        spans.push({ _key: key(), _type: "span", text: label, marks: [...activeMarks, mk] });
        return;
      }
      // No matching definition — keep the marker as plain superscript text.
      if (label) spans.push({ _key: key(), _type: "span", text: label, marks: [...activeMarks] });
      return;
    }
    if (t === "a") {
      // Footnote-style anchor links (#footnoteN) without a <sup> wrapper.
      const rawHref = $(node).attr("href") || "";
      if (rawHref.startsWith("#")) {
        const noteText = footnotes[rawHref.replace(/^#/, "")];
        if (noteText) {
          const mk = key();
          markDefs.push({ _key: mk, _type: "footnote", text: noteText });
          spans.push({ _key: key(), _type: "span", text: $(node).text().trim(), marks: [...activeMarks, mk] });
          return;
        }
      }
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

/**
 * Build a map of footnote anchors → definition text from the chapter's footnote
 * list (Docusaurus renders <li value="N" id="footnoteN">text</li>). Returns the
 * map plus the set of <li> elements to skip when emitting body content.
 */
function collectFootnotes($, container) {
  const map = {};
  const skipLis = new Set();
  container.find("li[id^='footnote']").each((_, li) => {
    const id = $(li).attr("id");
    const text = $(li).text().trim();
    if (id && text) {
      map[id] = text;
      skipLis.add(li);
    }
  });
  return { map, skipLis };
}

/** Convert a chapter container into portable-text blocks (async — uploads images). */
async function toBlocks($, container, footnotes, skipLis) {
  const blocks = [];
  let imgCount = 0;
  // The chapter title is rendered separately as the page <h1>; skip the FIRST
  // heading in the body when it duplicates the title (fixes "double headers").
  let leadingHeadingSkipped = false;
  const chapterTitle = container.closest("article").find("h1").first().text().trim();

  const pushText = (style, el) => {
    const { spans, markDefs } = inlineSpans($, el, footnotes);
    if (spans.some((s) => s.text.trim())) {
      blocks.push({ _key: key(), _type: "block", style, markDefs, children: spans });
    }
  };

  const pushHeading = (style, el) => {
    const text = $(el).text().trim();
    // Drop a leading heading that just repeats the chapter/document title.
    if (!leadingHeadingSkipped && blocks.length === 0) {
      leadingHeadingSkipped = true;
      const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
      if (norm(text) === norm(chapterTitle) || norm(text).includes("research and action agenda")) {
        return;
      }
    }
    pushText(style, el);
  };

  const pushImage = async (imgEl, captionText) => {
    const src = $(imgEl).attr("src");
    if (!src) return;
    const absUrl = src.startsWith("http") ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`;
    const altText = ($(imgEl).attr("alt") || "").trim();
    const { id: assetId, width, height } = await uploadImage(absUrl);
    imgCount++;
    // Very wide, short images are sliced table fragments — render full width but
    // never upscaled (placement "full" + the renderer caps intrinsic size).
    const aspect = width && height ? width / height : 0;
    const placement = aspect > 3 ? "full" : "center";
    const block = {
      _key: key(),
      _type: "image",
      asset: assetId ? { _type: "reference", _ref: assetId } : undefined,
      alt: altText ? { en: altText } : undefined,
      caption: captionText ? { en: captionText } : undefined,
      placement,
      _srcUrl: absUrl, // dry-run visibility only; stripped before write
    };
    blocks.push(block);
  };

  // Iterate children in document order.
  const children = container.children().toArray();
  for (const el of children) {
    const tag = el.tagName;
    if (tag === "h1" || tag === "header") pushHeading("h2", el);
    else if (tag === "h2") pushHeading("h2", el);
    else if (tag === "h3") pushText("h3", el);
    else if (tag === "h4") pushText("h4", el);
    else if (tag === "p") {
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
        if (skipLis.has(li)) return; // footnote definition — handled as marks
        const { spans, markDefs } = inlineSpans($, li, footnotes);
        if (spans.some((s) => s.text.trim())) {
          blocks.push({
            _key: key(), _type: "block", style: "normal",
            listItem: tag === "ol" ? "number" : "bullet", level: 1,
            markDefs, children: spans,
          });
        }
      });
    } else if (tag === "div" || tag === "table" || tag === "section") {
      const imgs = $(el).find("img").toArray();
      for (const im of imgs) {
        const cap = $(im).closest("figure").find("figcaption").first().text().trim();
        await pushImage(im, cap);
      }
      $(el).find("p, td, th").each((__, cell) => {
        if ($(cell).find("img").length) return;
        const { spans, markDefs } = inlineSpans($, cell, footnotes);
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

  let totalFootnotes = 0;
  for (const url of urls) {
    const name = decodeURIComponent(url.replace(`${SITE}/`, ""));
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);
    const container = $(".theme-doc-markdown.markdown").first();
    if (!container.length) {
      console.warn(`! no markdown container for ${name}`);
      continue;
    }
    const { map: footnotes, skipLis } = collectFootnotes($, container);
    totalFootnotes += Object.keys(footnotes).length;
    const { blocks, imgCount } = await toBlocks($, container, footnotes, skipLis);
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
  console.log(`\nParsed ${docs.length} chapters (${totalImgs} images, ${assetCache.size} unique; ${totalFootnotes} footnotes):`);
  for (const d of docs) {
    const imgs = d.body.filter((b) => b._type === "image").length;
    const fns = d.body.reduce((n, b) => n + (b.markDefs?.filter((m) => m._type === "footnote").length || 0), 0);
    console.log(`  ${d.order}. ${d.title} (${d.body.length} blocks, ${imgs} images, ${fns} footnote refs)`);
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
